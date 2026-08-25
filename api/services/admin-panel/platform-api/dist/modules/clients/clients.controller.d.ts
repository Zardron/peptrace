import { AuthenticatedAdminUser } from "../auth/auth.types";
import { CreateClientDto } from "./clients.dto";
import { ClientsService } from "./clients.service";
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
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
        memberships?: {
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
        memberships?: {
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
        memberships?: {
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
}
