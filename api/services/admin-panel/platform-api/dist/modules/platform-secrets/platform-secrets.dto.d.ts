export declare class CreatePlatformSecretDto {
    tenantId: string;
    name: string;
    description?: string;
    labels?: Record<string, string>;
    value: string;
}
