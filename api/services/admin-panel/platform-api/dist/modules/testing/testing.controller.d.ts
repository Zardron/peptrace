import { CreateLabTestDto } from "./testing.dto";
import { TestingService } from "./testing.service";
export declare class TestingController {
    private readonly testingService;
    constructor(testingService: TestingService);
    listTests(status?: string, vendorId?: string, peptideId?: string): import(".prisma/client").Prisma.PrismaPromise<({
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
        peptideId: string;
        vendorId: string;
        purityPercent: number | null;
        labId: string;
        vialSizeMg: number;
        resultsReleasedAt: Date | null;
        testingStatus: string;
        assay: string;
        labelClaimPercent: number | null;
    })[]>;
    getTest(id: string): Promise<{
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
        peptideId: string;
        vendorId: string;
        purityPercent: number | null;
        labId: string;
        vialSizeMg: number;
        resultsReleasedAt: Date | null;
        testingStatus: string;
        assay: string;
        labelClaimPercent: number | null;
    }>;
    createTest(dto: CreateLabTestDto): import(".prisma/client").Prisma.Prisma__LabTestClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        peptideId: string;
        vendorId: string;
        purityPercent: number | null;
        labId: string;
        vialSizeMg: number;
        resultsReleasedAt: Date | null;
        testingStatus: string;
        assay: string;
        labelClaimPercent: number | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
