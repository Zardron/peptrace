import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { CurrentClientUser } from "../auth/current-client-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  CreateCommissionDto,
  CreateLeadDto,
  CreateListingDto,
  CreateOfferDto,
  CreatePublicRealEstateInquiryDto,
  CreateRealEstateSavedListingDto,
  CreateRealEstateSavedSearchDto,
  CreateRealEstateTourRequestDto,
  CreateViewingDto,
  ListRealEstateQueryDto,
  ListRealEstateSavedQueryDto,
  UpdateCommissionDto,
  UpdateLeadDto,
  UpdateListingDto,
  UpdateOfferDto,
  UpdateRealEstateStatusDto,
  UpdateViewingDto
} from "./real-estate.dto";
import { RealEstateService } from "./real-estate.service";

@Controller("real-estate")
@UseGuards(JwtAuthGuard)
export class RealEstateController {
  constructor(private readonly realEstateService: RealEstateService) {}

  @Get("analytics/overview")
  analyticsOverview(@Query() query: ListRealEstateQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.analyticsOverview(query, user);
  }

  @Get("listings")
  listListings(@Query() query: ListRealEstateQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.listListings(query, user);
  }

  @Get("listings/:idOrSlug")
  getListing(@Param("idOrSlug") idOrSlug: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.getListing(idOrSlug, user);
  }

  @Post("listings")
  createListing(@Body() dto: CreateListingDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.createListing(dto, user);
  }

  @Patch("listings/:id")
  updateListing(
    @Param("id") id: string,
    @Body() dto: UpdateListingDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.realEstateService.updateListing(id, dto, user);
  }

  @Patch("listings/:id/status")
  updateListingStatus(
    @Param("id") id: string,
    @Body() dto: UpdateRealEstateStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.realEstateService.updateListingStatus(id, dto, user);
  }

  @Delete("listings/:id")
  archiveListing(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.archiveListing(id, user);
  }

  @Get("leads")
  listLeads(@Query() query: ListRealEstateQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.listLeads(query, user);
  }

  @Get("leads/:id")
  getLead(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.getLead(id, user);
  }

  @Post("leads")
  createLead(@Body() dto: CreateLeadDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.createLead(dto, user);
  }

  @Patch("leads/:id")
  updateLead(
    @Param("id") id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.realEstateService.updateLead(id, dto, user);
  }

  @Patch("leads/:id/status")
  updateLeadStatus(
    @Param("id") id: string,
    @Body() dto: UpdateRealEstateStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.realEstateService.updateLeadStatus(id, dto, user);
  }

  @Delete("leads/:id")
  archiveLead(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.archiveLead(id, user);
  }

  @Get("viewings")
  listViewings(@Query() query: ListRealEstateQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.listViewings(query, user);
  }

  @Get("viewings/:id")
  getViewing(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.getViewing(id, user);
  }

  @Post("viewings")
  createViewing(@Body() dto: CreateViewingDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.createViewing(dto, user);
  }

  @Patch("viewings/:id")
  updateViewing(
    @Param("id") id: string,
    @Body() dto: UpdateViewingDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.realEstateService.updateViewing(id, dto, user);
  }

  @Patch("viewings/:id/status")
  updateViewingStatus(
    @Param("id") id: string,
    @Body() dto: UpdateRealEstateStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.realEstateService.updateViewingStatus(id, dto, user);
  }

  @Delete("viewings/:id")
  archiveViewing(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.archiveViewing(id, user);
  }

  @Get("offers")
  listOffers(@Query() query: ListRealEstateQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.listOffers(query, user);
  }

  @Get("offers/:id")
  getOffer(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.getOffer(id, user);
  }

  @Post("offers")
  createOffer(@Body() dto: CreateOfferDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.createOffer(dto, user);
  }

  @Patch("offers/:id")
  updateOffer(
    @Param("id") id: string,
    @Body() dto: UpdateOfferDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.realEstateService.updateOffer(id, dto, user);
  }

  @Patch("offers/:id/status")
  updateOfferStatus(
    @Param("id") id: string,
    @Body() dto: UpdateRealEstateStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.realEstateService.updateOfferStatus(id, dto, user);
  }

  @Delete("offers/:id")
  archiveOffer(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.archiveOffer(id, user);
  }

  @Get("commissions")
  listCommissions(@Query() query: ListRealEstateQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.listCommissions(query, user);
  }

  @Get("commissions/:id")
  getCommission(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.getCommission(id, user);
  }

  @Post("commissions")
  createCommission(@Body() dto: CreateCommissionDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.createCommission(dto, user);
  }

  @Patch("commissions/:id")
  updateCommission(
    @Param("id") id: string,
    @Body() dto: UpdateCommissionDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.realEstateService.updateCommission(id, dto, user);
  }

  @Patch("commissions/:id/status")
  updateCommissionStatus(
    @Param("id") id: string,
    @Body() dto: UpdateRealEstateStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.realEstateService.updateCommissionStatus(id, dto, user);
  }

  @Delete("commissions/:id")
  voidCommission(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.voidCommission(id, user);
  }

  @Get("saved-listings")
  listSavedListings(@Query("visitorKey") visitorKey: string | undefined, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.listSavedListings(visitorKey, user);
  }

  @Get("saved-searches")
  listSavedSearches(@Query("visitorKey") visitorKey: string | undefined, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.realEstateService.listSavedSearches(visitorKey, user);
  }
}

@Controller("public/real-estate")
export class RealEstatePublicController {
  constructor(private readonly realEstateService: RealEstateService) {}

  @Get("listings")
  listListings(@Query() query: ListRealEstateQueryDto) {
    return this.realEstateService.publicListListings(query);
  }

  @Get("listings/:idOrSlug")
  getListing(@Param("idOrSlug") idOrSlug: string) {
    return this.realEstateService.publicGetListing(idOrSlug);
  }

  @Post("inquiries")
  createInquiry(@Body() dto: CreatePublicRealEstateInquiryDto) {
    return this.realEstateService.publicCreateInquiry(dto);
  }

  @Post("tour-requests")
  createTourRequest(@Body() dto: CreateRealEstateTourRequestDto) {
    return this.realEstateService.publicCreateTourRequest(dto);
  }

  @Get("saved-listings")
  listSavedListings(@Query() query: ListRealEstateSavedQueryDto) {
    return this.realEstateService.publicListSavedListings(query);
  }

  @Post("saved-listings")
  saveListing(@Body() dto: CreateRealEstateSavedListingDto) {
    return this.realEstateService.publicSaveListing(dto);
  }

  @Delete("saved-listings/:listingIdOrSlug")
  removeSavedListing(
    @Param("listingIdOrSlug") listingIdOrSlug: string,
    @Query("visitorKey") visitorKey: string | undefined
  ) {
    return this.realEstateService.publicRemoveSavedListing(listingIdOrSlug, visitorKey);
  }

  @Get("saved-searches")
  listSavedSearches(@Query() query: ListRealEstateSavedQueryDto) {
    return this.realEstateService.publicListSavedSearches(query);
  }

  @Post("saved-searches")
  createSavedSearch(@Body() dto: CreateRealEstateSavedSearchDto) {
    return this.realEstateService.publicCreateSavedSearch(dto);
  }

  @Delete("saved-searches/:id")
  deleteSavedSearch(@Param("id") id: string, @Query("visitorKey") visitorKey: string | undefined) {
    return this.realEstateService.publicDeleteSavedSearch(id, visitorKey);
  }
}
