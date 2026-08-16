import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { createPostgresPoolOptions } from "../../database/create-postgres-pool-options";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;
  private keepAliveTimer: ReturnType<typeof setInterval> | undefined;

  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>("DATABASE_URL");
    const pool = new Pool(createPostgresPoolOptions(connectionString));
    const adapter = new PrismaPg(pool);

    super({ adapter });
    this.pool = pool;
    this.pool.on("error", (error) => {
      this.logger.warn(`Idle database connection closed: ${error.message}`);
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.warmPool();
    this.keepAliveTimer = setInterval(() => {
      void this.keepPoolConnectionsAlive();
    }, 5_000);
    this.keepAliveTimer.unref();
  }

  async onModuleDestroy() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }
    await this.$disconnect();
    await this.pool.end();
  }

  async isHealthy() {
    await this.$queryRaw`SELECT 1`;
    return true;
  }

  async withConnectionRetry<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!this.isClosedConnectionError(error)) {
        throw error;
      }

      await this.keepPoolConnectionsAlive();
      return operation();
    }
  }

  private async warmPool() {
    const connections = await Promise.allSettled(Array.from({ length: 5 }, () => this.pool.connect()));

    connections.forEach((connection) => {
      if (connection.status === "fulfilled") {
        connection.value.release();
      }
    });

    const failedConnection = connections.find((connection) => connection.status === "rejected");
    if (failedConnection?.status === "rejected") {
      throw failedConnection.reason;
    }
  }

  private async keepPoolConnectionsAlive() {
    await Promise.allSettled(Array.from({ length: 5 }, () => this.pool.query("SELECT 1")));
  }

  private isClosedConnectionError(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P1017";
  }
}
