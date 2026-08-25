import { Prisma } from "@prisma/client";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { SecretEncryptionService } from "./secret-encryption.service";
import { AddSecretVersionDto, CreateSecretDto, ListSecretAuditQueryDto, ListSecretsQueryDto, SetSecretGrantDto, UpdateSecretDto, UpdateSecretVersionDto } from "./secrets.dto";
export declare class SecretsService {
    private readonly encryption;
    private readonly prisma;
    constructor(encryption: SecretEncryptionService, prisma: PrismaService);
    listSecrets(query: ListSecretsQueryDto, actor: AuthenticatedClientUser): Promise<{
        items: {
            createdAt: Date;
            createdById: string;
            description: string | null;
            id: string;
            labels: Prisma.JsonValue;
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
    getSecret(identifier: string, actor: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        description: string | null;
        id: string;
        labels: Prisma.JsonValue;
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
    createSecret(dto: CreateSecretDto, actor: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        description: string | null;
        id: string;
        labels: Prisma.JsonValue;
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
    updateSecret(identifier: string, dto: UpdateSecretDto, actor: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        description: string | null;
        id: string;
        labels: Prisma.JsonValue;
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
    listVersions(identifier: string, actor: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        destroyedAt: Date | null;
        encryptionKeyId: string;
        id: string;
        resourceName: string;
        state: string;
        version: number;
    }[]>;
    addVersion(identifier: string, dto: AddSecretVersionDto, actor: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        destroyedAt: Date | null;
        encryptionKeyId: string;
        id: string;
        resourceName: string;
        state: string;
        version: number;
    }>;
    accessVersion(identifier: string, requestedVersion: string, actor: AuthenticatedClientUser): Promise<{
        checksum: string;
        name: string;
        resourceName: string;
        value: string;
        version: number;
    }>;
    updateVersionState(identifier: string, requestedVersion: string, dto: UpdateSecretVersionDto, actor: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        destroyedAt: Date | null;
        encryptionKeyId: string;
        id: string;
        resourceName: string;
        state: string;
        version: number;
    }>;
    destroyVersion(identifier: string, requestedVersion: string, actor: AuthenticatedClientUser): Promise<{
        createdAt: Date;
        createdById: string;
        destroyedAt: Date | null;
        encryptionKeyId: string;
        id: string;
        resourceName: string;
        state: string;
        version: number;
    }>;
    listGrants(identifier: string, actor: AuthenticatedClientUser): Promise<{
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
    setGrant(identifier: string, userId: string, dto: SetSecretGrantDto, actor: AuthenticatedClientUser): Promise<{
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
    removeGrant(identifier: string, userId: string, actor: AuthenticatedClientUser): Promise<{
        removed: boolean;
        userId: string;
    }>;
    listAuditEvents(query: ListSecretAuditQueryDto, actor: AuthenticatedClientUser): Promise<{
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
            metadata: Prisma.JsonValue;
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
    private getSecretWithPermission;
    private getTenantSecret;
    private getSecretMetadata;
    private getVersion;
    private parseVersion;
    private validateLabels;
    private assertLockerAdmin;
    private isLockerAdmin;
    private writeAudit;
    private getAuditData;
    private getAdditionalAuthenticatedData;
    private toSecretMetadata;
    private toVersionMetadata;
    private getVersionResourceName;
    private rethrowUniqueSecret;
}
