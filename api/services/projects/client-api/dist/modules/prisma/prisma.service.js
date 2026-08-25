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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const create_postgres_pool_options_1 = require("../../database/create-postgres-pool-options");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    pool;
    constructor(configService) {
        const connectionString = configService.getOrThrow("DATABASE_URL");
        const pool = new pg_1.Pool((0, create_postgres_pool_options_1.createPostgresPoolOptions)(connectionString));
        const adapter = new adapter_pg_1.PrismaPg(pool);
        super({ adapter });
        this.pool = pool;
        this.pool.on("error", (error) => {
            this.logger.warn(`Idle database connection closed: ${error.message}`);
        });
    }
    onModuleInit() {
        this.logger.log("Database pool ready");
    }
    async onModuleDestroy() {
        await this.$disconnect();
        await this.pool.end();
    }
    async isHealthy() {
        await this.withConnectionRetry(() => this.$queryRaw `SELECT 1`);
        return true;
    }
    async withConnectionRetry(operation) {
        let lastError;
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                return await operation();
            }
            catch (error) {
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
    isClosedConnectionError(error) {
        if (!(error instanceof Error)) {
            return false;
        }
        const code = "code" in error ? String(error.code) : "";
        const message = error.message.toLowerCase();
        return (code === "P1017" ||
            code === "ECONNRESET" ||
            code === "ECONNREFUSED" ||
            message.includes("connection terminated") ||
            message.includes("connection closed") ||
            message.includes("server has closed the connection"));
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map