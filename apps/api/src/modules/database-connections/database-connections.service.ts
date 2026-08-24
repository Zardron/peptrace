import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { MongoClient, type MongoClientOptions } from "mongodb";
import mysql from "mysql2/promise";
import { isIP } from "node:net";
import { Client as PostgresClient, type ClientConfig as PostgresClientConfig } from "pg";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { DatabaseCredentialEncryptionService } from "./database-credential-encryption.service";
import {
  DatabaseConnectionMode,
  DatabaseProvider,
  DatabaseSslMode,
  UpsertDatabaseConnectionDto
} from "./database-connections.dto";

const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
const CONNECTION_TIMEOUT_MS = 5_000;

type StoredConnection = {
  authSource: string | null;
  connectionMode: string;
  createdAt: Date;
  databaseName: string;
  displayName: string;
  host: string;
  id: string;
  lastTestedAt: Date | null;
  lastTestMessage: string | null;
  passwordAuthTag: Uint8Array | null;
  passwordCiphertext: Uint8Array | null;
  passwordIv: Uint8Array | null;
  passwordKeyId: string | null;
  port: number;
  provider: string;
  replicaSet: string | null;
  schemaName: string | null;
  sslMode: string;
  status: string;
  tenantId: string;
  updatedAt: Date;
  updatedByEmail: string;
  updatedById: string;
  useSrv: boolean;
  username: string | null;
};

