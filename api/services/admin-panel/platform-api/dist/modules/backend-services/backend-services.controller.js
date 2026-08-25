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
exports.BackendServicesController = void 0;
const common_1 = require("@nestjs/common");
const current_admin_user_decorator_1 = require("../auth/current-admin-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const backend_services_dto_1 = require("./backend-services.dto");
const backend_services_service_1 = require("./backend-services.service");
let BackendServicesController = class BackendServicesController {
    backendServicesService;
    constructor(backendServicesService) {
        this.backendServicesService = backendServicesService;
    }
    listServices(query, user) {
        return this.backendServicesService.listServices(query, user);
    }
    getService(serviceKey, user) {
        return this.backendServicesService.getService(serviceKey, user);
    }
    createService(dto, user) {
        return this.backendServicesService.createService(dto, user);
    }
    updateService(serviceKey, dto, user) {
        return this.backendServicesService.updateService(serviceKey, dto, user);
    }
    listTenantServices(tenantId, user) {
        return this.backendServicesService.listTenantServices(tenantId, user);
    }
    getTenantService(tenantId, serviceKey, user) {
        return this.backendServicesService.getTenantService(tenantId, serviceKey, user);
    }
    upsertTenantService(tenantId, serviceKey, dto, user) {
        return this.backendServicesService.upsertTenantService(tenantId, serviceKey, dto, user);
    }
    removeTenantService(tenantId, serviceKey, user) {
        return this.backendServicesService.removeTenantService(tenantId, serviceKey, user);
    }
};
exports.BackendServicesController = BackendServicesController;
__decorate([
    (0, common_1.Get)("services"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [backend_services_dto_1.ListBackendServicesQueryDto, Object]),
    __metadata("design:returntype", void 0)
], BackendServicesController.prototype, "listServices", null);
__decorate([
    (0, common_1.Get)("services/:serviceKey"),
    __param(0, (0, common_1.Param)("serviceKey")),
    __param(1, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BackendServicesController.prototype, "getService", null);
__decorate([
    (0, common_1.Post)("services"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [backend_services_dto_1.CreateBackendServiceDto, Object]),
    __metadata("design:returntype", void 0)
], BackendServicesController.prototype, "createService", null);
__decorate([
    (0, common_1.Patch)("services/:serviceKey"),
    __param(0, (0, common_1.Param)("serviceKey")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, backend_services_dto_1.UpdateBackendServiceDto, Object]),
    __metadata("design:returntype", void 0)
], BackendServicesController.prototype, "updateService", null);
__decorate([
    (0, common_1.Get)("clients/:tenantId/services"),
    __param(0, (0, common_1.Param)("tenantId")),
    __param(1, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BackendServicesController.prototype, "listTenantServices", null);
__decorate([
    (0, common_1.Get)("clients/:tenantId/services/:serviceKey"),
    __param(0, (0, common_1.Param)("tenantId")),
    __param(1, (0, common_1.Param)("serviceKey")),
    __param(2, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], BackendServicesController.prototype, "getTenantService", null);
__decorate([
    (0, common_1.Put)("clients/:tenantId/services/:serviceKey"),
    __param(0, (0, common_1.Param)("tenantId")),
    __param(1, (0, common_1.Param)("serviceKey")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, backend_services_dto_1.UpsertTenantBackendServiceDto, Object]),
    __metadata("design:returntype", void 0)
], BackendServicesController.prototype, "upsertTenantService", null);
__decorate([
    (0, common_1.Delete)("clients/:tenantId/services/:serviceKey"),
    __param(0, (0, common_1.Param)("tenantId")),
    __param(1, (0, common_1.Param)("serviceKey")),
    __param(2, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], BackendServicesController.prototype, "removeTenantService", null);
exports.BackendServicesController = BackendServicesController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [backend_services_service_1.BackendServicesService])
], BackendServicesController);
//# sourceMappingURL=backend-services.controller.js.map