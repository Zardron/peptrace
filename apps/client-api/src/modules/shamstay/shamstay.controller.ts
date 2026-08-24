import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { CurrentClientUser } from "../auth/current-client-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  CreatePublicShamstayContactDto,
  CreatePublicShamstayPaymentDto,
  CreatePublicShamstayReservationRequestDto,
  CreateShamstayAvailabilityBlockDto,
  CreateShamstayConversationDto,
  CreateShamstayGuestDto,
  CreateShamstayMaintenanceTicketDto,
  CreateShamstayMessageDto,
  CreateShamstayOwnerPayoutDto,
  CreateShamstayPaymentDto,
  CreateShamstayPropertyDto,
  CreateShamstayReservationDto,
  CreateShamstayReviewDto,
  CreateShamstayTurnoverDto,
  CreateShamstayWishlistItemDto,
  RefundShamstayPaymentDto,
  ListShamstayConversationQueryDto,
  ListShamstayQueryDto,
  ListShamstaySavedQueryDto,
  UpdateShamstayAvailabilityBlockDto,
  UpdateShamstayGuestDto,
  UpdateShamstayMaintenanceTicketDto,
  UpdateShamstayOwnerPayoutDto,
  UpdateShamstayPaymentDto,
  UpdateShamstayPaymentStatusDto,
  UpdateShamstayPropertyDto,
  UpdateShamstayReservationDto,
  UpdateShamstayReviewResponseDto,
  UpdateShamstayTurnoverDto,
  UpdateStatusDto
} from "./shamstay.dto";
import { ShamstayService } from "./shamstay.service";

@Controller("shamstay")
@UseGuards(JwtAuthGuard)
export class ShamstayController {
  constructor(private readonly shamstayService: ShamstayService) {}

  @Get("analytics/overview")
  analyticsOverview(@Query() query: ListShamstayQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.analyticsOverview(query, user);
  }

  @Get("properties")
  listProperties(@Query() query: ListShamstayQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.listProperties(query, user);
  }

  @Get("properties/:idOrSlug")
  getProperty(@Param("idOrSlug") idOrSlug: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.getProperty(idOrSlug, user);
  }

  @Post("properties")
  createProperty(@Body() dto: CreateShamstayPropertyDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.createProperty(dto, user);
  }

  @Patch("properties/:id")
  updateProperty(
    @Param("id") id: string,
    @Body() dto: UpdateShamstayPropertyDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateProperty(id, dto, user);
  }

  @Patch("properties/:id/status")
  updatePropertyStatus(
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updatePropertyStatus(id, dto, user);
  }

  @Delete("properties/:id")
  archiveProperty(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.archiveProperty(id, user);
  }

  @Get("properties/:propertyId/availability-blocks")
  listAvailabilityBlocks(
    @Param("propertyId") propertyId: string,
    @Query() query: ListShamstayQueryDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.listAvailabilityBlocks(propertyId, query, user);
  }

  @Post("properties/:propertyId/availability-blocks")
  createAvailabilityBlock(
    @Param("propertyId") propertyId: string,
    @Body() dto: CreateShamstayAvailabilityBlockDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.createAvailabilityBlock(propertyId, dto, user);
  }

  @Patch("availability-blocks/:id")
  updateAvailabilityBlock(
    @Param("id") id: string,
    @Body() dto: UpdateShamstayAvailabilityBlockDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateAvailabilityBlock(id, dto, user);
  }

  @Delete("availability-blocks/:id")
  deleteAvailabilityBlock(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.deleteAvailabilityBlock(id, user);
  }

  @Get("guests")
  listGuests(@Query() query: ListShamstayQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.listGuests(query, user);
  }

  @Get("guests/:id")
  getGuest(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.getGuest(id, user);
  }

  @Post("guests")
  createGuest(@Body() dto: CreateShamstayGuestDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.createGuest(dto, user);
  }

  @Patch("guests/:id")
  updateGuest(
    @Param("id") id: string,
    @Body() dto: UpdateShamstayGuestDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateGuest(id, dto, user);
  }

