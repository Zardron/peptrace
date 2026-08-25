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
exports.PlatformController = void 0;
const common_1 = require("@nestjs/common");
const current_admin_user_decorator_1 = require("../auth/current-admin-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const platform_dto_1 = require("./platform.dto");
const platform_service_1 = require("./platform.service");
let PlatformController = class PlatformController {
    platformService;
    constructor(platformService) {
        this.platformService = platformService;
    }
    getAccountProfile(user) {
        return this.platformService.getAccountProfile(user);
    }
    listApiSurfaces(user) {
        return this.platformService.listApiSurfaces(user);
    }
    createApiKey(dto, user) {
        return this.platformService.createApiKey(dto, user);
    }
};
exports.PlatformController = PlatformController;
__decorate([
    (0, common_1.Get)("account/profile"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlatformController.prototype, "getAccountProfile", null);
__decorate([
    (0, common_1.Get)("api-surfaces"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlatformController.prototype, "listApiSurfaces", null);
__decorate([
    (0, common_1.Post)("authorization/api-keys"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [platform_dto_1.CreateApiKeyDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformController.prototype, "createApiKey", null);
exports.PlatformController = PlatformController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [platform_service_1.PlatformService])
], PlatformController);
//# sourceMappingURL=platform.controller.js.map