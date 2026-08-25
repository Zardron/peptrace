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
type AdminPanelWorkItem = {
    label: string;
    detail: string;
    priority: "High" | "Medium" | "Low";
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
        }, "plan" | "seats" | "monthlySpend" | "settings"> & {
            accessStatus: string;
            enabledAccounts: number;
            operationalValue: number;
        };
        panel: {
            enabledModules: string[];
            primaryRecords: AdminPanelRecord[];
            workItems: AdminPanelWorkItem[];
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
            createdAt: Date;
            updatedAt: Date;
            owner: string;
            group: string;
            routes: string[];
            readiness: string;
        }[];
        clients: (Omit<{
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            plan: string;
            status: string;
            owner: string;
            seats: number;
            monthlySpend: number;
            openItems: number;
            dataRegion: string;
            lastActivityAt: Date;
        } & {
            settings?: ClientCompany["settings"];
        }, "plan" | "seats" | "monthlySpend" | "settings"> & {
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
            displayName: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
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
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            label: string;
        })[];
        tests: never[] | ({
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
        })[];
        vendors: ({
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
        })[] | never[];
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