  @Get("reservations")
  listReservations(@Query() query: ListShamstayQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.listReservations(query, user);
  }

  @Get("reservations/:id")
  getReservation(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.getReservation(id, user);
  }

  @Post("reservations")
  createReservation(@Body() dto: CreateShamstayReservationDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.createReservation(dto, user);
  }

  @Patch("reservations/:id")
  updateReservation(
    @Param("id") id: string,
    @Body() dto: UpdateShamstayReservationDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateReservation(id, dto, user);
  }

  @Patch("reservations/:id/status")
  updateReservationStatus(
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateReservationStatus(id, dto, user);
  }

  @Delete("reservations/:id")
  archiveReservation(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.archiveReservation(id, user);
  }

  @Get("turnovers")
  listTurnovers(@Query() query: ListShamstayQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.listTurnovers(query, user);
  }

  @Get("turnovers/:id")
  getTurnover(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.getTurnover(id, user);
  }

  @Post("turnovers")
  createTurnover(@Body() dto: CreateShamstayTurnoverDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.createTurnover(dto, user);
  }

  @Patch("turnovers/:id")
  updateTurnover(
    @Param("id") id: string,
    @Body() dto: UpdateShamstayTurnoverDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateTurnover(id, dto, user);
  }

  @Patch("turnovers/:id/status")
  updateTurnoverStatus(
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateTurnoverStatus(id, dto, user);
  }

  @Delete("turnovers/:id")
  archiveTurnover(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.archiveTurnover(id, user);
  }

  @Get("maintenance")
  listMaintenanceTickets(
    @Query() query: ListShamstayQueryDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.listMaintenanceTickets(query, user);
  }

  @Get("maintenance/:id")
  getMaintenanceTicket(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.getMaintenanceTicket(id, user);
  }

  @Post("maintenance")
  createMaintenanceTicket(
    @Body() dto: CreateShamstayMaintenanceTicketDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.createMaintenanceTicket(dto, user);
  }

  @Patch("maintenance/:id")
  updateMaintenanceTicket(
    @Param("id") id: string,
    @Body() dto: UpdateShamstayMaintenanceTicketDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateMaintenanceTicket(id, dto, user);
  }

  @Patch("maintenance/:id/status")
  updateMaintenanceStatus(
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateMaintenanceStatus(id, dto, user);
  }

  @Delete("maintenance/:id")
  archiveMaintenanceTicket(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.archiveMaintenanceTicket(id, user);
  }

  @Get("payouts")
  listOwnerPayouts(@Query() query: ListShamstayQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.listOwnerPayouts(query, user);
  }

  @Get("payouts/:id")
  getOwnerPayout(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.getOwnerPayout(id, user);
  }

  @Post("payouts")
  createOwnerPayout(@Body() dto: CreateShamstayOwnerPayoutDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.createOwnerPayout(dto, user);
  }

  @Patch("payouts/:id")
  updateOwnerPayout(
    @Param("id") id: string,
    @Body() dto: UpdateShamstayOwnerPayoutDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateOwnerPayout(id, dto, user);
  }

  @Patch("payouts/:id/status")
  updateOwnerPayoutStatus(
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateOwnerPayoutStatus(id, dto, user);
  }

  @Delete("payouts/:id")
  archiveOwnerPayout(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.archiveOwnerPayout(id, user);
  }

  @Get("payments")
  listPayments(@Query() query: ListShamstayQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.listPayments(query, user);
  }

  @Get("payments/:id")
  getPayment(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.getPayment(id, user);
  }

  @Post("payments")
  createPayment(@Body() dto: CreateShamstayPaymentDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.createPayment(dto, user);
  }

  @Patch("payments/:id")
  updatePayment(
    @Param("id") id: string,
    @Body() dto: UpdateShamstayPaymentDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updatePayment(id, dto, user);
  }

  @Patch("payments/:id/status")
  updatePaymentStatus(
    @Param("id") id: string,
    @Body() dto: UpdateShamstayPaymentStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updatePaymentStatus(id, dto, user);
  }