@Injectable()
export class DatabaseConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: DatabaseCredentialEncryptionService
  ) {}

  async listConnections(user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    const tenants = await this.prisma.clientTenant.findMany({
      include: { databaseConnection: true },
      orderBy: { name: "asc" },
      where: {
        whiteLabelPanel: {
          isNot: null
        }
      }
    });

    return {
      recommendedProvider: DatabaseProvider.POSTGRESQL,
      clients: tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        dataRegion: tenant.dataRegion,
        mode: tenant.databaseConnection ? "DEDICATED" : "SHARED",
        connection: tenant.databaseConnection ? this.toPayload(tenant.databaseConnection) : null
      }))
    };
  }

  getProviderCatalog(user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    return {
      recommendation: {
        provider: DatabaseProvider.POSTGRESQL,
        summary:
          "PostgreSQL is the recommended default for relational client, account, access, audit, and billing data. Supabase is a managed PostgreSQL option."
      },
      providers: [
        {
          id: DatabaseProvider.POSTGRESQL,
          name: "PostgreSQL",
          defaultPort: 5432,
          requiredFields: ["host", "port", "databaseName", "username", "password", "sslMode"],
          optionalFields: ["schemaName"],
          notes: "Recommended default. Use SSL verification for production connections."
        },
        {
          id: DatabaseProvider.SUPABASE,
          name: "Supabase Postgres",
          defaultPort: 5432,
          requiredFields: [
            "host",
            "port",
            "databaseName",
            "username",
            "password",
            "sslMode",
            "connectionMode"
          ],
          optionalFields: ["schemaName"],
          notes: "Use direct or session pooling for persistent servers; transaction pooling is intended for serverless workloads."
        },
        {
          id: DatabaseProvider.MYSQL,
          name: "MySQL",
          defaultPort: 3306,
          requiredFields: ["host", "port", "databaseName", "username", "password", "sslMode"],
          optionalFields: [],
          notes: "Supported through the MySQL2 driver with TLS enabled for production connections."
        },
        {
          id: DatabaseProvider.MONGODB,
          name: "MongoDB",
          defaultPort: 27017,
          requiredFields: ["host", "port", "databaseName", "sslMode"],
          optionalFields: ["username", "password", "authSource", "replicaSet", "useSrv"],
          notes: "Use SRV for Atlas clusters. Authentication can be omitted only for explicitly unsecured development databases."
        }
      ]
    };
  }

  async upsertConnection(tenantId: string, dto: UpsertDatabaseConnectionDto, user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    this.validateConnectionInput(dto);

    const [tenant, existing] = await Promise.all([
      this.prisma.clientTenant.findUnique({ where: { id: tenantId }, select: { id: true } }),
      this.prisma.clientDatabaseConnection.findUnique({ where: { tenantId } })
    ]);
    if (!tenant) {
      throw new NotFoundException("Client tenant not found");
    }

    if (dto.provider !== DatabaseProvider.MONGODB && !dto.username?.trim()) {
      throw new BadRequestException("Username is required for PostgreSQL, Supabase, and MySQL connections");
    }
    if (dto.provider !== DatabaseProvider.MONGODB && !dto.password && !existing?.passwordCiphertext) {
      throw new BadRequestException("Password is required when creating this database connection");
    }

    const encryptedPassword = dto.password
      ? this.encryption.encrypt(dto.password, this.passwordAad(tenantId))
      : null;
    const connectionData = {
      provider: dto.provider,
      displayName: dto.displayName.trim(),
      host: this.normalizeHost(dto.host),
      port: dto.port,
      databaseName: dto.databaseName.trim(),
      username: dto.username?.trim() || null,
      sslMode: dto.sslMode,
      connectionMode: dto.connectionMode,
      schemaName: this.supportsSchema(dto.provider) ? dto.schemaName?.trim() || "public" : null,
      authSource: dto.provider === DatabaseProvider.MONGODB ? dto.authSource?.trim() || "admin" : null,
      replicaSet: dto.provider === DatabaseProvider.MONGODB ? dto.replicaSet?.trim() || null : null,
      useSrv: dto.provider === DatabaseProvider.MONGODB && Boolean(dto.useSrv),
      status: "NOT_TESTED",
      lastTestedAt: null,
      lastTestMessage: "Configuration changed; run a connection test.",
      updatedById: user.id,
      updatedByEmail: user.email,
      ...(encryptedPassword
        ? {
            passwordCiphertext: encryptedPassword.ciphertext,
            passwordIv: encryptedPassword.encryptionIv,
            passwordAuthTag: encryptedPassword.authenticationTag,
            passwordKeyId: encryptedPassword.encryptionKeyId
          }
        : {})
    };

    const connection = await this.prisma.clientDatabaseConnection.upsert({
      where: { tenantId },
      create: { tenantId, ...connectionData },
      update: connectionData
    });
    await this.writeAudit(user, "DATABASE_CONNECTION_UPSERT", tenantId, {
      provider: connection.provider,
      status: connection.status
    });
    return this.toPayload(connection);
  }

  async testConnection(tenantId: string, user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    const connection = await this.prisma.clientDatabaseConnection.findUnique({ where: { tenantId } });
    if (!connection) {
      throw new NotFoundException("This client uses the shared platform database and has no dedicated connection to test");
    }

    let status = "CONNECTED";
    let message = "Connection successful.";
    try {
      await this.runConnectionTest(connection);
    } catch (error) {
      status = "FAILED";
      message = this.safeErrorMessage(error);
    }

    const updated = await this.prisma.clientDatabaseConnection.update({
      where: { tenantId },
      data: {
        status,
        lastTestedAt: new Date(),
        lastTestMessage: message,
        updatedById: user.id,
        updatedByEmail: user.email
      }
    });
    await this.writeAudit(user, "DATABASE_CONNECTION_TEST", tenantId, {
      status,
      success: status === "CONNECTED"
    });

    return { success: status === "CONNECTED", connection: this.toPayload(updated) };
  }

  async useSharedDatabase(tenantId: string, user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    const tenant = await this.prisma.clientTenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) {
      throw new NotFoundException("Client tenant not found");
    }
    await this.prisma.clientDatabaseConnection.deleteMany({ where: { tenantId } });
    await this.writeAudit(user, "DATABASE_CONNECTION_USE_SHARED", tenantId, {});
    return { tenantId, mode: "SHARED", connection: null };
  }

  private async runConnectionTest(connection: StoredConnection): Promise<void> {
    this.assertAllowedTestHost(connection.host);
    const password = this.decryptPassword(connection);

    if (connection.provider === DatabaseProvider.MONGODB) {
      await this.testMongo(connection, password);
      return;
    }
    if (connection.provider === DatabaseProvider.MYSQL) {
      await this.testMysql(connection, password);
      return;
    }
    await this.testPostgres(connection, password);
  }

  private async testPostgres(connection: StoredConnection, password: string | undefined): Promise<void> {
    const config: PostgresClientConfig = {
      host: connection.host,
      port: connection.port,
      database: connection.databaseName,
      user: connection.username ?? undefined,
      password,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
      query_timeout: CONNECTION_TIMEOUT_MS,
      ssl: this.postgresSsl(connection.sslMode)
    };
    const client = new PostgresClient(config);
    try {
      await client.connect();
      await client.query("SELECT 1");
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  private async testMysql(connection: StoredConnection, password: string | undefined): Promise<void> {
    const client = await mysql.createConnection({
      host: connection.host,
      port: connection.port,
      database: connection.databaseName,
      user: connection.username ?? undefined,
      password,
      connectTimeout: CONNECTION_TIMEOUT_MS,
      ssl:
        connection.sslMode === DatabaseSslMode.DISABLE
          ? undefined
          : { rejectUnauthorized: connection.sslMode !== DatabaseSslMode.REQUIRE }
    });
    try {
      await client.query("SELECT 1");
    } finally {
      await client.end();
    }
  }

  private async testMongo(connection: StoredConnection, password: string | undefined): Promise<void> {
    const scheme = connection.useSrv ? "mongodb+srv" : "mongodb";
    const authority = connection.useSrv ? connection.host : `${this.hostForUri(connection.host)}:${connection.port}`;
    const options: MongoClientOptions = {
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT_MS,
      connectTimeoutMS: CONNECTION_TIMEOUT_MS,
      tls: connection.sslMode !== DatabaseSslMode.DISABLE,
      authSource: connection.authSource ?? undefined,
      replicaSet: connection.replicaSet ?? undefined,
      ...(connection.username && password
        ? { auth: { username: connection.username, password } }
        : {})
    };
    const client = new MongoClient(`${scheme}://${authority}/${encodeURIComponent(connection.databaseName)}`, options);
    try {
      await client.connect();
      await client.db(connection.databaseName).command({ ping: 1 });
    } finally {
      await client.close().catch(() => undefined);
    }
  }

  private decryptPassword(connection: StoredConnection): string | undefined {
    if (
      !connection.passwordCiphertext ||
      !connection.passwordIv ||
      !connection.passwordAuthTag ||
      !connection.passwordKeyId
    ) {
      return undefined;
    }
    return this.encryption.decrypt(
      connection.passwordCiphertext,
      connection.passwordIv,
      connection.passwordAuthTag,
      this.passwordAad(connection.tenantId),
      connection.passwordKeyId
    );
  }

  private validateConnectionInput(dto: UpsertDatabaseConnectionDto): void {
    this.normalizeHost(dto.host);
    if (dto.provider === DatabaseProvider.SUPABASE) {
      const validModes = new Set([
        DatabaseConnectionMode.DIRECT,
        DatabaseConnectionMode.SESSION_POOLER,
        DatabaseConnectionMode.TRANSACTION_POOLER
      ]);
      if (!validModes.has(dto.connectionMode)) {
        throw new BadRequestException("Supabase requires direct, session pooler, or transaction pooler mode");
      }
    } else if (dto.connectionMode !== DatabaseConnectionMode.STANDARD) {
      throw new BadRequestException("Only Supabase supports selectable connection modes");
    }
  }

  private normalizeHost(value: string): string {
    const host = value.trim().replace(/^\[|\]$/g, "");
    if (!host || /[\s/@?#]/.test(host) || (!isIP(host) && !/^(?=.{1,253}$)[a-zA-Z0-9.-]+$/.test(host))) {
      throw new BadRequestException("Host must be a hostname or IP address without a scheme, path, or port");
    }
    return host;
  }

  private assertAllowedTestHost(host: string): void {
    const normalized = host.toLowerCase();
    if (
      normalized === "169.254.169.254" ||
      normalized === "metadata.google.internal" ||
      normalized === "100.100.100.200" ||
      normalized.startsWith("169.254.") ||
      normalized.startsWith("fe80:")
    ) {
      throw new BadRequestException("Connections to cloud metadata and link-local addresses are not allowed");
    }
  }

  private postgresSsl(mode: string): false | { rejectUnauthorized: boolean } {
    if (mode === DatabaseSslMode.DISABLE) {
      return false;
    }
    return { rejectUnauthorized: mode !== DatabaseSslMode.REQUIRE };
  }

  private safeErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : "Unknown connection error";
    if (/password authentication failed|authentication failed|auth failed|access denied/i.test(message)) {
      return "Authentication failed. Check the username, password, and authentication database.";
    }
    if (/timeout|timed out|server selection/i.test(message)) {
      return "Connection timed out. Check the host, port, firewall, and network allowlist.";
    }
    if (/certificate|ssl|tls/i.test(message)) {
      return "TLS verification failed. Check the SSL mode and the database server certificate.";
    }
    return `Connection failed: ${message.replace(/[\r\n]+/g, " ").slice(0, 180)}`;
  }

  private toPayload(connection: StoredConnection) {
    return {
      id: connection.id,
      tenantId: connection.tenantId,
      provider: connection.provider,
      displayName: connection.displayName,
      host: connection.host,
      port: connection.port,
      databaseName: connection.databaseName,
      username: connection.username,
      hasPassword: Boolean(connection.passwordCiphertext),
      sslMode: connection.sslMode,
      connectionMode: connection.connectionMode,
      schemaName: connection.schemaName,
      authSource: connection.authSource,
      replicaSet: connection.replicaSet,
      useSrv: connection.useSrv,
      status: connection.status,
      lastTestedAt: connection.lastTestedAt?.toISOString() ?? null,
      lastTestMessage: connection.lastTestMessage,
      updatedByEmail: connection.updatedByEmail,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
      maskedConnectionString: this.maskedConnectionString(connection)
    };
  }

  private maskedConnectionString(connection: StoredConnection): string {
    const username = connection.username ? `${encodeURIComponent(connection.username)}:********@` : "";
    const databaseName = encodeURIComponent(connection.databaseName);
    if (connection.provider === DatabaseProvider.MONGODB) {
      const scheme = connection.useSrv ? "mongodb+srv" : "mongodb";
      const authority = connection.useSrv ? connection.host : `${this.hostForUri(connection.host)}:${connection.port}`;
      return `${scheme}://${username}${authority}/${databaseName}`;
    }
    const scheme = connection.provider === DatabaseProvider.MYSQL ? "mysql" : "postgresql";
    return `${scheme}://${username}${this.hostForUri(connection.host)}:${connection.port}/${databaseName}`;
  }

  private hostForUri(host: string): string {
    return isIP(host) === 6 ? `[${host}]` : host;
  }

  private supportsSchema(provider: DatabaseProvider): boolean {
    return provider === DatabaseProvider.POSTGRESQL || provider === DatabaseProvider.SUPABASE;
  }

  private passwordAad(tenantId: string): string {
    return `client-database-connection:${tenantId}`;
  }

  private writeAudit(
    user: AuthenticatedAdminUser,
    action: string,
    tenantId: string,
    metadata: Prisma.InputJsonObject
  ) {
    return this.prisma.platformAuditEvent.create({
      data: {
        action,
        actorId: user.id,
        metadata,
        tenantId
      }
    });
  }

  private assertSuperadmin(user: AuthenticatedAdminUser): void {
    if (!SUPERADMIN_ROLES.has(user.role) || user.tenantId) {
      throw new ForbiddenException("Only platform superadmins can manage client database connections");
    }
  }
}
