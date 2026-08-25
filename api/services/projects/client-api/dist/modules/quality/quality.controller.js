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
exports.QualityPublicController = exports.QualityController = void 0;
const common_1 = require("@nestjs/common");
const current_client_user_decorator_1 = require("../auth/current-client-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const quality_dto_1 = require("./quality.dto");
const quality_service_1 = require("./quality.service");
let QualityController = class QualityController {
    qualityService;
    constructor(qualityService) {
        this.qualityService = qualityService;
    }
    listVendors(user) {
        return this.qualityService.listVendors(user);
    }
    getVendor(idOrSlug, user) {
        return this.qualityService.getVendor(idOrSlug, user);
    }
    listPeptides(user) {
        return this.qualityService.listPeptides(user);
    }
    getPeptide(idOrSlug, user) {
        return this.qualityService.getPeptide(idOrSlug, user);
    }
    listLabs(user) {
        return this.qualityService.listLabs(user);
    }
    listTests(status, vendorId, peptideId, user) {
        return this.qualityService.listTests({ peptideId, status, vendorId }, user);
    }
    getTest(id, user) {
        return this.qualityService.getTest(id, user);
    }
    listBatches(query, user) {
        return this.qualityService.listBatches(query, user);
    }
    getBatch(idOrCode, user) {
        return this.qualityService.getBatch(idOrCode, user);
    }
    createBatch(dto, user) {
        return this.qualityService.createBatch(dto, user);
    }
    updateBatch(id, dto, user) {
        return this.qualityService.updateBatch(id, dto, user);
    }
    updateBatchStatus(id, dto, user) {
        return this.qualityService.updateBatchStatus(id, dto, user);
    }
    archiveBatch(id, user) {
        return this.qualityService.archiveBatch(id, user);
    }
    listCertificates(query, user) {
        return this.qualityService.listCertificates(query, user);
    }
    getCertificate(idOrNumber, user) {
        return this.qualityService.getCertificate(idOrNumber, user);
    }
    createCertificate(dto, user) {
        return this.qualityService.createCertificate(dto, user);
    }
    updateCertificate(id, dto, user) {
        return this.qualityService.updateCertificate(id, dto, user);
    }
    updateCertificateStatus(id, dto, user) {
        return this.qualityService.updateCertificateStatus(id, dto, user);
    }
    archiveCertificate(id, user) {
        return this.qualityService.archiveCertificate(id, user);
    }
};
exports.QualityController = QualityController;
__decorate([
    (0, common_1.Get)("vendors"),
    __param(0, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "listVendors", null);
__decorate([
    (0, common_1.Get)("vendors/:idOrSlug"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "getVendor", null);
__decorate([
    (0, common_1.Get)("peptides"),
    __param(0, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "listPeptides", null);
__decorate([
    (0, common_1.Get)("peptides/:idOrSlug"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "getPeptide", null);
__decorate([
    (0, common_1.Get)("labs"),
    __param(0, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "listLabs", null);
__decorate([
    (0, common_1.Get)("tests"),
    __param(0, (0, common_1.Query)("status")),
    __param(1, (0, common_1.Query)("vendorId")),
    __param(2, (0, common_1.Query)("peptideId")),
    __param(3, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "listTests", null);
__decorate([
    (0, common_1.Get)("tests/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "getTest", null);
__decorate([
    (0, common_1.Get)("batches"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quality_dto_1.ListQualityQueryDto, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "listBatches", null);
__decorate([
    (0, common_1.Get)("batches/:idOrCode"),
    __param(0, (0, common_1.Param)("idOrCode")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "getBatch", null);
__decorate([
    (0, common_1.Post)("batches"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quality_dto_1.CreatePeptraceBatchDto, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "createBatch", null);
__decorate([
    (0, common_1.Patch)("batches/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quality_dto_1.UpdatePeptraceBatchDto, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "updateBatch", null);
__decorate([
    (0, common_1.Patch)("batches/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quality_dto_1.UpdateQualityStatusDto, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "updateBatchStatus", null);
__decorate([
    (0, common_1.Delete)("batches/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "archiveBatch", null);
__decorate([
    (0, common_1.Get)("certificates"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quality_dto_1.ListQualityQueryDto, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "listCertificates", null);
__decorate([
    (0, common_1.Get)("certificates/:idOrNumber"),
    __param(0, (0, common_1.Param)("idOrNumber")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "getCertificate", null);
__decorate([
    (0, common_1.Post)("certificates"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quality_dto_1.CreatePeptraceCertificateDto, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "createCertificate", null);
__decorate([
    (0, common_1.Patch)("certificates/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quality_dto_1.UpdatePeptraceCertificateDto, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "updateCertificate", null);
__decorate([
    (0, common_1.Patch)("certificates/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quality_dto_1.UpdateQualityStatusDto, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "updateCertificateStatus", null);
__decorate([
    (0, common_1.Delete)("certificates/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QualityController.prototype, "archiveCertificate", null);
exports.QualityController = QualityController = __decorate([
    (0, common_1.Controller)("quality"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [quality_service_1.QualityService])
], QualityController);
let QualityPublicController = class QualityPublicController {
    qualityService;
    constructor(qualityService) {
        this.qualityService = qualityService;
    }
    listVendors() {
        return this.qualityService.publicListVendors();
    }
    getVendor(idOrSlug) {
        return this.qualityService.publicGetVendor(idOrSlug);
    }
    listPeptides() {
        return this.qualityService.publicListPeptides();
    }
    getPeptide(idOrSlug) {
        return this.qualityService.publicGetPeptide(idOrSlug);
    }
    listTests(query) {
        return this.qualityService.publicListTests(query);
    }
    verifyCertificate(idOrNumber) {
        return this.qualityService.publicVerifyCertificate(idOrNumber);
    }
};
exports.QualityPublicController = QualityPublicController;
__decorate([
    (0, common_1.Get)("vendors"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QualityPublicController.prototype, "listVendors", null);
__decorate([
    (0, common_1.Get)("vendors/:idOrSlug"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QualityPublicController.prototype, "getVendor", null);
__decorate([
    (0, common_1.Get)("peptides"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QualityPublicController.prototype, "listPeptides", null);
__decorate([
    (0, common_1.Get)("peptides/:idOrSlug"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QualityPublicController.prototype, "getPeptide", null);
__decorate([
    (0, common_1.Get)("tests"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quality_dto_1.ListQualityQueryDto]),
    __metadata("design:returntype", void 0)
], QualityPublicController.prototype, "listTests", null);
__decorate([
    (0, common_1.Get)("certificates/:idOrNumber/verify"),
    __param(0, (0, common_1.Param)("idOrNumber")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QualityPublicController.prototype, "verifyCertificate", null);
exports.QualityPublicController = QualityPublicController = __decorate([
    (0, common_1.Controller)("public/quality"),
    __metadata("design:paramtypes", [quality_service_1.QualityService])
], QualityPublicController);
//# sourceMappingURL=quality.controller.js.map