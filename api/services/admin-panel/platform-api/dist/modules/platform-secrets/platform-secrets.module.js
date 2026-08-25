"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSecretsModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const admin_panel_module_1 = require("../admin-panel/admin-panel.module");
const prisma_module_1 = require("../prisma/prisma.module");
const platform_secret_encryption_service_1 = require("./platform-secret-encryption.service");
const platform_secrets_controller_1 = require("./platform-secrets.controller");
const platform_secrets_service_1 = require("./platform-secrets.service");
let PlatformSecretsModule = class PlatformSecretsModule {
};
exports.PlatformSecretsModule = PlatformSecretsModule;
exports.PlatformSecretsModule = PlatformSecretsModule = __decorate([
    (0, common_1.Module)({
        controllers: [platform_secrets_controller_1.PlatformSecretsController],
        imports: [admin_panel_module_1.AdminPanelModule, auth_module_1.AuthModule, prisma_module_1.PrismaModule],
        providers: [platform_secrets_service_1.PlatformSecretsService, platform_secret_encryption_service_1.PlatformSecretEncryptionService]
    })
], PlatformSecretsModule);
//# sourceMappingURL=platform-secrets.module.js.map