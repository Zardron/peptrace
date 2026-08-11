import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLabDto, CreatePeptideDto, CreateVendorDto } from "./catalog.dto";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listVendors() {
    return this.prisma.vendor.findMany({
      include: { products: true },
      orderBy: { displayName: "asc" }
    });
  }

  async getVendor(idOrSlug: string) {
    const vendor = await this.prisma.vendor.findFirst({
      include: { products: true, tests: true },
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }]
      }
    });

    if (!vendor) {
      throw new NotFoundException("Vendor not found");
    }

    return vendor;
  }

  createVendor(dto: CreateVendorDto) {
    return this.prisma.vendor.create({
      data: {
        displayName: dto.displayName,
        slug: dto.slug,
        overallRating: dto.overallRating ?? 0
      }
    });
  }

  listPeptides() {
    return this.prisma.peptide.findMany({
      include: { tests: true },
      orderBy: { label: "asc" }
    });
  }

  async getPeptide(idOrSlug: string) {
    const peptide = await this.prisma.peptide.findFirst({
      include: { products: true, tests: true },
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }]
      }
    });

    if (!peptide) {
      throw new NotFoundException("Peptide not found");
    }

    return peptide;
  }

  createPeptide(dto: CreatePeptideDto) {
    return this.prisma.peptide.create({ data: dto });
  }

  listLabs() {
    return this.prisma.lab.findMany({
      include: { tests: true },
      orderBy: { displayName: "asc" }
    });
  }

  createLab(dto: CreateLabDto) {
    return this.prisma.lab.create({
      data: {
        ...dto,
        partnerSince: new Date()
      }
    });
  }
}
