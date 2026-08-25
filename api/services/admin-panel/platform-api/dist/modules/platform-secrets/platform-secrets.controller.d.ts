import { AuthenticatedAdminUser } from "../auth/auth.types";
import { CreatePlatformSecretDto } from "./platform-secrets.dto";
import { PlatformSecretsService } from "./platform-secrets.service";
export declare class PlatformSecretsController {
    private readonly platformSecretsService;
    constructor(platformSecretsService: PlatformSecretsService);
    createSecret(dto: CreatePlatformSecretDto, user: AuthenticatedAdminUser): Promise<{
        tenantId: string;
        tenantName: string;
        tenantSlug: string;
        secret: {
            createdAt: string;
            description: string | null;
            id: string;
            labels: import("@prisma/client/runtime/client").JsonValue;
            latestState: string;
            latestVersion: number;
            name: string;
            resourceName: string;
            updatedAt: string;
            versionCount: number;
        };
    }>;
}
