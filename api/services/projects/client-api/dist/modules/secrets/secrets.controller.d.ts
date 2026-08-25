import { AuthenticatedClientUser } from "../auth/auth.types";
import { AddSecretVersionDto, CreateSecretDto, ListSecretAuditQueryDto, ListSecretsQueryDto, SetSecretGrantDto, UpdateSecretDto, UpdateSecretVersionDto } from "./secrets.dto";
import { SecretsService } from "./secrets.service";
export declare class SecretsController {
    private readonly secretsService;
    constructor(secretsService: SecretsService);
    listSecrets(query: ListSecretsQueryDto, user: AuthenticatedClientUser): Promise<{
        items: {
            createdAt: Date;
            createdById: string;
            description: string | null;
            id: string;
            labels: import("@prisma/client/runtime/client").JsonValue;
            latestVersion: {
                createdAt: Date;
                createdById: string;
                destroyedAt: Date | null;
                encryptionKeyId: string;
                id: string;
                resourceName: string;
                state: string;
                version: number;
            } | null;
            name: string;
            resourceName: string;
            updatedAt: Date;
            versionCount: number;
        }[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    }>;
    createSecret(dto: CreateSecretDto, user: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        description: string | null;
        id: string;
        labels: import("@prisma/client/runtime/client").JsonValue;
        latestVersion: {
            createdAt: Date;
            createdById: string;
            destroyedAt: Date | null;
            encryptionKeyId: string;
            id: string;
            resourceName: string;
            state: string;
            version: number;
        } | null;
        name: string;
        resourceName: string;
        updatedAt: Date;
        versionCount: number;
    }>;
    listAuditEvents(query: ListSecretAuditQueryDto, user: AuthenticatedClientUser): Promise<{
        items: {
            action: string;
            actor: {
                id: string;
                displayName: string;
                email: string;
            } | {
                id: string;
            };
            createdAt: Date;
            id: string;
            metadata: import("@prisma/client/runtime/client").JsonValue;
            secret: {
                id: string | null;
                name: string;
            } | null;
            secretVersionId: string | null;
        }[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    }>;
    getSecret(secret: string, user: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        description: string | null;
        id: string;
        labels: import("@prisma/client/runtime/client").JsonValue;
        latestVersion: {
            createdAt: Date;
            createdById: string;
            destroyedAt: Date | null;
            encryptionKeyId: string;
            id: string;
            resourceName: string;
            state: string;
            version: number;
        } | null;
        name: string;
        resourceName: string;
        updatedAt: Date;
        versionCount: number;
    }>;
    updateSecret(secret: string, dto: UpdateSecretDto, user: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        description: string | null;
        id: string;
        labels: import("@prisma/client/runtime/client").JsonValue;
        latestVersion: {
            createdAt: Date;
            createdById: string;
            destroyedAt: Date | null;
            encryptionKeyId: string;
            id: string;
            resourceName: string;
            state: string;
            version: number;
        } | null;
        name: string;
        resourceName: string;
        updatedAt: Date;
        versionCount: number;
    }>;
    listVersions(secret: string, user: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        destroyedAt: Date | null;
        encryptionKeyId: string;
        id: string;
        resourceName: string;
        state: string;
        version: number;
    }[]>;
    addVersion(secret: string, dto: AddSecretVersionDto, user: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        destroyedAt: Date | null;
        encryptionKeyId: string;
        id: string;
        resourceName: string;
        state: string;
        version: number;
    }>;
    accessVersion(secret: string, version: string, user: AuthenticatedClientUser): Promise<{
        checksum: string;
        name: string;
        resourceName: string;
        value: string;
        version: number;
    }>;
    updateVersionState(secret: string, version: string, dto: UpdateSecretVersionDto, user: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        destroyedAt: Date | null;
        encryptionKeyId: string;
        id: string;
        resourceName: string;
        state: string;
        version: number;
    }>;
    destroyVersion(secret: string, version: string, user: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        destroyedAt: Date | null;
        encryptionKeyId: string;
        id: string;
        resourceName: string;
        state: string;
        version: number;
    }>;
    listGrants(secret: string, user: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        role: string;
        updatedAt: Date;
        user: {
            displayName: string;
            email: string;
            id: string;
            isActive: boolean;
            role: string;
        };
    }[]>;
    setGrant(secret: string, userId: string, dto: SetSecretGrantDto, user: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        role: string;
        updatedAt: Date;
        user: {
            role: string;
            id: string;
            displayName: string;
            isActive: boolean;
            email: string;
        };
    }>;
    removeGrant(secret: string, userId: string, user: AuthenticatedClientUser): Promise<{
        removed: boolean;
        userId: string;
    }>;
}
