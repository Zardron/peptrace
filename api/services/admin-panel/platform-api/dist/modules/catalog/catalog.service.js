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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CatalogService = class CatalogService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listVendors() {
        return this.prisma.vendor.findMany({
            include: { products: true },
            orderBy: { displayName: "asc" }
        });
    }
    async getVendor(idOrSlug) {
        const vendor = await this.prisma.vendor.findFirst({
            include: { products: true, tests: true },
            where: {
                OR: [{ id: idOrSlug }, { slug: idOrSlug }]
            }
        });
        if (!vendor) {
            throw new common_1.NotFoundException("Vendor not found");
        }
        return vendor;
    }
    createVendor(dto) {
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
    async getPeptide(idOrSlug) {
        const peptide = await this.prisma.peptide.findFirst({
            include: { products: true, tests: true },
            where: {
                OR: [{ id: idOrSlug }, { slug: idOrSlug }]
            }
        });
        if (!peptide) {
            throw new common_1.NotFoundException("Peptide not found");
        }
        return peptide;
    }
    createPeptide(dto) {
        return this.prisma.peptide.create({ data: dto });
    }
    listLabs() {
        return this.prisma.lab.findMany({
            include: { tests: true },
            orderBy: { displayName: "asc" }
        });
    }
    createLab(dto) {
        return this.prisma.lab.create({
            data: {
                ...dto,
                partnerSince: new Date()
            }
        });
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map