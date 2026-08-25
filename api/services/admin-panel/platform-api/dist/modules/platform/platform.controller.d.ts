import { AuthenticatedAdminUser } from "../auth/auth.types";
import { CreateApiKeyDto } from "./platform.dto";
import { PlatformService } from "./platform.service";
export declare class PlatformController {
    private readonly platformService;
    constructor(platformService: PlatformService);
    getAccountProfile(user: AuthenticatedAdminUser): {
        id: string;
        displayName: string;
        email: string;
        role: string;
        tenant: import("../auth/auth.types").AuthTenant | null;
    };
    listApiSurfaces(user: AuthenticatedAdminUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        owner: string;
        createdAt: Date;
        updatedAt: Date;
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
}
