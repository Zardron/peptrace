import { AuthenticatedAdminUser } from "../auth/auth.types";
import { CreateClientDto } from "./clients.dto";
import { ClientsService } from "./clients.service";
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
    listClients(user: AuthenticatedAdminUser): Promise<(Omit<{
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
        memberships?: {
            createdAt: Date;
            user: {
                id: string;
                createdAt: Date;
                displayName: string;
                email: string;
                lastLoginAt: Date | null;
            };
            role: string;
        }[];
    }, "monthlySpend" | "plan" | "seats" | "memberships"> & {
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
            createdAt: Date;
            user: {
                id: string;
                createdAt: Date;
                displayName: string;
                email: string;
                lastLoginAt: Date | null;
            };
            role: string;
        }[];
    } & {
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
        memberships?: {
            createdAt: Date;
            user: {
                id: string;
                createdAt: Date;
                displayName: string;
                email: string;
                lastLoginAt: Date | null;
            };
            role: string;
        }[];
    }, "monthlySpend" | "plan" | "seats" | "memberships"> & {
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
            createdAt: Date;
            user: {
                id: string;
                createdAt: Date;
                displayName: string;
                email: string;
                lastLoginAt: Date | null;
            };
            role: string;
        }[];
    } & {
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
        memberships?: {
            createdAt: Date;
            user: {
                id: string;
                createdAt: Date;
                displayName: string;
                email: string;
                lastLoginAt: Date | null;
            };
            role: string;
        }[];
    }, "monthlySpend" | "plan" | "seats" | "memberships"> & {
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
