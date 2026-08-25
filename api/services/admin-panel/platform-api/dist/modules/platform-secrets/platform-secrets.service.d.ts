import { Prisma } from "@prisma/client";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { AdminPanelService } from "../admin-panel/admin-panel.service";
import { PrismaService } from "../prisma/prisma.service";
import { PlatformSecretEncryptionService } from "./platform-secret-encryption.service";
import { CreatePlatformSecretDto } from "./platform-secrets.dto";
export declare class PlatformSecretsService {
    private readonly prisma;
    private readonly encryption;
    private readonly adminPanelService;
    constructor(prisma: PrismaService, encryption: PlatformSecretEncryptionService, adminPanelService: AdminPanelService);
    createSecret(dto: CreatePlatformSecretDto, actor: AuthenticatedAdminUser): Promise<{
        tenantId: string;
        tenantName: string;
        tenantSlug: string;
        secret: {
            createdAt: string;
            description: string | null;
            id: string;
            labels: Prisma.JsonValue;
            latestState: string;
            latestVersion: number;
            name: string;
            resourceName: string;
            updatedAt: string;
            versionCount: number;
        };
    }>;
    private validateLabels;
    private getAdditionalAuthenticatedData;
    private assertSuperadmin;
}
