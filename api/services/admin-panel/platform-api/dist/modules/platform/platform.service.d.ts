import { AuthenticatedAdminUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateApiKeyDto } from "./platform.dto";
export declare class PlatformService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAccountProfile(user: AuthenticatedAdminUser): {
        id: string;
        displayName: string;
        email: string;
        role: string;
        tenant: import("../auth/auth.types").AuthTenant | null;
    };
    listApiSurfaces(user: AuthenticatedAdminUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        owner: string;
        group: string;
        routes: string[];
        readiness: string;
    }[]>;
    createApiKey(dto: CreateApiKeyDto, user: AuthenticatedAdminUser): {
        id: `${string}-${string}-${string}-${string}-${string}`;
        label: string;
        scopes: string[];
        createdBy: string;
        tenantId: string | null;
        keyPreview: string;
        createdAt: string;
    };
    private assertPlatformAdmin;
}
