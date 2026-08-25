import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

export type EncryptedDatabaseCredential = {
  authenticationTag: Uint8Array<ArrayBuffer>;
  ciphertext: Uint8Array<ArrayBuffer>;
  encryptionIv: Uint8Array<ArrayBuffer>;
  encryptionKeyId: string;
};

@Injectable()
export class DatabaseCredentialEncryptionService {
  private readonly logger = new Logger(DatabaseCredentialEncryptionService.name);
  private readonly encryptionKeys = new Map<string, Buffer>();
  private readonly encryptionKeyId: string;

  constructor(configService: ConfigService) {
    const configuredKey = configService.get<string>("DATABASE_CONNECTION_ENCRYPTION_KEY");
    const nodeEnvironment = configService.get<string>("NODE_ENV", "development");
    this.encryptionKeyId = configService.get<string>("DATABASE_CONNECTION_ENCRYPTION_KEY_ID", "local-v1");
    this.loadPreviousKeys(configService.get<string>("DATABASE_CONNECTION_ENCRYPTION_PREVIOUS_KEYS", "{}"));

    if (configuredKey) {
      this.encryptionKeys.set(
        this.encryptionKeyId,
        this.decodeKey(configuredKey, "DATABASE_CONNECTION_ENCRYPTION_KEY")
      );
      return;
    }

    if (nodeEnvironment === "production") {
      throw new Error("DATABASE_CONNECTION_ENCRYPTION_KEY is required in production");
    }

    const developmentSecret = configService.getOrThrow<string>("JWT_SECRET");
    const developmentKey = Buffer.from(
      hkdfSync(
        "sha256",
        Buffer.from(developmentSecret, "utf8"),
        Buffer.from("peptrace-client-database-connections", "utf8"),
        Buffer.from("aes-256-gcm", "utf8"),
        32
      )
    );
    this.encryptionKeys.set(this.encryptionKeyId, developmentKey);
    this.logger.warn(
      "Using a development-derived database credential key; configure DATABASE_CONNECTION_ENCRYPTION_KEY before deployment"
    );
  }

  encrypt(value: string, additionalAuthenticatedData: string): EncryptedDatabaseCredential {
    const encryptionIv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.getEncryptionKey(this.encryptionKeyId), encryptionIv);
    cipher.setAAD(Buffer.from(additionalAuthenticatedData, "utf8"));
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);

    return {
      authenticationTag: Uint8Array.from(cipher.getAuthTag()),
      ciphertext: Uint8Array.from(ciphertext),
      encryptionIv: Uint8Array.from(encryptionIv),
      encryptionKeyId: this.encryptionKeyId
    };
  }

  decrypt(
    ciphertext: Uint8Array,
    encryptionIv: Uint8Array,
    authenticationTag: Uint8Array,
    additionalAuthenticatedData: string,
    encryptionKeyId: string
  ): string {
    const decipher = createDecipheriv("aes-256-gcm", this.getEncryptionKey(encryptionKeyId), encryptionIv);
    decipher.setAAD(Buffer.from(additionalAuthenticatedData, "utf8"));
    decipher.setAuthTag(Buffer.from(authenticationTag));
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  }

  private loadPreviousKeys(value: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error("DATABASE_CONNECTION_ENCRYPTION_PREVIOUS_KEYS must be a JSON object");
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("DATABASE_CONNECTION_ENCRYPTION_PREVIOUS_KEYS must be a JSON object");
    }

    Object.entries(parsed).forEach(([keyId, encodedKey]) => {
      if (!keyId || keyId.length > 64 || typeof encodedKey !== "string") {
        throw new Error("DATABASE_CONNECTION_ENCRYPTION_PREVIOUS_KEYS contains an invalid key entry");
      }
      this.encryptionKeys.set(keyId, this.decodeKey(encodedKey, `previous key ${keyId}`));
    });
  }

  private decodeKey(encodedKey: string, label: string): Buffer {
    const decodedKey = Buffer.from(encodedKey, "base64");
    if (decodedKey.length !== 32) {
      throw new Error(`${label} must decode to exactly 32 bytes`);
    }
    return decodedKey;
  }

  private getEncryptionKey(keyId: string): Buffer {
    const key = this.encryptionKeys.get(keyId);
    if (!key) {
      throw new Error(`Database credential encryption key ${keyId} is not configured`);
    }
    return key;
  }
}
