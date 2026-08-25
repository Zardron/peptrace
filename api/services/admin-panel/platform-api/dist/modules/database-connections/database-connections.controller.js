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
exports.DatabaseConnectionsController = void 0;
const common_1 = require("@nestjs/common");
const current_admin_user_decorator_1 = require("../auth/current-admin-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const database_connections_dto_1 = require("./database-connections.dto");
const database_connections_service_1 = require("./database-connections.service");
let DatabaseConnectionsController = class DatabaseConnectionsController {
    databaseConnectionsService;
    constructor(databaseConnectionsService) {
        this.databaseConnectionsService = databaseConnectionsService;
    }
    listConnections(user) {
        return this.databaseConnectionsService.listConnections(user);
    }
    getProviderCatalog(user) {
        return this.databaseConnectionsService.getProviderCatalog(user);
    }
    upsertConnection(tenantId, dto, user) {
        return this.databaseConnectionsService.upsertConnection(tenantId, dto, user);
    }
    testConnection(tenantId, user) {
        return this.databaseConnectionsService.testConnection(tenantId, user);
    }
    useSharedDatabase(tenantId, user) {
        return this.databaseConnectionsService.useSharedDatabase(tenantId, user);
    }
};
exports.DatabaseConnectionsController = DatabaseConnectionsController;
__decorate([
    (0, common_1.Get)("database-connections"),
    __param(0, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DatabaseConnectionsController.prototype, "listConnections", null);
__decorate([
    (0, common_1.Get)("database-providers"),
    __param(0, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DatabaseConnectionsController.prototype, "getProviderCatalog", null);
__decorate([
    (0, common_1.Put)("database-connections/:tenantId"),
    __param(0, (0, common_1.Param)("tenantId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, database_connections_dto_1.UpsertDatabaseConnectionDto, Object]),
    __metadata("design:returntype", void 0)
], DatabaseConnectionsController.prototype, "upsertConnection", null);
__decorate([
    (0, common_1.Post)("database-connections/:tenantId/test"),
    __param(0, (0, common_1.Param)("tenantId")),
    __param(1, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DatabaseConnectionsController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Delete)("database-connections/:tenantId"),
    __param(0, (0, common_1.Param)("tenantId")),
    __param(1, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DatabaseConnectionsController.prototype, "useSharedDatabase", null);
exports.DatabaseConnectionsController = DatabaseConnectionsController = __decorate([
    (0, common_1.Controller)("system"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [database_connections_service_1.DatabaseConnectionsService])
], DatabaseConnectionsController);
//# sourceMappingURL=database-connections.controller.js.map