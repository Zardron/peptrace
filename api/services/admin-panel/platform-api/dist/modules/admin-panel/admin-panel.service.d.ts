import { AuthenticatedAdminUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
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
type ClientPanelDefinition = {
    brandName: string;
    productName: string;
    industry: string;
    accentColor: string;
    overviewTitle: string;
    overviewDescription: string;
    operationsTitle: string;
    operationsDescription: string;
    primaryRecords: AdminPanelRecord[];
    workItems: AdminPanelWorkItem[];
};
export declare class AdminPanelService {
    private readonly prisma;
    private readonly logger;
    private companiesCache;
    private internalAccountsCache;
    constructor(prisma: PrismaService);
    invalidateCompaniesCache(): void;
    getContext(user: AuthenticatedAdminUser): Promise<{
        mode: "superadmin";
        viewer: {
            id: string;
            displayName: string;
            email: string;
            role: string;
            tenant: import("../auth/auth.types").AuthTenant | null;
        };
        platform: {
            title: string;
            description: string;
            metrics: ({
                label: string;
                value: string;
                change: string;
                tone: "info";
            } | {
                label: string;
                value: string;
                change: string;
                tone: "success";
            } | {
                label: string;
                value: string;
                change: string;
                tone: "warning";
            } | {
                label: string;
                value: string;
                change: string;
                tone: "neutral";
            })[];
            internalAccounts: CompanyAccount[];
            secretLocker: {
                companies: {
                    enabledSecrets: number;
                    lastUpdatedAt: Date | null;
                    secretCount: number;
                    secrets: {
                        description: string | null;
                        id: string;
                        latestState: string | null;
                        latestVersion: number | null;
                        name: string;
                        resourceName: string;
                        updatedAt: Date;
                        versionCount: number;
                    }[];
                    tenantId: string;
                    tenantName: string;
                    tenantSlug: string;
                    versionCount: number;
                }[];
                enabledSecrets: number;
                totalSecrets: number;
                totalVersions: number;
            };
            clients: {
                panel: ClientPanelDefinition;
                accessStatus: string;
                enabledAccounts: number;
                operationalValue: number;
                id: string;
                name: string;
                slug: string;
                status: string;
                owner: string;
                openItems: number;
                dataRegion: string;
                lastActivityAt: Date;
                adminUsers: CompanyAccount[];
            }[];
        };
    }>;
    private listCompanies;
    private listInternalAccounts;
    private queryCompanies;
    private queryInternalAccounts;
    private refreshCompanies;
    private refreshInternalAccounts;
    private logCacheRefreshError;
    private toPanelDefinition;
    private toSecretLockerSummary;
    private toPanelRecords;
    private toPanelWorkItems;
    private isJsonObject;
    private jsonString;
    private toPriority;
    private isSuperAdmin;
    private toViewer;
    private withMembershipAccounts;
    private toCompanyPayload;
}
export {};
