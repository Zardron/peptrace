export declare class CreateClientOwnerDto {
    email: string;
    displayName: string;
    password?: string;
}
export declare class CreateClientSettingsDto {
    branding?: Record<string, unknown>;
    enabledModules?: string[];
    integrations?: Record<string, unknown>;
    limits?: Record<string, unknown>;
    labels?: Record<string, unknown>;
    businessSettings?: Record<string, unknown>;
}
export declare class CreateClientDto {
    name: string;
    slug: string;
    accessStatus: string;
    status: string;
    owner: string;
    enabledAccounts: number;
    operationalValue: number;
    openItems: number;
    dataRegion: string;
    industry?: string;
    accentColor?: string;
    ownerUser?: CreateClientOwnerDto;
    settings?: CreateClientSettingsDto;
}
