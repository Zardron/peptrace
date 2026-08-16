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

  onModuleInit() {
    // Prisma connects lazily. This keeps the API available while a remote
    // database connection is being replaced after an idle disconnect.
    this.logger.log("Database pool ready");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }

  async isHealthy() {
    await this.withConnectionRetry(() => this.$queryRaw`SELECT 1`);
    return true;
  }

  async withConnectionRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (!this.isClosedConnectionError(error)) {
          throw error;
        }

        lastError = error;
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  private isClosedConnectionError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const code = "code" in error ? String(error.code) : "";
    const message = error.message.toLowerCase();

    return (
      code === "P1017" ||
      code === "ECONNRESET" ||
      code === "ECONNREFUSED" ||
      message.includes("connection terminated") ||
      message.includes("connection closed") ||
      message.includes("server has closed the connection")
    );
  }
}
