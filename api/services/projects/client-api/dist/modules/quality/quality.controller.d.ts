import { AuthenticatedClientUser } from "../auth/auth.types";
import { CreatePeptraceBatchDto, CreatePeptraceCertificateDto, ListQualityQueryDto, UpdatePeptraceBatchDto, UpdatePeptraceCertificateDto, UpdateQualityStatusDto } from "./quality.dto";
import { QualityService } from "./quality.service";
export declare class QualityController {
    private readonly qualityService;
    constructor(qualityService: QualityService);
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
    listTests(status: string | undefined, vendorId: string | undefined, peptideId: string | undefined, user: AuthenticatedClientUser): Promise<({
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
            summary: import("@prisma/client/runtime/client").JsonValue;
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
            summary: import("@prisma/client/runtime/client").JsonValue;
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
            summary: import("@prisma/client/runtime/client").JsonValue;
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
            summary: import("@prisma/client/runtime/client").JsonValue;
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
            summary: import("@prisma/client/runtime/client").JsonValue;
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
            summary: import("@prisma/client/runtime/client").JsonValue;
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
        summary: import("@prisma/client/runtime/client").JsonValue;
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
        summary: import("@prisma/client/runtime/client").JsonValue;
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
        summary: import("@prisma/client/runtime/client").JsonValue;
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
        summary: import("@prisma/client/runtime/client").JsonValue;
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
        summary: import("@prisma/client/runtime/client").JsonValue;
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
        summary: import("@prisma/client/runtime/client").JsonValue;
    }>;
}
export declare class QualityPublicController {
    private readonly qualityService;
    constructor(qualityService: QualityService);
    listVendors(): Promise<({
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
    getVendor(idOrSlug: string): Promise<{
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
    listPeptides(): Promise<({
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
    getPeptide(idOrSlug: string): Promise<{
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
    listTests(query: ListQualityQueryDto): Promise<({
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
    verifyCertificate(idOrNumber: string): Promise<{
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
        summary: import("@prisma/client/runtime/client").JsonValue;
    }>;
}
