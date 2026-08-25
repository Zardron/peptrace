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
exports.QualityService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const WRITE_ROLES = new Set(["owner", "admin", "manager"]);
const PEPTRACE_TENANT_SLUG = "peptrace";
const PUBLIC_TEST_STATUSES = ["APPROVED", "PASSED", "RELEASED", "VERIFIED"];
const PUBLIC_CERTIFICATE_STATUSES = ["ISSUED", "APPROVED", "VERIFIED"];
let QualityService = class QualityService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listVendors(user) {
        this.assertPeptrace(user);
        return this.prisma.withConnectionRetry(() => this.prisma.vendor.findMany({
            include: { products: true },
            orderBy: { displayName: "asc" }
        }));
    }
    async getVendor(idOrSlug, user) {
        this.assertPeptrace(user);
        const vendor = await this.prisma.withConnectionRetry(() => this.prisma.vendor.findFirst({
            include: { products: true, tests: true },
            where: {
                OR: [{ id: idOrSlug }, { slug: idOrSlug }]
            }
        }));
        if (!vendor) {
            throw new common_1.NotFoundException("Vendor not found");
        }
        return vendor;
    }
    listPeptides(user) {
        this.assertPeptrace(user);
        return this.prisma.withConnectionRetry(() => this.prisma.peptide.findMany({
            include: { tests: true },
            orderBy: { label: "asc" }
        }));
    }
    async getPeptide(idOrSlug, user) {
        this.assertPeptrace(user);
        const peptide = await this.prisma.withConnectionRetry(() => this.prisma.peptide.findFirst({
            include: { products: true, tests: true },
            where: {
                OR: [{ id: idOrSlug }, { slug: idOrSlug }]
            }
        }));
        if (!peptide) {
            throw new common_1.NotFoundException("Peptide not found");
        }
        return peptide;
    }
    listLabs(user) {
        this.assertPeptrace(user);
        return this.prisma.withConnectionRetry(() => this.prisma.lab.findMany({
            include: { tests: true },
            orderBy: { displayName: "asc" }
        }));
    }
    listTests(query, user) {
        this.assertPeptrace(user);
        return this.prisma.withConnectionRetry(() => this.prisma.labTest.findMany({
            include: {
                lab: true,
                peptide: true,
                vendor: true
            },
            orderBy: { createdAt: "desc" },
            where: {
                peptideId: query.peptideId,
                testingStatus: query.status,
                vendorId: query.vendorId
            }
        }));
    }
    async getTest(id, user) {
        this.assertPeptrace(user);
        const test = await this.prisma.withConnectionRetry(() => this.prisma.labTest.findUnique({
            include: {
                lab: true,
                peptide: true,
                vendor: true
            },
            where: { id }
        }));
        if (!test) {
            throw new common_1.NotFoundException("Lab test not found");
        }
        return test;
    }
    listBatches(query, user) {
        this.assertPeptrace(user);
        return this.prisma.withConnectionRetry(() => this.prisma.peptraceBatch.findMany({
            include: { certificates: true },
            orderBy: { receivedAt: "desc" },
            where: {
                peptideId: query.peptideId,
                status: query.status,
                tenantId: user.tenantId,
                vendorId: query.vendorId
            }
        }));
    }
    async getBatch(idOrCode, user) {
        this.assertPeptrace(user);
        const batch = await this.prisma.withConnectionRetry(() => this.prisma.peptraceBatch.findFirst({
            include: { certificates: true },
            where: {
                tenantId: user.tenantId,
                OR: [{ id: idOrCode }, { batchCode: idOrCode }]
            }
        }));
        if (!batch) {
            throw new common_1.NotFoundException("Batch not found");
        }
        return batch;
    }
    async createBatch(dto, user) {
        this.assertCanWrite(user);
        await Promise.all([this.ensureVendor(dto.vendorId), this.ensurePeptide(dto.peptideId)]);
        try {
            return await this.prisma.withConnectionRetry(() => this.prisma.peptraceBatch.create({
                data: {
                    batchCode: dto.batchCode.trim(),
                    manufacturedAt: dto.manufacturedAt ? new Date(dto.manufacturedAt) : null,
                    notes: dto.notes?.trim() || null,
                    peptideId: dto.peptideId,
                    productId: dto.productId?.trim() || null,
                    quantityVials: dto.quantityVials,
                    receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : null,
                    status: dto.status?.trim() || "RECEIVED",
                    storageCondition: dto.storageCondition?.trim() || null,
                    tenantId: user.tenantId,
                    vendorId: dto.vendorId,
                    vialSizeMg: dto.vialSizeMg
                },
                include: { certificates: true }
            }));
        }
        catch (error) {
            this.rethrowUnique(error, "A batch with this code already exists");
        }
    }
    async updateBatchStatus(id, dto, user) {
        this.assertCanWrite(user);
        const batch = await this.prisma.withConnectionRetry(() => this.prisma.peptraceBatch.findFirst({ where: { id, tenantId: user.tenantId } }));
        if (!batch) {
            throw new common_1.NotFoundException("Batch not found");
        }
        return this.prisma.withConnectionRetry(() => this.prisma.peptraceBatch.update({
            data: { notes: dto.notes?.trim() ?? batch.notes, status: dto.status.trim() },
            where: { id },
            include: { certificates: true }
        }));
    }
    async updateBatch(id, dto, user) {
        this.assertCanWrite(user);
        await this.ensureBatch(id, user.tenantId);
        if (dto.vendorId) {
            await this.ensureVendor(dto.vendorId);
        }
        if (dto.peptideId) {
            await this.ensurePeptide(dto.peptideId);
        }
        try {
            return await this.prisma.withConnectionRetry(() => this.prisma.peptraceBatch.update({
                data: this.buildBatchUpdate(dto),
                where: { id },
                include: { certificates: true }
            }));
        }
        catch (error) {
            this.rethrowUnique(error, "A batch with this code already exists");
        }
    }
    async archiveBatch(id, user) {
        this.assertCanWrite(user);
        await this.ensureBatch(id, user.tenantId);
        return this.prisma.withConnectionRetry(() => this.prisma.peptraceBatch.update({
            data: { status: "ARCHIVED" },
            where: { id },
            include: { certificates: true }
        }));
    }
    listCertificates(query, user) {
        this.assertPeptrace(user);
        return this.prisma.withConnectionRetry(() => this.prisma.peptraceCertificate.findMany({
            include: { batch: true },
            orderBy: { createdAt: "desc" },
            where: {
                batchId: query.batchId,
                status: query.status,
                tenantId: user.tenantId
            }
        }));
    }
    async getCertificate(idOrNumber, user) {
        this.assertPeptrace(user);
        const certificate = await this.prisma.withConnectionRetry(() => this.prisma.peptraceCertificate.findFirst({
            include: { batch: true },
            where: {
                tenantId: user.tenantId,
                OR: [{ id: idOrNumber }, { certificateNumber: idOrNumber }]
            }
        }));
        if (!certificate) {
            throw new common_1.NotFoundException("Certificate not found");
        }
        return certificate;
    }
    async createCertificate(dto, user) {
        this.assertCanWrite(user);
        await this.ensureBatch(dto.batchId, user.tenantId);
        if (dto.labTestId) {
            await this.ensureLabTest(dto.labTestId);
        }
        try {
            return await this.prisma.withConnectionRetry(() => this.prisma.peptraceCertificate.create({
                data: {
                    batchId: dto.batchId,
                    certificateNumber: dto.certificateNumber.trim(),
                    documentUrl: dto.documentUrl?.trim() || null,
                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                    issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
                    labTestId: dto.labTestId?.trim() || null,
                    status: dto.status?.trim() || "DRAFT",
                    summary: (dto.summary ?? {}),
                    tenantId: user.tenantId
                },
                include: { batch: true }
            }));
        }
        catch (error) {
            this.rethrowUnique(error, "A certificate with this number already exists");
        }
    }
    async updateCertificateStatus(id, dto, user) {
        this.assertCanWrite(user);
        const certificate = await this.prisma.withConnectionRetry(() => this.prisma.peptraceCertificate.findFirst({ where: { id, tenantId: user.tenantId } }));
        if (!certificate) {
            throw new common_1.NotFoundException("Certificate not found");
        }
        return this.prisma.withConnectionRetry(() => this.prisma.peptraceCertificate.update({
            data: { status: dto.status.trim() },
            where: { id },
            include: { batch: true }
        }));
    }
    async updateCertificate(id, dto, user) {
        this.assertCanWrite(user);
        await this.ensureCertificate(id, user.tenantId);
        if (dto.batchId) {
            await this.ensureBatch(dto.batchId, user.tenantId);
        }
        if (dto.labTestId) {
            await this.ensureLabTest(dto.labTestId);
        }
        try {
            return await this.prisma.withConnectionRetry(() => this.prisma.peptraceCertificate.update({
                data: this.buildCertificateUpdate(dto),
                where: { id },
                include: { batch: true }
            }));
        }
        catch (error) {
            this.rethrowUnique(error, "A certificate with this number already exists");
        }
    }
    async archiveCertificate(id, user) {
        this.assertCanWrite(user);
        await this.ensureCertificate(id, user.tenantId);
        return this.prisma.withConnectionRetry(() => this.prisma.peptraceCertificate.update({
            data: { status: "ARCHIVED" },
            where: { id },
            include: { batch: true }
        }));
    }
    publicListVendors() {
        return this.prisma.withConnectionRetry(() => this.prisma.vendor.findMany({
            include: { products: true },
            orderBy: { overallRating: "desc" }
        }));
    }
    async publicGetVendor(idOrSlug) {
        const vendor = await this.prisma.withConnectionRetry(() => this.prisma.vendor.findFirst({
            include: {
                products: true,
                tests: {
                    include: { lab: true, peptide: true },
                    orderBy: { resultsReleasedAt: "desc" },
                    where: { testingStatus: { in: PUBLIC_TEST_STATUSES } }
                }
            },
            where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        }));
        if (!vendor) {
            throw new common_1.NotFoundException("Vendor not found");
        }
        return vendor;
    }
    publicListPeptides() {
        return this.prisma.withConnectionRetry(() => this.prisma.peptide.findMany({
            include: { products: true },
            orderBy: { label: "asc" }
        }));
    }
    async publicGetPeptide(idOrSlug) {
        const peptide = await this.prisma.withConnectionRetry(() => this.prisma.peptide.findFirst({
            include: {
                products: { include: { vendor: true } },
                tests: {
                    include: { lab: true, vendor: true },
                    orderBy: { resultsReleasedAt: "desc" },
                    where: { testingStatus: { in: PUBLIC_TEST_STATUSES } }
                }
            },
            where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        }));
        if (!peptide) {
            throw new common_1.NotFoundException("Peptide not found");
        }
        return peptide;
    }
    publicListTests(query) {
        return this.prisma.withConnectionRetry(() => this.prisma.labTest.findMany({
            include: { lab: true, peptide: true, vendor: true },
            orderBy: { resultsReleasedAt: "desc" },
            where: {
                peptideId: query.peptideId,
                testingStatus: query.status && PUBLIC_TEST_STATUSES.includes(query.status) ? query.status : { in: PUBLIC_TEST_STATUSES },
                vendorId: query.vendorId
            }
        }));
    }
    async publicVerifyCertificate(idOrNumber) {
        const tenantId = await this.getTenantId();
        const certificate = await this.prisma.withConnectionRetry(() => this.prisma.peptraceCertificate.findFirst({
            include: {
                batch: true
            },
            where: {
                tenantId,
                status: { in: PUBLIC_CERTIFICATE_STATUSES },
                OR: [{ id: idOrNumber }, { certificateNumber: idOrNumber }]
            }
        }));
        if (!certificate) {
            throw new common_1.NotFoundException("Certificate not found or not public");
        }
        return certificate;
    }
    buildBatchUpdate(dto) {
        const data = {};
        if (dto.batchCode !== undefined)
            data.batchCode = dto.batchCode.trim();
        if (dto.vendorId !== undefined)
            data.vendorId = dto.vendorId;
        if (dto.peptideId !== undefined)
            data.peptideId = dto.peptideId;
        if (dto.productId !== undefined)
            data.productId = dto.productId.trim() || null;
        if (dto.manufacturedAt !== undefined)
            data.manufacturedAt = dto.manufacturedAt ? new Date(dto.manufacturedAt) : null;
        if (dto.receivedAt !== undefined)
            data.receivedAt = dto.receivedAt ? new Date(dto.receivedAt) : null;
        if (dto.status !== undefined)
            data.status = dto.status.trim();
        if (dto.quantityVials !== undefined)
            data.quantityVials = dto.quantityVials;
        if (dto.vialSizeMg !== undefined)
            data.vialSizeMg = dto.vialSizeMg;
        if (dto.storageCondition !== undefined)
            data.storageCondition = dto.storageCondition.trim() || null;
        if (dto.notes !== undefined)
            data.notes = dto.notes.trim() || null;
        return data;
    }
    buildCertificateUpdate(dto) {
        const data = {};
        if (dto.batchId !== undefined)
            data.batchId = dto.batchId;
        if (dto.labTestId !== undefined)
            data.labTestId = dto.labTestId.trim() || null;
        if (dto.certificateNumber !== undefined)
            data.certificateNumber = dto.certificateNumber.trim();
        if (dto.status !== undefined)
            data.status = dto.status.trim();
        if (dto.issuedAt !== undefined)
            data.issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : null;
        if (dto.expiresAt !== undefined)
            data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
        if (dto.documentUrl !== undefined)
            data.documentUrl = dto.documentUrl.trim() || null;
        if (dto.summary !== undefined)
            data.summary = dto.summary;
        return data;
    }
    async getTenantId() {
        const tenant = await this.prisma.withConnectionRetry(() => this.prisma.clientTenant.findUnique({
            select: { id: true },
            where: { slug: PEPTRACE_TENANT_SLUG }
        }));
        if (!tenant) {
            throw new common_1.NotFoundException("Peptrace tenant is not configured");
        }
        return tenant.id;
    }
    async ensureVendor(id) {
        const vendor = await this.prisma.withConnectionRetry(() => this.prisma.vendor.findUnique({ select: { id: true }, where: { id } }));
        if (!vendor) {
            throw new common_1.NotFoundException("Vendor not found");
        }
    }
    async ensurePeptide(id) {
        const peptide = await this.prisma.withConnectionRetry(() => this.prisma.peptide.findUnique({ select: { id: true }, where: { id } }));
        if (!peptide) {
            throw new common_1.NotFoundException("Peptide not found");
        }
    }
    async ensureBatch(id, tenantId) {
        const batch = await this.prisma.withConnectionRetry(() => this.prisma.peptraceBatch.findFirst({ select: { id: true }, where: { id, tenantId } }));
        if (!batch) {
            throw new common_1.NotFoundException("Batch not found");
        }
    }
    async ensureLabTest(id) {
        const test = await this.prisma.withConnectionRetry(() => this.prisma.labTest.findUnique({ select: { id: true }, where: { id } }));
        if (!test) {
            throw new common_1.NotFoundException("Lab test not found");
        }
    }
    async ensureCertificate(id, tenantId) {
        const certificate = await this.prisma.withConnectionRetry(() => this.prisma.peptraceCertificate.findFirst({ select: { id: true }, where: { id, tenantId } }));
        if (!certificate) {
            throw new common_1.NotFoundException("Certificate not found");
        }
    }
    assertCanWrite(user) {
        this.assertPeptrace(user);
        if (!WRITE_ROLES.has(user.role)) {
            throw new common_1.ForbiddenException("Only Peptrace owners, admins, and managers can change quality data");
        }
    }
    assertPeptrace(user) {
        if (user.tenantSlug !== PEPTRACE_TENANT_SLUG) {
            throw new common_1.NotFoundException("Quality service is not enabled for this company");
        }
    }
    rethrowUnique(error, message) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new common_1.ConflictException(message);
        }
        throw error;
    }
};
exports.QualityService = QualityService;
exports.QualityService = QualityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QualityService);
//# sourceMappingURL=quality.service.js.map