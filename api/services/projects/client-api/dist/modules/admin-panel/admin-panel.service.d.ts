import { Prisma } from "@prisma/client";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
type AdminPanelTone = "info" | "neutral" | "success" | "warning";
type AdminPanelRecord = {
    label: string;
    detail: string;
    status: string;
    value: string;
};
type CompanyAccount = {
    id: string;
    displayName: string;
    email: string;
    role: string;
    lastLoginAt: Date | null;
    createdAt: Date;
};
type ClientCompany = {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    owner: string;
    seats: number;
    monthlySpend: number;
    openItems: number;
    dataRegion: string;
    lastActivityAt: Date;
    adminUsers: CompanyAccount[];
    settings: {
        enabledModules: string[];
    } | null;
    whiteLabelPanel: PersistedWhiteLabelPanel | null;
};
type PersistedWhiteLabelPanel = {
    brandName: string;
    productName: string;
    industry: string;
    accentColor: string;
    overviewTitle: string;
    overviewDescription: string;
    operationsTitle: string;
    operationsDescription: string;
    primaryRecords: Prisma.JsonValue;
    workItems: Prisma.JsonValue;
};
export declare class AdminPanelService {
    private readonly prisma;
    private readonly logger;
    private readonly companyCache;
    private readonly dataCache;
    private readonly statsCache;
    constructor(prisma: PrismaService);
    getContext(user: AuthenticatedClientUser): Promise<{
        mode: "client";
        viewer: {
            id: string;
            displayName: string;
            email: string;
            role: string;
            tenant: import("../auth/auth.types").AuthTenant;
        };
        company: Omit<ClientCompany & {
            settings?: ClientCompany["settings"];
        }, "monthlySpend" | "plan" | "seats" | "settings"> & {
            accessStatus: string;
            enabledAccounts: number;
            operationalValue: number;
        };
        panel: {
            enabledModules: string[];
            primaryRecords: AdminPanelRecord[];
            workItems: {
                label: string;
                detail: string;
                priority: "High" | "Medium" | "Low";
            }[];
            metrics: {
                label: string;
                value: string;
                change: string;
                tone: AdminPanelTone;
            }[];
            brandName: string;
            productName: string;
            industry: string;
            accentColor: string;
            overviewTitle: string;
            overviewDescription: string;
            operationsTitle: string;
            operationsDescription: string;
        };
    }>;
    getData(user: AuthenticatedClientUser): Promise<{
        accountWorkItems: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            account: string;
            kind: string;
            priority: string;
            dueAt: Date;
        }[];
        apiSurfaces: never[] | {
            id: string;
            owner: string;
            createdAt: Date;
            updatedAt: Date;
            group: string;
            routes: string[];
            readiness: string;
        }[];
        clients: (Omit<{
            monthlySpend: number;
            plan: string;
            seats: number;
            id: string;
            name: string;
            slug: string;
            status: string;
            owner: string;
            openItems: number;
            dataRegion: string;
            lastActivityAt: Date;
            createdAt: Date;
            updatedAt: Date;
        } & {
            settings?: ClientCompany["settings"];
        }, "monthlySpend" | "plan" | "seats" | "settings"> & {
            accessStatus: string;
            enabledAccounts: number;
            operationalValue: number;
        })[];
        labs: never[] | ({
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
        })[];
        peptides: never[] | ({
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
        })[];
        tests: never[] | ({
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
        })[];
        vendors: never[] | ({
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
        })[];
    }>;
    private queryData;
    private refreshData;
    private getPeptraceStats;
    private queryPeptraceStats;
    private refreshPeptraceStats;
    private getCompany;
    private queryCompany;
    private refreshCompany;
    private getAccountWorkItems;
    private buildClientPanel;
    private formatCurrency;
    private formatClientCurrency;
    private toCompanyPayload;
    private withMembershipAccounts;
    private toPanelDefinition;
    private toPanelRecords;
    private toPanelWorkItems;
    private isJsonObject;
    private jsonString;
    private formatDate;
    private toPriority;
}
export {};
