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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const catalog_service_1 = require("./catalog.service");
const catalog_dto_1 = require("./catalog.dto");
let CatalogController = class CatalogController {
    catalogService;
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    listVendors() {
        return this.catalogService.listVendors();
    }
    getVendor(idOrSlug) {
        return this.catalogService.getVendor(idOrSlug);
    }
    createVendor(dto) {
        return this.catalogService.createVendor(dto);
    }
    listPeptides() {
        return this.catalogService.listPeptides();
    }
    getPeptide(idOrSlug) {
        return this.catalogService.getPeptide(idOrSlug);
    }
    createPeptide(dto) {
        return this.catalogService.createPeptide(dto);
    }
    listLabs() {
        return this.catalogService.listLabs();
    }
    createLab(dto) {
        return this.catalogService.createLab(dto);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)("vendors"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "listVendors", null);
__decorate([
    (0, common_1.Get)("vendor/:idOrSlug"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getVendor", null);
__decorate([
    (0, common_1.Post)("vendors"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [catalog_dto_1.CreateVendorDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createVendor", null);
__decorate([
    (0, common_1.Get)("peptides"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "listPeptides", null);
__decorate([
    (0, common_1.Get)("peptide/:idOrSlug"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getPeptide", null);
__decorate([
    (0, common_1.Post)("peptides"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [catalog_dto_1.CreatePeptideDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createPeptide", null);
__decorate([
    (0, common_1.Get)("labs"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "listLabs", null);
__decorate([
    (0, common_1.Post)("labs"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [catalog_dto_1.CreateLabDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createLab", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map