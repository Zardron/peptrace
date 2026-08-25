import { Prisma } from "@prisma/client";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePeptraceBatchDto, CreatePeptraceCertificateDto, ListQualityQueryDto, UpdatePeptraceBatchDto, UpdatePeptraceCertificateDto, UpdateQualityStatusDto } from "./quality.dto";
export declare class QualityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listVendors(user: AuthenticatedClientUser): Promise<({
        products: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            label: string;
            vendorId: string;
            peptideId: string;
            purityPercent: number;
            priceMg: number;
            rating: number;
            doseMg: number;
            labelAccuracyDelta: number;
            testsCount: number;
        }[];
    } & {
        id: string;
        displayName: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        overallRating: number;
    })[]>;
    getVendor(idOrSlug: string, user: AuthenticatedClientUser): Promise<{
        products: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            label: string;
            vendorId: string;
            peptideId: string;
            purityPercent: number;
            priceMg: number;
            rating: number;
            doseMg: number;
            labelAccuracyDelta: number;
            testsCount: number;
        }[];
        tests: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            labId: string;
            vialSizeMg: number;
            vendorId: string;
            resultsReleasedAt: Date | null;
            testingStatus: string;
            peptideId: string;
            assay: string;
            purityPercent: number | null;
            labelClaimPercent: number | null;
        }[];
    } & {
        id: string;
        displayName: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        overallRating: number;
    }>;
    listPeptides(user: AuthenticatedClientUser): Promise<({
        tests: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            labId: string;
            vialSizeMg: number;
            vendorId: string;
            resultsReleasedAt: Date | null;
            testingStatus: string;
            peptideId: string;
            assay: string;
            purityPercent: number | null;
            labelClaimPercent: number | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        label: string;
    })[]>;
    getPeptide(idOrSlug: string, user: AuthenticatedClientUser): Promise<{
        products: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            label: string;
            vendorId: string;
            peptideId: string;
            purityPercent: number;
            priceMg: number;
            rating: number;
            doseMg: number;
            labelAccuracyDelta: number;
            testsCount: number;
        }[];
        tests: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            labId: string;
            vialSizeMg: number;
            vendorId: string;
            resultsReleasedAt: Date | null;
            testingStatus: string;
            peptideId: string;
            assay: string;
            purityPercent: number | null;
            labelClaimPercent: number | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        label: string;
    }>;
    listLabs(user: AuthenticatedClientUser): Promise<({
        tests: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            labId: string;
            vialSizeMg: number;
            vendorId: string;
            resultsReleasedAt: Date | null;
            testingStatus: string;
            peptideId: string;
            assay: string;
            purityPercent: number | null;
            labelClaimPercent: number | null;
        }[];
    } & {
        id: string;
        displayName: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        partnerSince: Date;
    })[]>;
    listTests(query: {
        peptideId?: string;
        status?: string;
        vendorId?: string;
    }, user: AuthenticatedClientUser): Promise<({
        vendor: {
            id: string;
            displayName: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            overallRating: number;
        };
        peptide: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            label: string;
        };
        lab: {
            id: string;
            displayName: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            partnerSince: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        labId: string;
        vialSizeMg: number;
        vendorId: string;
        resultsReleasedAt: Date | null;
        testingStatus: string;
        peptideId: string;
        assay: string;
        purityPercent: number | null;
        labelClaimPercent: number | null;
    })[]>;
    getTest(id: string, user: AuthenticatedClientUser): Promise<{
        vendor: {
            id: string;
            displayName: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            overallRating: number;
        };
        peptide: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            label: string;
        };
        lab: {
            id: string;
            displayName: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            partnerSince: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        labId: string;
        vialSizeMg: number;
        vendorId: string;
        resultsReleasedAt: Date | null;
        testingStatus: string;
        peptideId: string;
        assay: string;
        purityPercent: number | null;
        labelClaimPercent: number | null;
    }>;
    listBatches(query: ListQualityQueryDto, user: AuthenticatedClientUser): Promise<({
        certificates: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        notes: string | null;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
    })[]>;
    getBatch(idOrCode: string, user: AuthenticatedClientUser): Promise<{
        certificates: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        notes: string | null;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
    }>;
    createBatch(dto: CreatePeptraceBatchDto, user: AuthenticatedClientUser): Promise<{
        certificates: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        notes: string | null;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
    }>;
    updateBatchStatus(id: string, dto: UpdateQualityStatusDto, user: AuthenticatedClientUser): Promise<{
        certificates: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        notes: string | null;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
    }>;
    updateBatch(id: string, dto: UpdatePeptraceBatchDto, user: AuthenticatedClientUser): Promise<{
        certificates: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        notes: string | null;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
    }>;
    archiveBatch(id: string, user: AuthenticatedClientUser): Promise<{
        certificates: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        notes: string | null;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
    }>;
    listCertificates(query: ListQualityQueryDto, user: AuthenticatedClientUser): Promise<({
        batch: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            notes: string | null;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
        };
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        batchId: string;
        labTestId: string | null;
        certificateNumber: string;
        issuedAt: Date | null;
        expiresAt: Date | null;
        documentUrl: string | null;
        summary: Prisma.JsonValue;
    })[]>;
    getCertificate(idOrNumber: string, user: AuthenticatedClientUser): Promise<{
        batch: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            notes: string | null;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
        };
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        batchId: string;
        labTestId: string | null;
        certificateNumber: string;
        issuedAt: Date | null;
        expiresAt: Date | null;
        documentUrl: string | null;
        summary: Prisma.JsonValue;
    }>;
    createCertificate(dto: CreatePeptraceCertificateDto, user: AuthenticatedClientUser): Promise<{
        batch: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            notes: string | null;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
        };
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        batchId: string;
        labTestId: string | null;
        certificateNumber: string;
        issuedAt: Date | null;
        expiresAt: Date | null;
        documentUrl: string | null;
        summary: Prisma.JsonValue;
    }>;
    updateCertificateStatus(id: string, dto: UpdateQualityStatusDto, user: AuthenticatedClientUser): Promise<{
        batch: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            notes: string | null;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
        };
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        batchId: string;
        labTestId: string | null;
        certificateNumber: string;
        issuedAt: Date | null;
        expiresAt: Date | null;
        documentUrl: string | null;
        summary: Prisma.JsonValue;
    }>;
    updateCertificate(id: string, dto: UpdatePeptraceCertificateDto, user: AuthenticatedClientUser): Promise<{
        batch: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            notes: string | null;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
        };
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        batchId: string;
        labTestId: string | null;
        certificateNumber: string;
        issuedAt: Date | null;
        expiresAt: Date | null;
        documentUrl: string | null;
        summary: Prisma.JsonValue;
    }>;
    archiveCertificate(id: string, user: AuthenticatedClientUser): Promise<{
        batch: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            notes: string | null;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
        };
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        batchId: string;
        labTestId: string | null;
        certificateNumber: string;
        issuedAt: Date | null;
        expiresAt: Date | null;
        documentUrl: string | null;
        summary: Prisma.JsonValue;
    }>;
    publicListVendors(): Promise<({
        products: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            label: string;
            vendorId: string;
            peptideId: string;
            purityPercent: number;
            priceMg: number;
            rating: number;
            doseMg: number;
            labelAccuracyDelta: number;
            testsCount: number;
        }[];
    } & {
        id: string;
        displayName: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        overallRating: number;
    })[]>;
    publicGetVendor(idOrSlug: string): Promise<{
        products: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            label: string;
            vendorId: string;
            peptideId: string;
            purityPercent: number;
            priceMg: number;
            rating: number;
            doseMg: number;
            labelAccuracyDelta: number;
            testsCount: number;
        }[];
        tests: ({
            peptide: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                label: string;
            };
            lab: {
                id: string;
                displayName: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                partnerSince: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            labId: string;
            vialSizeMg: number;
            vendorId: string;
            resultsReleasedAt: Date | null;
            testingStatus: string;
            peptideId: string;
            assay: string;
            purityPercent: number | null;
            labelClaimPercent: number | null;
        })[];
    } & {
        id: string;
        displayName: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        overallRating: number;
    }>;
    publicListPeptides(): Promise<({
        products: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            label: string;
            vendorId: string;
            peptideId: string;
            purityPercent: number;
            priceMg: number;
            rating: number;
            doseMg: number;
            labelAccuracyDelta: number;
            testsCount: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        label: string;
    })[]>;
    publicGetPeptide(idOrSlug: string): Promise<{
        products: ({
            vendor: {
                id: string;
                displayName: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                overallRating: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            label: string;
            vendorId: string;
            peptideId: string;
            purityPercent: number;
            priceMg: number;
            rating: number;
            doseMg: number;
            labelAccuracyDelta: number;
            testsCount: number;
        })[];
        tests: ({
            vendor: {
                id: string;
                displayName: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                overallRating: number;
            };
            lab: {
                id: string;
                displayName: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                partnerSince: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            labId: string;
            vialSizeMg: number;
            vendorId: string;
            resultsReleasedAt: Date | null;
            testingStatus: string;
            peptideId: string;
            assay: string;
            purityPercent: number | null;
            labelClaimPercent: number | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        label: string;
    }>;
    publicListTests(query: ListQualityQueryDto): Promise<({
        vendor: {
            id: string;
            displayName: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            overallRating: number;
        };
        peptide: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            label: string;
        };
        lab: {
            id: string;
            displayName: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            partnerSince: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        labId: string;
        vialSizeMg: number;
        vendorId: string;
        resultsReleasedAt: Date | null;
        testingStatus: string;
        peptideId: string;
        assay: string;
        purityPercent: number | null;
        labelClaimPercent: number | null;
    })[]>;
    publicVerifyCertificate(idOrNumber: string): Promise<{
        batch: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            notes: string | null;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
        };
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        batchId: string;
        labTestId: string | null;
        certificateNumber: string;
        issuedAt: Date | null;
        expiresAt: Date | null;
        documentUrl: string | null;
        summary: Prisma.JsonValue;
    }>;
    private buildBatchUpdate;
    private buildCertificateUpdate;
    private getTenantId;
    private ensureVendor;
    private ensurePeptide;
    private ensureBatch;
    private ensureLabTest;
    private ensureCertificate;
    private assertCanWrite;
    private assertPeptrace;
    private rethrowUnique;
}
