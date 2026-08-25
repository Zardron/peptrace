import { ConfigService } from "@nestjs/config";
type EncryptedPayload = {
    authenticationTag: Uint8Array<ArrayBuffer>;
    checksum: string;
    encryptedValue: Uint8Array<ArrayBuffer>;
    encryptionIv: Uint8Array<ArrayBuffer>;
    encryptionKeyId: string;
};
export declare class SecretEncryptionService {
    private readonly logger;
    private readonly encryptionKeys;
    private readonly encryptionKeyId;
    constructor(configService: ConfigService);
    encrypt(value: string, additionalAuthenticatedData: string): EncryptedPayload;
    decrypt(encryptedValue: Uint8Array, encryptionIv: Uint8Array, authenticationTag: Uint8Array, additionalAuthenticatedData: string, encryptionKeyId: string): string;
    private loadPreviousKeys;
    private decodeKey;
    private getEncryptionKey;
}
export {};
