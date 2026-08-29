"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const node_path_1 = require("node:path");
const app_controller_1 = require("./app.controller");
const env_validation_1 = require("./config/env.validation");
const admin_panel_module_1 = require("./modules/admin-panel/admin-panel.module");
const auth_module_1 = require("./modules/auth/auth.module");
const backend_services_module_1 = require("./modules/backend-services/backend-services.module");
const catalog_module_1 = require("./modules/catalog/catalog.module");
const clients_module_1 = require("./modules/clients/clients.module");
const database_connections_module_1 = require("./modules/database-connections/database-connections.module");
const health_module_1 = require("./modules/health/health.module");
const platform_module_1 = require("./modules/platform/platform.module");
const platform_secrets_module_1 = require("./modules/platform-secrets/platform-secrets.module");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const testing_module_1 = require("./modules/testing/testing.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                envFilePath: [
                    (0, node_path_1.join)(process.cwd(), ".env.local"),
                    (0, node_path_1.join)(process.cwd(), ".env"),
                    (0, node_path_1.join)(process.cwd(), "../../.env.local"),
                    (0, node_path_1.join)(process.cwd(), "../../.env"),
                    (0, node_path_1.join)(process.cwd(), "../../../../.env.local"),
                    (0, node_path_1.join)(process.cwd(), "../../../../.env")
                ],
                isGlobal: true,
                validationSchema: env_validation_1.envValidationSchema,
                validationOptions: {
                    abortEarly: false,
                    allowUnknown: true
                }
            }),
            jwt_1.JwtModule.registerAsync({
                global: true,
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get("JWT_SECRET"),
                    signOptions: { expiresIn: "1h" }
                })
            }),
            prisma_module_1.PrismaModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            admin_panel_module_1.AdminPanelModule,
            backend_services_module_1.BackendServicesModule,
            clients_module_1.ClientsModule,
            database_connections_module_1.DatabaseConnectionsModule,
            catalog_module_1.CatalogModule,
            testing_module_1.TestingModule,
            platform_module_1.PlatformModule,
            platform_secrets_module_1.PlatformSecretsModule
        ],
        controllers: [app_controller_1.AppController]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map