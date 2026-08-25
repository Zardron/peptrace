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
const health_module_1 = require("./modules/health/health.module");
const operations_module_1 = require("./modules/operations/operations.module");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const quality_module_1 = require("./modules/quality/quality.module");
const real_estate_module_1 = require("./modules/real-estate/real-estate.module");
const secrets_module_1 = require("./modules/secrets/secrets.module");
const services_module_1 = require("./modules/services/services.module");
const shamstay_module_1 = require("./modules/shamstay/shamstay.module");
const users_module_1 = require("./modules/users/users.module");
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
                    (0, node_path_1.join)(process.cwd(), "../../.env")
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
            operations_module_1.OperationsModule,
            quality_module_1.QualityModule,
            real_estate_module_1.RealEstateModule,
            users_module_1.UsersModule,
            services_module_1.ServicesModule,
            shamstay_module_1.ShamstayModule,
            secrets_module_1.SecretsModule
        ],
        controllers: [app_controller_1.AppController]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map