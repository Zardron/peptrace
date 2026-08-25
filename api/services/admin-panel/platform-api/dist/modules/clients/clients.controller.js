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
exports.ClientsController = void 0;
const common_1 = require("@nestjs/common");
const current_admin_user_decorator_1 = require("../auth/current-admin-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const clients_dto_1 = require("./clients.dto");
const clients_service_1 = require("./clients.service");
let ClientsController = class ClientsController {
    clientsService;
    constructor(clientsService) {
        this.clientsService = clientsService;
    }
    listClients(user) {
        return this.clientsService.listClients(user);
    }
    getClient(idOrSlug, user) {
        return this.clientsService.getClient(idOrSlug, user);
    }
    createClient(dto, user) {
        return this.clientsService.createClient(dto, user);
    }
};
exports.ClientsController = ClientsController;
__decorate([
    (0, common_1.Get)("clients"),
    __param(0, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClientsController.prototype, "listClients", null);
__decorate([
    (0, common_1.Get)("clients/:idOrSlug"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __param(1, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ClientsController.prototype, "getClient", null);
__decorate([
    (0, common_1.Post)("clients"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_admin_user_decorator_1.CurrentAdminUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [clients_dto_1.CreateClientDto, Object]),
    __metadata("design:returntype", void 0)
], ClientsController.prototype, "createClient", null);
exports.ClientsController = ClientsController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [clients_service_1.ClientsService])
], ClientsController);
//# sourceMappingURL=clients.controller.js.map