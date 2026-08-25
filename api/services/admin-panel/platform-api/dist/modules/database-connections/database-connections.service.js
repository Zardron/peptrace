"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnectionsService = void 0;
const common_1 = require("@nestjs/common");
const mongodb_1 = require("mongodb");
const promise_1 = __importDefault(require("mysql2/promise"));
const node_net_1 = require("node:net");
const pg_1 = require("pg");
const prisma_service_1 = require("../prisma/prisma.service");
const database_credential_encryption_service_1 = require("./database-credential-encryption.service");
const database_connections_dto_1 = require("./database-connections.dto");
const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
const CONNECTION_TIMEOUT_MS = 5_000;
let DatabaseConnectionsService = class DatabaseConnectionsService {
    prisma;
    encryption;
    constructor(prisma, encryption) {
        this.prisma = prisma;
        this.encryption = encryption;
    }
    async listConnections(user) {
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
            recommendedProvider: database_connections_dto_1.DatabaseProvider.POSTGRESQL,
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
    getProviderCatalog(user) {
        this.assertSuperadmin(user);
        return {
            recommendation: {
                provider: database_connections_dto_1.DatabaseProvider.POSTGRESQL,
                summary: "PostgreSQL is the recommended default for relational client, account, access, audit, and billing data. Supabase is a managed PostgreSQL option."
            },
            providers: [
                {
                    id: database_connections_dto_1.DatabaseProvider.POSTGRESQL,
                    name: "PostgreSQL",
                    defaultPort: 5432,
                    requiredFields: ["host", "port", "databaseName", "username", "password", "sslMode"],
                    optionalFields: ["schemaName"],
                    notes: "Recommended default. Use SSL verification for production connections."
                },
                {
                    id: database_connections_dto_1.DatabaseProvider.SUPABASE,
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
                    id: database_connections_dto_1.DatabaseProvider.MYSQL,
                    name: "MySQL",
                    defaultPort: 3306,
                    requiredFields: ["host", "port", "databaseName", "username", "password", "sslMode"],
                    optionalFields: [],
                    notes: "Supported through the MySQL2 driver with TLS enabled for production connections."
                },
                {
                    id: database_connections_dto_1.DatabaseProvider.MONGODB,
                    name: "MongoDB",
                    defaultPort: 27017,
                    requiredFields: ["host", "port", "databaseName", "sslMode"],
                    optionalFields: ["username", "password", "authSource", "replicaSet", "useSrv"],
                    notes: "Use SRV for Atlas clusters. Authentication can be omitted only for explicitly unsecured development databases."
                }
            ]
        };
    }
    async upsertConnection(tenantId, dto, user) {
        this.assertSuperadmin(user);
        this.validateConnectionInput(dto);
        const [tenant, existing] = await Promise.all([
            this.prisma.clientTenant.findUnique({ where: { id: tenantId }, select: { id: true } }),
            this.prisma.clientDatabaseConnection.findUnique({ where: { tenantId } })
        ]);
        if (!tenant) {
            throw new common_1.NotFoundException("Client tenant not found");
        }
        if (dto.provider !== database_connections_dto_1.DatabaseProvider.MONGODB && !dto.username?.trim()) {
            throw new common_1.BadRequestException("Username is required for PostgreSQL, Supabase, and MySQL connections");
        }
        if (dto.provider !== database_connections_dto_1.DatabaseProvider.MONGODB && !dto.password && !existing?.passwordCiphertext) {
            throw new common_1.BadRequestException("Password is required when creating this database connection");
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
            authSource: dto.provider === database_connections_dto_1.DatabaseProvider.MONGODB ? dto.authSource?.trim() || "admin" : null,
            replicaSet: dto.provider === database_connections_dto_1.DatabaseProvider.MONGODB ? dto.replicaSet?.trim() || null : null,
            useSrv: dto.provider === database_connections_dto_1.DatabaseProvider.MONGODB && Boolean(dto.useSrv),
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
    async testConnection(tenantId, user) {
        this.assertSuperadmin(user);
        const connection = await this.prisma.clientDatabaseConnection.findUnique({ where: { tenantId } });
        if (!connection) {
            throw new common_1.NotFoundException("This client uses the shared platform database and has no dedicated connection to test");
        }
        let status = "CONNECTED";
        let message = "Connection successful.";
        try {
            await this.runConnectionTest(connection);
        }
        catch (error) {
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
    async useSharedDatabase(tenantId, user) {
        this.assertSuperadmin(user);
        const tenant = await this.prisma.clientTenant.findUnique({ where: { id: tenantId }, select: { id: true } });
        if (!tenant) {
            throw new common_1.NotFoundException("Client tenant not found");
        }
        await this.prisma.clientDatabaseConnection.deleteMany({ where: { tenantId } });
        await this.writeAudit(user, "DATABASE_CONNECTION_USE_SHARED", tenantId, {});
        return { tenantId, mode: "SHARED", connection: null };
    }
    async runConnectionTest(connection) {
        this.assertAllowedTestHost(connection.host);
        const password = this.decryptPassword(connection);
        if (connection.provider === database_connections_dto_1.DatabaseProvider.MONGODB) {
            await this.testMongo(connection, password);
            return;
        }
        if (connection.provider === database_connections_dto_1.DatabaseProvider.MYSQL) {
            await this.testMysql(connection, password);
            return;
        }
        await this.testPostgres(connection, password);
    }
    async testPostgres(connection, password) {
        const config = {
            host: connection.host,
            port: connection.port,
            database: connection.databaseName,
            user: connection.username ?? undefined,
            password,
            connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
            query_timeout: CONNECTION_TIMEOUT_MS,
            ssl: this.postgresSsl(connection.sslMode)
        };
        const client = new pg_1.Client(config);
        try {
            await client.connect();
            await client.query("SELECT 1");
        }
        finally {
            await client.end().catch(() => undefined);
        }
    }
    async testMysql(connection, password) {
        const client = await promise_1.default.createConnection({
            host: connection.host,
            port: connection.port,
            database: connection.databaseName,
            user: connection.username ?? undefined,
            password,
            connectTimeout: CONNECTION_TIMEOUT_MS,
            ssl: connection.sslMode === database_connections_dto_1.DatabaseSslMode.DISABLE
                ? undefined
                : { rejectUnauthorized: connection.sslMode !== database_connections_dto_1.DatabaseSslMode.REQUIRE }
        });
        try {
            await client.query("SELECT 1");
        }
        finally {
            await client.end();
        }
    }
    async testMongo(connection, password) {
        const scheme = connection.useSrv ? "mongodb+srv" : "mongodb";
        const authority = connection.useSrv ? connection.host : `${this.hostForUri(connection.host)}:${connection.port}`;
        const options = {
            serverSelectionTimeoutMS: CONNECTION_TIMEOUT_MS,
            connectTimeoutMS: CONNECTION_TIMEOUT_MS,
            tls: connection.sslMode !== database_connections_dto_1.DatabaseSslMode.DISABLE,
            authSource: connection.authSource ?? undefined,
            replicaSet: connection.replicaSet ?? undefined,
            ...(connection.username && password
                ? { auth: { username: connection.username, password } }
                : {})
        };
        const client = new mongodb_1.MongoClient(`${scheme}://${authority}/${encodeURIComponent(connection.databaseName)}`, options);
        try {
            await client.connect();
            await client.db(connection.databaseName).command({ ping: 1 });
        }
        finally {
            await client.close().catch(() => undefined);
        }
    }
    decryptPassword(connection) {
        if (!connection.passwordCiphertext ||
            !connection.passwordIv ||
            !connection.passwordAuthTag ||
            !connection.passwordKeyId) {
            return undefined;
        }
        return this.encryption.decrypt(connection.passwordCiphertext, connection.passwordIv, connection.passwordAuthTag, this.passwordAad(connection.tenantId), connection.passwordKeyId);
    }
    validateConnectionInput(dto) {
        this.normalizeHost(dto.host);
        if (dto.provider === database_connections_dto_1.DatabaseProvider.SUPABASE) {
            const validModes = new Set([
                database_connections_dto_1.DatabaseConnectionMode.DIRECT,
                database_connections_dto_1.DatabaseConnectionMode.SESSION_POOLER,
                database_connections_dto_1.DatabaseConnectionMode.TRANSACTION_POOLER
            ]);
            if (!validModes.has(dto.connectionMode)) {
                throw new common_1.BadRequestException("Supabase requires direct, session pooler, or transaction pooler mode");
            }
        }
        else if (dto.connectionMode !== database_connections_dto_1.DatabaseConnectionMode.STANDARD) {
            throw new common_1.BadRequestException("Only Supabase supports selectable connection modes");
        }
    }
    normalizeHost(value) {
        const host = value.trim().replace(/^\[|\]$/g, "");
        if (!host || /[\s/@?#]/.test(host) || (!(0, node_net_1.isIP)(host) && !/^(?=.{1,253}$)[a-zA-Z0-9.-]+$/.test(host))) {
            throw new common_1.BadRequestException("Host must be a hostname or IP address without a scheme, path, or port");
        }
        return host;
    }
    assertAllowedTestHost(host) {
        const normalized = host.toLowerCase();
        if (normalized === "169.254.169.254" ||
            normalized === "metadata.google.internal" ||
            normalized === "100.100.100.200" ||
            normalized.startsWith("169.254.") ||
            normalized.startsWith("fe80:")) {
            throw new common_1.BadRequestException("Connections to cloud metadata and link-local addresses are not allowed");
        }
    }
    postgresSsl(mode) {
        if (mode === database_connections_dto_1.DatabaseSslMode.DISABLE) {
            return false;
        }
        return { rejectUnauthorized: mode !== database_connections_dto_1.DatabaseSslMode.REQUIRE };
    }
    safeErrorMessage(error) {
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
    toPayload(connection) {
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
    maskedConnectionString(connection) {
        const username = connection.username ? `${encodeURIComponent(connection.username)}:********@` : "";
        const databaseName = encodeURIComponent(connection.databaseName);
        if (connection.provider === database_connections_dto_1.DatabaseProvider.MONGODB) {
            const scheme = connection.useSrv ? "mongodb+srv" : "mongodb";
            const authority = connection.useSrv ? connection.host : `${this.hostForUri(connection.host)}:${connection.port}`;
            return `${scheme}://${username}${authority}/${databaseName}`;
        }
        const scheme = connection.provider === database_connections_dto_1.DatabaseProvider.MYSQL ? "mysql" : "postgresql";
        return `${scheme}://${username}${this.hostForUri(connection.host)}:${connection.port}/${databaseName}`;
    }
    hostForUri(host) {
        return (0, node_net_1.isIP)(host) === 6 ? `[${host}]` : host;
    }
    supportsSchema(provider) {
        return provider === database_connections_dto_1.DatabaseProvider.POSTGRESQL || provider === database_connections_dto_1.DatabaseProvider.SUPABASE;
    }
    passwordAad(tenantId) {
        return `client-database-connection:${tenantId}`;
    }
    writeAudit(user, action, tenantId, metadata) {
        return this.prisma.platformAuditEvent.create({
            data: {
                action,
                actorId: user.id,
                metadata,
                tenantId
            }
        });
    }
    assertSuperadmin(user) {
        if (!SUPERADMIN_ROLES.has(user.role) || user.tenantId) {
            throw new common_1.ForbiddenException("Only platform superadmins can manage client database connections");
        }
    }
};
exports.DatabaseConnectionsService = DatabaseConnectionsService;
exports.DatabaseConnectionsService = DatabaseConnectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        database_credential_encryption_service_1.DatabaseCredentialEncryptionService])
], DatabaseConnectionsService);
//# sourceMappingURL=database-connections.service.js.map