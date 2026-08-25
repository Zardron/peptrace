import { AuthenticatedAdminUser } from "../auth/auth.types";
import { AdminPanelService } from "./admin-panel.service";
export declare class AdminPanelController {
    private readonly adminPanelService;
    constructor(adminPanelService: AdminPanelService);
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
            internalAccounts: {
                id: string;
                displayName: string;
                email: string;
                role: string;
                lastLoginAt: Date | null;
                createdAt: Date;
            }[];
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
                panel: {
                    brandName: string;
                    productName: string;
                    industry: string;
                    accentColor: string;
                    overviewTitle: string;
                    overviewDescription: string;
                    operationsTitle: string;
                    operationsDescription: string;
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
                };
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
                adminUsers: {
                    id: string;
                    displayName: string;
                    email: string;
                    role: string;
                    lastLoginAt: Date | null;
                    createdAt: Date;
                }[];
            }[];
        };
    }>;
}
