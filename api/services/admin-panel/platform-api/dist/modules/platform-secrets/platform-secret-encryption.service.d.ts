import { ConfigService } from "@nestjs/config";
type EncryptedSecretPayload = {
    authenticationTag: Uint8Array<ArrayBuffer>;
    checksum: string;
    encryptedValue: Uint8Array<ArrayBuffer>;
    encryptionIv: Uint8Array<ArrayBuffer>;
    encryptionKeyId: string;
};
export declare class PlatformSecretEncryptionService {
    private readonly logger;
    private readonly encryptionKeys;
    private readonly encryptionKeyId;
    constructor(configService: ConfigService);
    encrypt(value: string, additionalAuthenticatedData: string): EncryptedSecretPayload;
    private loadPreviousKeys;
    private decodeKey;
    private getEncryptionKey;
}
export {};
