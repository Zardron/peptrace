import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { CurrentClientUser } from "../auth/current-client-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  CreatePeptraceBatchDto,
  CreatePeptraceCertificateDto,
  ListQualityQueryDto,
  UpdatePeptraceBatchDto,
  UpdatePeptraceCertificateDto,
  UpdateQualityStatusDto
} from "./quality.dto";
import { QualityService } from "./quality.service";

@Controller("quality")
@UseGuards(JwtAuthGuard)
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Get("vendors")
  listVendors(@CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.listVendors(user);
  }

  @Get("vendors/:idOrSlug")
  getVendor(@Param("idOrSlug") idOrSlug: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.getVendor(idOrSlug, user);
  }

  @Get("peptides")
  listPeptides(@CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.listPeptides(user);
  }

  @Get("peptides/:idOrSlug")
  getPeptide(@Param("idOrSlug") idOrSlug: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.getPeptide(idOrSlug, user);
  }

  @Get("labs")
  listLabs(@CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.listLabs(user);
  }

  @Get("tests")
  listTests(
    @Query("status") status: string | undefined,
    @Query("vendorId") vendorId: string | undefined,
    @Query("peptideId") peptideId: string | undefined,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.qualityService.listTests({ peptideId, status, vendorId }, user);
  }

  @Get("tests/:id")
  getTest(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.getTest(id, user);
  }

  @Get("batches")
  listBatches(@Query() query: ListQualityQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.listBatches(query, user);
  }

  @Get("batches/:idOrCode")
  getBatch(@Param("idOrCode") idOrCode: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.getBatch(idOrCode, user);
  }

  @Post("batches")
  createBatch(@Body() dto: CreatePeptraceBatchDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.createBatch(dto, user);
  }

  @Patch("batches/:id")
  updateBatch(
    @Param("id") id: string,
    @Body() dto: UpdatePeptraceBatchDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.qualityService.updateBatch(id, dto, user);
  }

  @Patch("batches/:id/status")
  updateBatchStatus(
    @Param("id") id: string,
    @Body() dto: UpdateQualityStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.qualityService.updateBatchStatus(id, dto, user);
  }

  @Delete("batches/:id")
  archiveBatch(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.archiveBatch(id, user);
  }

  @Get("certificates")
  listCertificates(@Query() query: ListQualityQueryDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.listCertificates(query, user);
  }

  @Get("certificates/:idOrNumber")
  getCertificate(@Param("idOrNumber") idOrNumber: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.getCertificate(idOrNumber, user);
  }

  @Post("certificates")
  createCertificate(@Body() dto: CreatePeptraceCertificateDto, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.createCertificate(dto, user);
  }

  @Patch("certificates/:id")
  updateCertificate(
    @Param("id") id: string,
    @Body() dto: UpdatePeptraceCertificateDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.qualityService.updateCertificate(id, dto, user);
  }

  @Patch("certificates/:id/status")
  updateCertificateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateQualityStatusDto,
    @CurrentClientUser() user: AuthenticatedClientUser
  ) {
    return this.qualityService.updateCertificateStatus(id, dto, user);
  }

  @Delete("certificates/:id")
  archiveCertificate(@Param("id") id: string, @CurrentClientUser() user: AuthenticatedClientUser) {
    return this.qualityService.archiveCertificate(id, user);
  }
}

@Controller("public/quality")
export class QualityPublicController {
  constructor(private readonly qualityService: QualityService) {}

  @Get("vendors")
  listVendors() {
    return this.qualityService.publicListVendors();
  }

  @Get("vendors/:idOrSlug")
  getVendor(@Param("idOrSlug") idOrSlug: string) {
    return this.qualityService.publicGetVendor(idOrSlug);
  }

  @Get("peptides")
  listPeptides() {
    return this.qualityService.publicListPeptides();
  }

  @Get("peptides/:idOrSlug")
  getPeptide(@Param("idOrSlug") idOrSlug: string) {
    return this.qualityService.publicGetPeptide(idOrSlug);
  }

  @Get("tests")
  listTests(@Query() query: ListQualityQueryDto) {
    return this.qualityService.publicListTests(query);
  }

  @Get("certificates/:idOrNumber/verify")
  verifyCertificate(@Param("idOrNumber") idOrNumber: string) {
    return this.qualityService.publicVerifyCertificate(idOrNumber);
  }
}
