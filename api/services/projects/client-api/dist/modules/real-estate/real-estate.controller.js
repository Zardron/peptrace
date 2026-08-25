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
exports.RealEstatePublicController = exports.RealEstateController = void 0;
const common_1 = require("@nestjs/common");
const current_client_user_decorator_1 = require("../auth/current-client-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const real_estate_dto_1 = require("./real-estate.dto");
const real_estate_service_1 = require("./real-estate.service");
let RealEstateController = class RealEstateController {
    realEstateService;
    constructor(realEstateService) {
        this.realEstateService = realEstateService;
    }
    analyticsOverview(query, user) {
        return this.realEstateService.analyticsOverview(query, user);
    }
    listListings(query, user) {
        return this.realEstateService.listListings(query, user);
    }
    getListing(idOrSlug, user) {
        return this.realEstateService.getListing(idOrSlug, user);
    }
    createListing(dto, user) {
        return this.realEstateService.createListing(dto, user);
    }
    updateListing(id, dto, user) {
        return this.realEstateService.updateListing(id, dto, user);
    }
    updateListingStatus(id, dto, user) {
        return this.realEstateService.updateListingStatus(id, dto, user);
    }
    archiveListing(id, user) {
        return this.realEstateService.archiveListing(id, user);
    }
    listLeads(query, user) {
        return this.realEstateService.listLeads(query, user);
    }
    getLead(id, user) {
        return this.realEstateService.getLead(id, user);
    }
    createLead(dto, user) {
        return this.realEstateService.createLead(dto, user);
    }
    updateLead(id, dto, user) {
        return this.realEstateService.updateLead(id, dto, user);
    }
    updateLeadStatus(id, dto, user) {
        return this.realEstateService.updateLeadStatus(id, dto, user);
    }
    archiveLead(id, user) {
        return this.realEstateService.archiveLead(id, user);
    }
    listViewings(query, user) {
        return this.realEstateService.listViewings(query, user);
    }
    getViewing(id, user) {
        return this.realEstateService.getViewing(id, user);
    }
    createViewing(dto, user) {
        return this.realEstateService.createViewing(dto, user);
    }
    updateViewing(id, dto, user) {
        return this.realEstateService.updateViewing(id, dto, user);
    }
    updateViewingStatus(id, dto, user) {
        return this.realEstateService.updateViewingStatus(id, dto, user);
    }
    archiveViewing(id, user) {
        return this.realEstateService.archiveViewing(id, user);
    }
    listOffers(query, user) {
        return this.realEstateService.listOffers(query, user);
    }
    getOffer(id, user) {
        return this.realEstateService.getOffer(id, user);
    }
    createOffer(dto, user) {
        return this.realEstateService.createOffer(dto, user);
    }
    updateOffer(id, dto, user) {
        return this.realEstateService.updateOffer(id, dto, user);
    }
    updateOfferStatus(id, dto, user) {
        return this.realEstateService.updateOfferStatus(id, dto, user);
    }
    archiveOffer(id, user) {
        return this.realEstateService.archiveOffer(id, user);
    }
    listCommissions(query, user) {
        return this.realEstateService.listCommissions(query, user);
    }
    getCommission(id, user) {
        return this.realEstateService.getCommission(id, user);
    }
    createCommission(dto, user) {
        return this.realEstateService.createCommission(dto, user);
    }
    updateCommission(id, dto, user) {
        return this.realEstateService.updateCommission(id, dto, user);
    }
    updateCommissionStatus(id, dto, user) {
        return this.realEstateService.updateCommissionStatus(id, dto, user);
    }
    voidCommission(id, user) {
        return this.realEstateService.voidCommission(id, user);
    }
    listSavedListings(visitorKey, user) {
        return this.realEstateService.listSavedListings(visitorKey, user);
    }
    listSavedSearches(visitorKey, user) {
        return this.realEstateService.listSavedSearches(visitorKey, user);
    }
};
exports.RealEstateController = RealEstateController;
__decorate([
    (0, common_1.Get)("analytics/overview"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.ListRealEstateQueryDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "analyticsOverview", null);
__decorate([
    (0, common_1.Get)("listings"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.ListRealEstateQueryDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "listListings", null);
__decorate([
    (0, common_1.Get)("listings/:idOrSlug"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "getListing", null);
__decorate([
    (0, common_1.Post)("listings"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.CreateListingDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "createListing", null);
__decorate([
    (0, common_1.Patch)("listings/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, real_estate_dto_1.UpdateListingDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "updateListing", null);
__decorate([
    (0, common_1.Patch)("listings/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, real_estate_dto_1.UpdateRealEstateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "updateListingStatus", null);
__decorate([
    (0, common_1.Delete)("listings/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "archiveListing", null);
__decorate([
    (0, common_1.Get)("leads"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.ListRealEstateQueryDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "listLeads", null);
__decorate([
    (0, common_1.Get)("leads/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "getLead", null);
__decorate([
    (0, common_1.Post)("leads"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.CreateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "createLead", null);
__decorate([
    (0, common_1.Patch)("leads/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, real_estate_dto_1.UpdateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "updateLead", null);
__decorate([
    (0, common_1.Patch)("leads/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, real_estate_dto_1.UpdateRealEstateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "updateLeadStatus", null);
__decorate([
    (0, common_1.Delete)("leads/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "archiveLead", null);
__decorate([
    (0, common_1.Get)("viewings"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.ListRealEstateQueryDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "listViewings", null);
__decorate([
    (0, common_1.Get)("viewings/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "getViewing", null);
__decorate([
    (0, common_1.Post)("viewings"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.CreateViewingDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "createViewing", null);
__decorate([
    (0, common_1.Patch)("viewings/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, real_estate_dto_1.UpdateViewingDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "updateViewing", null);
__decorate([
    (0, common_1.Patch)("viewings/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, real_estate_dto_1.UpdateRealEstateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "updateViewingStatus", null);
__decorate([
    (0, common_1.Delete)("viewings/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "archiveViewing", null);
__decorate([
    (0, common_1.Get)("offers"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.ListRealEstateQueryDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "listOffers", null);
__decorate([
    (0, common_1.Get)("offers/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "getOffer", null);
__decorate([
    (0, common_1.Post)("offers"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.CreateOfferDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "createOffer", null);
__decorate([
    (0, common_1.Patch)("offers/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, real_estate_dto_1.UpdateOfferDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "updateOffer", null);
__decorate([
    (0, common_1.Patch)("offers/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, real_estate_dto_1.UpdateRealEstateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "updateOfferStatus", null);
__decorate([
    (0, common_1.Delete)("offers/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "archiveOffer", null);
__decorate([
    (0, common_1.Get)("commissions"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.ListRealEstateQueryDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "listCommissions", null);
__decorate([
    (0, common_1.Get)("commissions/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "getCommission", null);
__decorate([
    (0, common_1.Post)("commissions"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.CreateCommissionDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "createCommission", null);
__decorate([
    (0, common_1.Patch)("commissions/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, real_estate_dto_1.UpdateCommissionDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "updateCommission", null);
__decorate([
    (0, common_1.Patch)("commissions/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, real_estate_dto_1.UpdateRealEstateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "updateCommissionStatus", null);
__decorate([
    (0, common_1.Delete)("commissions/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "voidCommission", null);
__decorate([
    (0, common_1.Get)("saved-listings"),
    __param(0, (0, common_1.Query)("visitorKey")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "listSavedListings", null);
__decorate([
    (0, common_1.Get)("saved-searches"),
    __param(0, (0, common_1.Query)("visitorKey")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealEstateController.prototype, "listSavedSearches", null);
exports.RealEstateController = RealEstateController = __decorate([
    (0, common_1.Controller)("real-estate"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [real_estate_service_1.RealEstateService])
], RealEstateController);
let RealEstatePublicController = class RealEstatePublicController {
    realEstateService;
    constructor(realEstateService) {
        this.realEstateService = realEstateService;
    }
    listListings(query) {
        return this.realEstateService.publicListListings(query);
    }
    getListing(idOrSlug) {
        return this.realEstateService.publicGetListing(idOrSlug);
    }
    createInquiry(dto) {
        return this.realEstateService.publicCreateInquiry(dto);
    }
    createTourRequest(dto) {
        return this.realEstateService.publicCreateTourRequest(dto);
    }
    listSavedListings(query) {
        return this.realEstateService.publicListSavedListings(query);
    }
    saveListing(dto) {
        return this.realEstateService.publicSaveListing(dto);
    }
    removeSavedListing(listingIdOrSlug, visitorKey) {
        return this.realEstateService.publicRemoveSavedListing(listingIdOrSlug, visitorKey);
    }
    listSavedSearches(query) {
        return this.realEstateService.publicListSavedSearches(query);
    }
    createSavedSearch(dto) {
        return this.realEstateService.publicCreateSavedSearch(dto);
    }
    deleteSavedSearch(id, visitorKey) {
        return this.realEstateService.publicDeleteSavedSearch(id, visitorKey);
    }
};
exports.RealEstatePublicController = RealEstatePublicController;
__decorate([
    (0, common_1.Get)("listings"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.ListRealEstateQueryDto]),
    __metadata("design:returntype", void 0)
], RealEstatePublicController.prototype, "listListings", null);
__decorate([
    (0, common_1.Get)("listings/:idOrSlug"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RealEstatePublicController.prototype, "getListing", null);
__decorate([
    (0, common_1.Post)("inquiries"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.CreatePublicRealEstateInquiryDto]),
    __metadata("design:returntype", void 0)
], RealEstatePublicController.prototype, "createInquiry", null);
__decorate([
    (0, common_1.Post)("tour-requests"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.CreateRealEstateTourRequestDto]),
    __metadata("design:returntype", void 0)
], RealEstatePublicController.prototype, "createTourRequest", null);
__decorate([
    (0, common_1.Get)("saved-listings"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.ListRealEstateSavedQueryDto]),
    __metadata("design:returntype", void 0)
], RealEstatePublicController.prototype, "listSavedListings", null);
__decorate([
    (0, common_1.Post)("saved-listings"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.CreateRealEstateSavedListingDto]),
    __metadata("design:returntype", void 0)
], RealEstatePublicController.prototype, "saveListing", null);
__decorate([
    (0, common_1.Delete)("saved-listings/:listingIdOrSlug"),
    __param(0, (0, common_1.Param)("listingIdOrSlug")),
    __param(1, (0, common_1.Query)("visitorKey")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstatePublicController.prototype, "removeSavedListing", null);
__decorate([
    (0, common_1.Get)("saved-searches"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.ListRealEstateSavedQueryDto]),
    __metadata("design:returntype", void 0)
], RealEstatePublicController.prototype, "listSavedSearches", null);
__decorate([
    (0, common_1.Post)("saved-searches"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [real_estate_dto_1.CreateRealEstateSavedSearchDto]),
    __metadata("design:returntype", void 0)
], RealEstatePublicController.prototype, "createSavedSearch", null);
__decorate([
    (0, common_1.Delete)("saved-searches/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("visitorKey")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RealEstatePublicController.prototype, "deleteSavedSearch", null);
exports.RealEstatePublicController = RealEstatePublicController = __decorate([
    (0, common_1.Controller)("public/real-estate"),
    __metadata("design:paramtypes", [real_estate_service_1.RealEstateService])
], RealEstatePublicController);
//# sourceMappingURL=real-estate.controller.js.map