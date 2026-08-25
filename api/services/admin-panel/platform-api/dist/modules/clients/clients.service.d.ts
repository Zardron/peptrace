import { Prisma } from "@prisma/client";
import { AdminPanelService } from "../admin-panel/admin-panel.service";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClientDto } from "./clients.dto";
declare const clientMembershipSelect: {
    role: true;
    createdAt: true;
    user: {
        select: {
            id: true;
            displayName: true;
            email: true;
            lastLoginAt: true;
            createdAt: true;
        };
    };
};
type ClientTenantWithMemberships = Prisma.ClientTenantGetPayload<{
    include: {
        memberships: {
            select: typeof clientMembershipSelect;
        };
    };
}>;
export declare class ClientsService {
    private readonly prisma;
    private readonly adminPanelService;
    constructor(prisma: PrismaService, adminPanelService: AdminPanelService);
    listClients(user: AuthenticatedAdminUser): Promise<(Omit<{
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
        memberships?: ClientTenantWithMemberships["memberships"];
    }, "memberships" | "plan" | "seats" | "monthlySpend"> & {
        adminUsers: {
            id: string;
            displayName: string;
            email: string;
            role: string;
            lastLoginAt: Date | null;
            createdAt: Date;
        }[] | undefined;
        accessStatus: string;
        enabledAccounts: number;
        operationalValue: number;
    })[]>;
    getClient(idOrSlug: string, user: AuthenticatedAdminUser): Promise<Omit<{
        memberships: {
            role: string;
            createdAt: Date;
            user: {
                email: string;
                id: string;
                displayName: string;
                lastLoginAt: Date | null;
                createdAt: Date;
            };
        }[];
    } & {
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
        memberships?: ClientTenantWithMemberships["memberships"];
    }, "memberships" | "plan" | "seats" | "monthlySpend"> & {
        adminUsers: {
            id: string;
            displayName: string;
            email: string;
            role: string;
            lastLoginAt: Date | null;
            createdAt: Date;
        }[] | undefined;
        accessStatus: string;
        enabledAccounts: number;
        operationalValue: number;
    }>;
    createClient(dto: CreateClientDto, user: AuthenticatedAdminUser): Promise<Omit<{
        memberships: {
            role: string;
            createdAt: Date;
            user: {
                email: string;
                id: string;
                displayName: string;
                lastLoginAt: Date | null;
                createdAt: Date;
            };
        }[];
    } & {
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
        memberships?: ClientTenantWithMemberships["memberships"];
    }, "memberships" | "plan" | "seats" | "monthlySpend"> & {
        adminUsers: {
            id: string;
            displayName: string;
            email: string;
            role: string;
            lastLoginAt: Date | null;
            createdAt: Date;
        }[] | undefined;
        accessStatus: string;
        enabledAccounts: number;
        operationalValue: number;
    }>;
    private buildTenantSettings;
    private buildWhiteLabelPanel;
    private ensureOwnerMembership;
    private assertOwnerUserCanBeInvited;
    private writeAudit;
    private assertValidSlug;
    private jsonObject;
    private assertSuperadmin;
    private isSuperAdmin;
    private toClientPayload;
}
export {};
