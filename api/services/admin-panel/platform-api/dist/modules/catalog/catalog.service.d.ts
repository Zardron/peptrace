import { PrismaService } from "../prisma/prisma.service";
import { CreateLabDto, CreatePeptideDto, CreateVendorDto } from "./catalog.dto";
export declare class CatalogService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listVendors(): import(".prisma/client").Prisma.PrismaPromise<({
        products: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            label: string;
            peptideId: string;
            vendorId: string;
            priceMg: number;
            rating: number;
            doseMg: number;
            purityPercent: number;
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
            peptideId: string;
            vendorId: string;
            priceMg: number;
            rating: number;
            doseMg: number;
            purityPercent: number;
            labelAccuracyDelta: number;
            testsCount: number;
        }[];
        tests: {
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
        }[];
    } & {
        id: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        overallRating: number;
    }>;
    createVendor(dto: CreateVendorDto): import(".prisma/client").Prisma.Prisma__VendorClient<{
        id: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        overallRating: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    listPeptides(): import(".prisma/client").Prisma.PrismaPromise<({
        tests: {
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
        }[];
    } & {
        id: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        label: string;
    })[]>;
    getPeptide(idOrSlug: string): Promise<{
        products: {
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            label: string;
            peptideId: string;
            vendorId: string;
            priceMg: number;
            rating: number;
            doseMg: number;
            purityPercent: number;
            labelAccuracyDelta: number;
            testsCount: number;
        }[];
        tests: {
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
        }[];
    } & {
        id: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        label: string;
    }>;
    createPeptide(dto: CreatePeptideDto): import(".prisma/client").Prisma.Prisma__PeptideClient<{
        id: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        label: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    listLabs(): import(".prisma/client").Prisma.PrismaPromise<({
        tests: {
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
        }[];
    } & {
        id: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        partnerSince: Date;
    })[]>;
    createLab(dto: CreateLabDto): import(".prisma/client").Prisma.Prisma__LabClient<{
        id: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        displayName: string;
        partnerSince: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