  @Post("payments/:id/refunds")
  refundPayment(
    @Param("id") id: string,
    @Body() dto: RefundShamstayPaymentDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.refundPayment(id, dto, user);
  }

  @Delete("payments/:id")
  voidPayment(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.voidPayment(id, user);
  }

  @Get("reviews")
  listReviews(@Query() query: ListShamstayQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.listReviews(query, user);
  }

  @Get("reviews/:id")
  getReview(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.getReview(id, user);
  }

  @Post("reviews")
  createReview(@Body() dto: CreateShamstayReviewDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.createReview(dto, user);
  }

  @Patch("reviews/:id/status")
  updateReviewStatus(
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateReviewStatus(id, dto, user);
  }

  @Patch("reviews/:id/response")
  updateReviewResponse(
    @Param("id") id: string,
    @Body() dto: UpdateShamstayReviewResponseDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.updateReviewResponse(id, dto, user);
  }

  @Delete("reviews/:id")
  archiveReview(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.archiveReview(id, user);
  }

  @Get("conversations")
  listConversations(
    @Query() query: ListShamstayConversationQueryDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.listConversations(query, user);
  }

  @Post("conversations")
  createConversation(
    @Body() dto: CreateShamstayConversationDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.createConversation(dto, user);
  }

  @Get("conversations/:id")
  getConversation(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.getConversation(id, user);
  }

  @Delete("conversations/:id")
  archiveConversation(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.archiveConversation(id, user);
  }

  @Get("conversations/:id/messages")
  listConversationMessages(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.shamstayService.listConversationMessages(id, user);
  }

  @Post("conversations/:id/messages")
  createConversationMessage(
    @Param("id") id: string,
    @Body() dto: CreateShamstayMessageDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.shamstayService.createConversationMessage(id, dto, user);
  }
}

@Controller("public/shamstay")
export class ShamstayPublicController {
  constructor(private readonly shamstayService: ShamstayService) {}

  @Get("properties")
  listProperties(@Query() query: ListShamstayQueryDto) {
    return this.shamstayService.publicListProperties(query);
  }

  @Get("properties/:idOrSlug")
  getProperty(@Param("idOrSlug") idOrSlug: string) {
    return this.shamstayService.publicGetProperty(idOrSlug);
  }

  @Get("properties/:idOrSlug/quote")
  quoteProperty(@Param("idOrSlug") idOrSlug: string, @Query() query: ListShamstayQueryDto) {
    return this.shamstayService.publicQuoteProperty(idOrSlug, query);
  }

  @Get("properties/:idOrSlug/reviews")
  listReviews(@Param("idOrSlug") idOrSlug: string) {
    return this.shamstayService.publicListReviews(idOrSlug);
  }

  @Post("reservation-requests")
  createReservationRequest(@Body() dto: CreatePublicShamstayReservationRequestDto) {
    return this.shamstayService.publicCreateReservationRequest(dto);
  }

  @Post("payments")
  createPayment(@Body() dto: CreatePublicShamstayPaymentDto) {
    return this.shamstayService.publicCreatePayment(dto);
  }

  @Post("contact")
  createContact(@Body() dto: CreatePublicShamstayContactDto) {
    return this.shamstayService.publicCreateContact(dto);
  }

  @Get("wishlist")
  listWishlist(@Query() query: ListShamstaySavedQueryDto) {
    return this.shamstayService.publicListWishlist(query);
  }

  @Post("wishlist")
  saveWishlistItem(@Body() dto: CreateShamstayWishlistItemDto) {
    return this.shamstayService.publicSaveWishlistItem(dto);
  }

  @Delete("wishlist/:propertyIdOrSlug")
  removeWishlistItem(
    @Param("propertyIdOrSlug") propertyIdOrSlug: string,
    @Query("visitorKey") visitorKey: string | undefined
  ) {
    return this.shamstayService.publicRemoveWishlistItem(propertyIdOrSlug, visitorKey);
  }
}
