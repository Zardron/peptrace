export declare const SECRET_GRANT_ROLES: readonly ["viewer", "accessor", "manager"];
export declare const SECRET_VERSION_STATES: readonly ["ENABLED", "DISABLED"];
export type SecretGrantRole = (typeof SECRET_GRANT_ROLES)[number];
export type MutableSecretVersionState = (typeof SECRET_VERSION_STATES)[number];
export declare class ListSecretsQueryDto {
    search?: string;
    page: number;
    pageSize: number;
}
export declare class CreateSecretDto {
    name: string;
    description?: string;
    labels?: Record<string, string>;
}
export declare class UpdateSecretDto {
    description?: string;
    labels?: Record<string, string>;
}
export declare class AddSecretVersionDto {
    value: string;
}
export declare class UpdateSecretVersionDto {
    state: MutableSecretVersionState;
}
export declare class SetSecretGrantDto {
    role: SecretGrantRole;
}
export declare class ListSecretAuditQueryDto {
    secret?: string;
    page: number;
    pageSize: number;
}
