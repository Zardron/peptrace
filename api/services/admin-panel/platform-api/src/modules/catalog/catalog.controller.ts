import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CatalogService } from "./catalog.service";
import { CreateLabDto, CreatePeptideDto, CreateVendorDto } from "./catalog.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("vendors")
  listVendors() {
    return this.catalogService.listVendors();
  }

  @Get("vendor/:idOrSlug")
  getVendor(@Param("idOrSlug") idOrSlug: string) {
    return this.catalogService.getVendor(idOrSlug);
  }

  @Post("vendors")
  createVendor(@Body() dto: CreateVendorDto) {
    return this.catalogService.createVendor(dto);
  }

  @Get("peptides")
  listPeptides() {
    return this.catalogService.listPeptides();
  }

  @Get("peptide/:idOrSlug")
  getPeptide(@Param("idOrSlug") idOrSlug: string) {
    return this.catalogService.getPeptide(idOrSlug);
  }

  @Post("peptides")
  createPeptide(@Body() dto: CreatePeptideDto) {
    return this.catalogService.createPeptide(dto);
  }

  @Get("labs")
  listLabs() {
    return this.catalogService.listLabs();
  }

  @Post("labs")
  createLab(@Body() dto: CreateLabDto) {
    return this.catalogService.createLab(dto);
  }
}
