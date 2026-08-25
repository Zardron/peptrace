import { ConfigService } from "@nestjs/config";
export type EncryptedDatabaseCredential = {
    authenticationTag: Uint8Array<ArrayBuffer>;
    ciphertext: Uint8Array<ArrayBuffer>;
    encryptionIv: Uint8Array<ArrayBuffer>;
    encryptionKeyId: string;
};
export declare class DatabaseCredentialEncryptionService {
    private readonly logger;
    private readonly encryptionKeys;
    private readonly encryptionKeyId;
    constructor(configService: ConfigService);
    encrypt(value: string, additionalAuthenticatedData: string): EncryptedDatabaseCredential;
    decrypt(ciphertext: Uint8Array, encryptionIv: Uint8Array, authenticationTag: Uint8Array, additionalAuthenticatedData: string, encryptionKeyId: string): string;
    private loadPreviousKeys;
    private decodeKey;
    private getEncryptionKey;
}
