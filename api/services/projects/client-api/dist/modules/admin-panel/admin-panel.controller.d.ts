import { AuthenticatedClientUser } from "../auth/auth.types";
import { AdminPanelService } from "./admin-panel.service";
export declare class AdminPanelController {
    private readonly adminPanelService;
    constructor(adminPanelService: AdminPanelService);
    getContext(user: AuthenticatedClientUser): Promise<{
        mode: "client";
        viewer: {
            id: string;
            displayName: string;
            email: string;
            role: string;
            tenant: import("../auth/auth.types").AuthTenant;
        };
        company: Omit<{
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
            adminUsers: {
                id: string;
                displayName: string;
                email: string;
                role: string;
                lastLoginAt: Date | null;
                createdAt: Date;
            }[];
            settings: {
                enabledModules: string[];
            } | null;
            whiteLabelPanel: {
                brandName: string;
                productName: string;
                industry: string;
                accentColor: string;
                overviewTitle: string;
                overviewDescription: string;
                operationsTitle: string;
                operationsDescription: string;
                primaryRecords: import("@prisma/client/runtime/client").JsonValue;
                workItems: import("@prisma/client/runtime/client").JsonValue;
            } | null;
        } & {
            settings?: {
                enabledModules: string[];
            } | null;
        }, "plan" | "seats" | "monthlySpend" | "settings"> & {
            accessStatus: string;
            enabledAccounts: number;
            operationalValue: number;
        };
        panel: {
            enabledModules: string[];
            primaryRecords: {
                label: string;
                detail: string;
                status: string;
                value: string;
            }[];
            workItems: {
                label: string;
                detail: string;
                priority: "High" | "Medium" | "Low";
            }[];
            metrics: {
                label: string;
                value: string;
                change: string;
                tone: "info" | "neutral" | "success" | "warning";
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
            settings?: {
                enabledModules: string[];
            } | null;
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
        vendors: never[] | ({
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
        })[];
    }>;
}
