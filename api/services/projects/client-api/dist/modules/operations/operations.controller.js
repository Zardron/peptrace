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
exports.OperationsController = void 0;
const common_1 = require("@nestjs/common");
const current_client_user_decorator_1 = require("../auth/current-client-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const operations_service_1 = require("./operations.service");
let OperationsController = class OperationsController {
    operationsService;
    constructor(operationsService) {
        this.operationsService = operationsService;
    }
    getSummary(user) {
        return this.operationsService.getSummary(user);
    }
    getRecords(user) {
        return this.operationsService.getRecords(user);
    }
    getWorkItems(user) {
        return this.operationsService.getWorkItems(user);
    }
};
exports.OperationsController = OperationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OperationsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)("records"),
    __param(0, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OperationsController.prototype, "getRecords", null);
__decorate([
    (0, common_1.Get)("work-items"),
    __param(0, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OperationsController.prototype, "getWorkItems", null);
exports.OperationsController = OperationsController = __decorate([
    (0, common_1.Controller)("operations"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [operations_service_1.OperationsService])
], OperationsController);
//# sourceMappingURL=operations.controller.js.map