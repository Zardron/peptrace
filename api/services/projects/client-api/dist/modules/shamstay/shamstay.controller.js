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
exports.ShamstayPublicController = exports.ShamstayController = void 0;
const common_1 = require("@nestjs/common");
const current_client_user_decorator_1 = require("../auth/current-client-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const shamstay_dto_1 = require("./shamstay.dto");
const shamstay_service_1 = require("./shamstay.service");
let ShamstayController = class ShamstayController {
    shamstayService;
    constructor(shamstayService) {
        this.shamstayService = shamstayService;
    }
    analyticsOverview(query, user) {
        return this.shamstayService.analyticsOverview(query, user);
    }
    listProperties(query, user) {
        return this.shamstayService.listProperties(query, user);
    }
    getProperty(idOrSlug, user) {
        return this.shamstayService.getProperty(idOrSlug, user);
    }
    createProperty(dto, user) {
        return this.shamstayService.createProperty(dto, user);
    }
    updateProperty(id, dto, user) {
        return this.shamstayService.updateProperty(id, dto, user);
    }
    updatePropertyStatus(id, dto, user) {
        return this.shamstayService.updatePropertyStatus(id, dto, user);
    }
    archiveProperty(id, user) {
        return this.shamstayService.archiveProperty(id, user);
    }
    listAvailabilityBlocks(propertyId, query, user) {
        return this.shamstayService.listAvailabilityBlocks(propertyId, query, user);
    }
    createAvailabilityBlock(propertyId, dto, user) {
        return this.shamstayService.createAvailabilityBlock(propertyId, dto, user);
    }
    updateAvailabilityBlock(id, dto, user) {
        return this.shamstayService.updateAvailabilityBlock(id, dto, user);
    }
    deleteAvailabilityBlock(id, user) {
        return this.shamstayService.deleteAvailabilityBlock(id, user);
    }
    listGuests(query, user) {
        return this.shamstayService.listGuests(query, user);
    }
    getGuest(id, user) {
        return this.shamstayService.getGuest(id, user);
    }
    createGuest(dto, user) {
        return this.shamstayService.createGuest(dto, user);
    }
    updateGuest(id, dto, user) {
        return this.shamstayService.updateGuest(id, dto, user);
    }
    listReservations(query, user) {
        return this.shamstayService.listReservations(query, user);
    }
    getReservation(id, user) {
        return this.shamstayService.getReservation(id, user);
    }
    createReservation(dto, user) {
        return this.shamstayService.createReservation(dto, user);
    }
    updateReservation(id, dto, user) {
        return this.shamstayService.updateReservation(id, dto, user);
    }
    updateReservationStatus(id, dto, user) {
        return this.shamstayService.updateReservationStatus(id, dto, user);
    }
    archiveReservation(id, user) {
        return this.shamstayService.archiveReservation(id, user);
    }
    listTurnovers(query, user) {
        return this.shamstayService.listTurnovers(query, user);
    }
    getTurnover(id, user) {
        return this.shamstayService.getTurnover(id, user);
    }
    createTurnover(dto, user) {
        return this.shamstayService.createTurnover(dto, user);
    }
    updateTurnover(id, dto, user) {
        return this.shamstayService.updateTurnover(id, dto, user);
    }
    updateTurnoverStatus(id, dto, user) {
        return this.shamstayService.updateTurnoverStatus(id, dto, user);
    }
    archiveTurnover(id, user) {
        return this.shamstayService.archiveTurnover(id, user);
    }
    listMaintenanceTickets(query, user) {
        return this.shamstayService.listMaintenanceTickets(query, user);
    }
    getMaintenanceTicket(id, user) {
        return this.shamstayService.getMaintenanceTicket(id, user);
    }
    createMaintenanceTicket(dto, user) {
        return this.shamstayService.createMaintenanceTicket(dto, user);
    }
    updateMaintenanceTicket(id, dto, user) {
        return this.shamstayService.updateMaintenanceTicket(id, dto, user);
    }
    updateMaintenanceStatus(id, dto, user) {
        return this.shamstayService.updateMaintenanceStatus(id, dto, user);
    }
    archiveMaintenanceTicket(id, user) {
        return this.shamstayService.archiveMaintenanceTicket(id, user);
    }
    listOwnerPayouts(query, user) {
        return this.shamstayService.listOwnerPayouts(query, user);
    }
    getOwnerPayout(id, user) {
        return this.shamstayService.getOwnerPayout(id, user);
    }
    createOwnerPayout(dto, user) {
        return this.shamstayService.createOwnerPayout(dto, user);
    }
    updateOwnerPayout(id, dto, user) {
        return this.shamstayService.updateOwnerPayout(id, dto, user);
    }
    updateOwnerPayoutStatus(id, dto, user) {
        return this.shamstayService.updateOwnerPayoutStatus(id, dto, user);
    }
    archiveOwnerPayout(id, user) {
        return this.shamstayService.archiveOwnerPayout(id, user);
    }
    listPayments(query, user) {
        return this.shamstayService.listPayments(query, user);
    }
    getPayment(id, user) {
        return this.shamstayService.getPayment(id, user);
    }
    createPayment(dto, user) {
        return this.shamstayService.createPayment(dto, user);
    }
    updatePayment(id, dto, user) {
        return this.shamstayService.updatePayment(id, dto, user);
    }
    updatePaymentStatus(id, dto, user) {
        return this.shamstayService.updatePaymentStatus(id, dto, user);
    }
    refundPayment(id, dto, user) {
        return this.shamstayService.refundPayment(id, dto, user);
    }
    voidPayment(id, user) {
        return this.shamstayService.voidPayment(id, user);
    }
    listReviews(query, user) {
        return this.shamstayService.listReviews(query, user);
    }
    getReview(id, user) {
        return this.shamstayService.getReview(id, user);
    }
    createReview(dto, user) {
        return this.shamstayService.createReview(dto, user);
    }
    updateReviewStatus(id, dto, user) {
        return this.shamstayService.updateReviewStatus(id, dto, user);
    }
    updateReviewResponse(id, dto, user) {
        return this.shamstayService.updateReviewResponse(id, dto, user);
    }
    archiveReview(id, user) {
        return this.shamstayService.archiveReview(id, user);
    }
    listConversations(query, user) {
        return this.shamstayService.listConversations(query, user);
    }
    createConversation(dto, user) {
        return this.shamstayService.createConversation(dto, user);
    }
    getConversation(id, user) {
        return this.shamstayService.getConversation(id, user);
    }
    archiveConversation(id, user) {
        return this.shamstayService.archiveConversation(id, user);
    }
    listConversationMessages(id, user) {
        return this.shamstayService.listConversationMessages(id, user);
    }
    createConversationMessage(id, dto, user) {
        return this.shamstayService.createConversationMessage(id, dto, user);
    }
};
exports.ShamstayController = ShamstayController;
__decorate([
    (0, common_1.Get)("analytics/overview"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstayQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "analyticsOverview", null);
__decorate([
    (0, common_1.Get)("properties"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstayQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "listProperties", null);
__decorate([
    (0, common_1.Get)("properties/:idOrSlug"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "getProperty", null);
__decorate([
    (0, common_1.Post)("properties"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreateShamstayPropertyDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "createProperty", null);
__decorate([
    (0, common_1.Patch)("properties/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateShamstayPropertyDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateProperty", null);
__decorate([
    (0, common_1.Patch)("properties/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updatePropertyStatus", null);
__decorate([
    (0, common_1.Delete)("properties/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "archiveProperty", null);
__decorate([
    (0, common_1.Get)("properties/:propertyId/availability-blocks"),
    __param(0, (0, common_1.Param)("propertyId")),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.ListShamstayQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "listAvailabilityBlocks", null);
__decorate([
    (0, common_1.Post)("properties/:propertyId/availability-blocks"),
    __param(0, (0, common_1.Param)("propertyId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.CreateShamstayAvailabilityBlockDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "createAvailabilityBlock", null);
__decorate([
    (0, common_1.Patch)("availability-blocks/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateShamstayAvailabilityBlockDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateAvailabilityBlock", null);
__decorate([
    (0, common_1.Delete)("availability-blocks/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "deleteAvailabilityBlock", null);
__decorate([
    (0, common_1.Get)("guests"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstayQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "listGuests", null);
__decorate([
    (0, common_1.Get)("guests/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "getGuest", null);
__decorate([
    (0, common_1.Post)("guests"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreateShamstayGuestDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "createGuest", null);
__decorate([
    (0, common_1.Patch)("guests/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateShamstayGuestDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateGuest", null);
__decorate([
    (0, common_1.Get)("reservations"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstayQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "listReservations", null);
__decorate([
    (0, common_1.Get)("reservations/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "getReservation", null);
__decorate([
    (0, common_1.Post)("reservations"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreateShamstayReservationDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "createReservation", null);
__decorate([
    (0, common_1.Patch)("reservations/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateShamstayReservationDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateReservation", null);
__decorate([
    (0, common_1.Patch)("reservations/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateReservationStatus", null);
__decorate([
    (0, common_1.Delete)("reservations/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "archiveReservation", null);
__decorate([
    (0, common_1.Get)("turnovers"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstayQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "listTurnovers", null);
__decorate([
    (0, common_1.Get)("turnovers/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "getTurnover", null);
__decorate([
    (0, common_1.Post)("turnovers"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreateShamstayTurnoverDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "createTurnover", null);
__decorate([
    (0, common_1.Patch)("turnovers/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateShamstayTurnoverDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateTurnover", null);
__decorate([
    (0, common_1.Patch)("turnovers/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateTurnoverStatus", null);
__decorate([
    (0, common_1.Delete)("turnovers/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "archiveTurnover", null);
__decorate([
    (0, common_1.Get)("maintenance"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstayQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "listMaintenanceTickets", null);
__decorate([
    (0, common_1.Get)("maintenance/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "getMaintenanceTicket", null);
__decorate([
    (0, common_1.Post)("maintenance"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreateShamstayMaintenanceTicketDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "createMaintenanceTicket", null);
__decorate([
    (0, common_1.Patch)("maintenance/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateShamstayMaintenanceTicketDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateMaintenanceTicket", null);
__decorate([
    (0, common_1.Patch)("maintenance/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateMaintenanceStatus", null);
__decorate([
    (0, common_1.Delete)("maintenance/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "archiveMaintenanceTicket", null);
__decorate([
    (0, common_1.Get)("payouts"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstayQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "listOwnerPayouts", null);
__decorate([
    (0, common_1.Get)("payouts/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "getOwnerPayout", null);
__decorate([
    (0, common_1.Post)("payouts"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreateShamstayOwnerPayoutDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "createOwnerPayout", null);
__decorate([
    (0, common_1.Patch)("payouts/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateShamstayOwnerPayoutDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateOwnerPayout", null);
__decorate([
    (0, common_1.Patch)("payouts/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateOwnerPayoutStatus", null);
__decorate([
    (0, common_1.Delete)("payouts/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "archiveOwnerPayout", null);
__decorate([
    (0, common_1.Get)("payments"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstayQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Get)("payments/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "getPayment", null);
__decorate([
    (0, common_1.Post)("payments"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreateShamstayPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Patch)("payments/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateShamstayPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updatePayment", null);
__decorate([
    (0, common_1.Patch)("payments/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateShamstayPaymentStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updatePaymentStatus", null);
__decorate([
    (0, common_1.Post)("payments/:id/refunds"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.RefundShamstayPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "refundPayment", null);
__decorate([
    (0, common_1.Delete)("payments/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "voidPayment", null);
__decorate([
    (0, common_1.Get)("reviews"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstayQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "listReviews", null);
__decorate([
    (0, common_1.Get)("reviews/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "getReview", null);
__decorate([
    (0, common_1.Post)("reviews"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreateShamstayReviewDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "createReview", null);
__decorate([
    (0, common_1.Patch)("reviews/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateReviewStatus", null);
__decorate([
    (0, common_1.Patch)("reviews/:id/response"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.UpdateShamstayReviewResponseDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "updateReviewResponse", null);
__decorate([
    (0, common_1.Delete)("reviews/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "archiveReview", null);
__decorate([
    (0, common_1.Get)("conversations"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstayConversationQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "listConversations", null);
__decorate([
    (0, common_1.Post)("conversations"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreateShamstayConversationDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Get)("conversations/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Delete)("conversations/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "archiveConversation", null);
__decorate([
    (0, common_1.Get)("conversations/:id/messages"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "listConversationMessages", null);
__decorate([
    (0, common_1.Post)("conversations/:id/messages"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.CreateShamstayMessageDto, Object]),
    __metadata("design:returntype", void 0)
], ShamstayController.prototype, "createConversationMessage", null);
exports.ShamstayController = ShamstayController = __decorate([
    (0, common_1.Controller)("shamstay"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [shamstay_service_1.ShamstayService])
], ShamstayController);
let ShamstayPublicController = class ShamstayPublicController {
    shamstayService;
    constructor(shamstayService) {
        this.shamstayService = shamstayService;
    }
    listProperties(query) {
        return this.shamstayService.publicListProperties(query);
    }
    getProperty(idOrSlug) {
        return this.shamstayService.publicGetProperty(idOrSlug);
    }
    quoteProperty(idOrSlug, query) {
        return this.shamstayService.publicQuoteProperty(idOrSlug, query);
    }
    listReviews(idOrSlug) {
        return this.shamstayService.publicListReviews(idOrSlug);
    }
    createReservationRequest(dto) {
        return this.shamstayService.publicCreateReservationRequest(dto);
    }
    createPayment(dto) {
        return this.shamstayService.publicCreatePayment(dto);
    }
    createContact(dto) {
        return this.shamstayService.publicCreateContact(dto);
    }
    listWishlist(query) {
        return this.shamstayService.publicListWishlist(query);
    }
    saveWishlistItem(dto) {
        return this.shamstayService.publicSaveWishlistItem(dto);
    }
    removeWishlistItem(propertyIdOrSlug, visitorKey) {
        return this.shamstayService.publicRemoveWishlistItem(propertyIdOrSlug, visitorKey);
    }
};
exports.ShamstayPublicController = ShamstayPublicController;
__decorate([
    (0, common_1.Get)("properties"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstayQueryDto]),
    __metadata("design:returntype", void 0)
], ShamstayPublicController.prototype, "listProperties", null);
__decorate([
    (0, common_1.Get)("properties/:idOrSlug"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShamstayPublicController.prototype, "getProperty", null);
__decorate([
    (0, common_1.Get)("properties/:idOrSlug/quote"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shamstay_dto_1.ListShamstayQueryDto]),
    __metadata("design:returntype", void 0)
], ShamstayPublicController.prototype, "quoteProperty", null);
__decorate([
    (0, common_1.Get)("properties/:idOrSlug/reviews"),
    __param(0, (0, common_1.Param)("idOrSlug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShamstayPublicController.prototype, "listReviews", null);
__decorate([
    (0, common_1.Post)("reservation-requests"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreatePublicShamstayReservationRequestDto]),
    __metadata("design:returntype", void 0)
], ShamstayPublicController.prototype, "createReservationRequest", null);
__decorate([
    (0, common_1.Post)("payments"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreatePublicShamstayPaymentDto]),
    __metadata("design:returntype", void 0)
], ShamstayPublicController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Post)("contact"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreatePublicShamstayContactDto]),
    __metadata("design:returntype", void 0)
], ShamstayPublicController.prototype, "createContact", null);
__decorate([
    (0, common_1.Get)("wishlist"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.ListShamstaySavedQueryDto]),
    __metadata("design:returntype", void 0)
], ShamstayPublicController.prototype, "listWishlist", null);
__decorate([
    (0, common_1.Post)("wishlist"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shamstay_dto_1.CreateShamstayWishlistItemDto]),
    __metadata("design:returntype", void 0)
], ShamstayPublicController.prototype, "saveWishlistItem", null);
__decorate([
    (0, common_1.Delete)("wishlist/:propertyIdOrSlug"),
    __param(0, (0, common_1.Param)("propertyIdOrSlug")),
    __param(1, (0, common_1.Query)("visitorKey")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShamstayPublicController.prototype, "removeWishlistItem", null);
exports.ShamstayPublicController = ShamstayPublicController = __decorate([
    (0, common_1.Controller)("public/shamstay"),
    __metadata("design:paramtypes", [shamstay_service_1.ShamstayService])
], ShamstayPublicController);
//# sourceMappingURL=shamstay.controller.js.map