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
            slug: string;
            createdAt: Date;
            updatedAt: Date;
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
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        overallRating: number;
    })[]>;
    getVendor(idOrSlug: string, user: AuthenticatedClientUser): Promise<{
        products: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
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
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
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
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        label: string;
    })[]>;
    getPeptide(idOrSlug: string, user: AuthenticatedClientUser): Promise<{
        products: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
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
        slug: string;
        createdAt: Date;
        updatedAt: Date;
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
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        partnerSince: Date;
    })[]>;
    listTests(query: {
        peptideId?: string;
        status?: string;
        vendorId?: string;
    }, user: AuthenticatedClientUser): Promise<({
        vendor: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            displayName: string;
            overallRating: number;
        };
        peptide: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            label: string;
        };
        lab: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            displayName: string;
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
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            displayName: string;
            overallRating: number;
        };
        peptide: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            label: string;
        };
        lab: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            displayName: string;
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
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        tenantId: string;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
        notes: string | null;
    })[]>;
    getBatch(idOrCode: string, user: AuthenticatedClientUser): Promise<{
        certificates: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        tenantId: string;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
        notes: string | null;
    }>;
    createBatch(dto: CreatePeptraceBatchDto, user: AuthenticatedClientUser): Promise<{
        certificates: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        tenantId: string;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
        notes: string | null;
    }>;
    updateBatchStatus(id: string, dto: UpdateQualityStatusDto, user: AuthenticatedClientUser): Promise<{
        certificates: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        tenantId: string;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
        notes: string | null;
    }>;
    updateBatch(id: string, dto: UpdatePeptraceBatchDto, user: AuthenticatedClientUser): Promise<{
        certificates: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        tenantId: string;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
        notes: string | null;
    }>;
    archiveBatch(id: string, user: AuthenticatedClientUser): Promise<{
        certificates: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            batchId: string;
            labTestId: string | null;
            certificateNumber: string;
            issuedAt: Date | null;
            expiresAt: Date | null;
            documentUrl: string | null;
            summary: Prisma.JsonValue;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        vialSizeMg: number;
        vendorId: string;
        peptideId: string;
        tenantId: string;
        batchCode: string;
        productId: string | null;
        manufacturedAt: Date | null;
        receivedAt: Date | null;
        quantityVials: number;
        storageCondition: string | null;
        notes: string | null;
    }>;
    listCertificates(query: ListQualityQueryDto, user: AuthenticatedClientUser): Promise<({
        batch: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            tenantId: string;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
            notes: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            tenantId: string;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
            notes: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            tenantId: string;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
            notes: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            tenantId: string;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
            notes: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            tenantId: string;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
            notes: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            tenantId: string;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
            notes: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
            slug: string;
            createdAt: Date;
            updatedAt: Date;
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
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        overallRating: number;
    })[]>;
    publicGetVendor(idOrSlug: string): Promise<{
        products: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
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
                slug: string;
                createdAt: Date;
                updatedAt: Date;
                label: string;
            };
            lab: {
                id: string;
                slug: string;
                createdAt: Date;
                updatedAt: Date;
                displayName: string;
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
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        overallRating: number;
    }>;
    publicListPeptides(): Promise<({
        products: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
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
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        label: string;
    })[]>;
    publicGetPeptide(idOrSlug: string): Promise<{
        products: ({
            vendor: {
                id: string;
                slug: string;
                createdAt: Date;
                updatedAt: Date;
                displayName: string;
                overallRating: number;
            };
        } & {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
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
                slug: string;
                createdAt: Date;
                updatedAt: Date;
                displayName: string;
                overallRating: number;
            };
            lab: {
                id: string;
                slug: string;
                createdAt: Date;
                updatedAt: Date;
                displayName: string;
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
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        label: string;
    }>;
    publicListTests(query: ListQualityQueryDto): Promise<({
        vendor: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            displayName: string;
            overallRating: number;
        };
        peptide: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            label: string;
        };
        lab: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            displayName: string;
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
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            vialSizeMg: number;
            vendorId: string;
            peptideId: string;
            tenantId: string;
            batchCode: string;
            productId: string | null;
            manufacturedAt: Date | null;
            receivedAt: Date | null;
            quantityVials: number;
            storageCondition: string | null;
            notes: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
