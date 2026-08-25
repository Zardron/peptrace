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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSecretsController = void 0;
const common_1 = require("@nestjs/common");
const current_admin_user_decorator_1 = require("../auth/current-admin-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const platform_secrets_dto_1 = require("./platform-secrets.dto");
const platform_secrets_service_1 = require("./platform-secrets.service");
let PlatformSecretsController = class PlatformSecretsController {
    platformSecretsService;
    constructor(platformSecretsService) {
        this.platformSecretsService = platformSecretsService;
    }
    createSecret(dto, user) {
        return this.platformSecretsService.createSecret(dto, user);
    }
};
exports.PlatformSecretsController = PlatformSecretsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [platform_secrets_dto_1.CreatePlatformSecretDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformSecretsController.prototype, "createSecret", null);
exports.PlatformSecretsController = PlatformSecretsController = __decorate([
    (0, common_1.Controller)("system/secrets"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [platform_secrets_service_1.PlatformSecretsService])
], PlatformSecretsController);
//# sourceMappingURL=platform-secrets.controller.js.map