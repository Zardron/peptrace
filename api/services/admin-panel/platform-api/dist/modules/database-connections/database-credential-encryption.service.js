"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseCredentialEncryptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseCredentialEncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
let DatabaseCredentialEncryptionService = DatabaseCredentialEncryptionService_1 = class DatabaseCredentialEncryptionService {
    logger = new common_1.Logger(DatabaseCredentialEncryptionService_1.name);
    encryptionKeys = new Map();
    encryptionKeyId;
    constructor(configService) {
        const configuredKey = configService.get("DATABASE_CONNECTION_ENCRYPTION_KEY");
        const nodeEnvironment = configService.get("NODE_ENV", "development");
        this.encryptionKeyId = configService.get("DATABASE_CONNECTION_ENCRYPTION_KEY_ID", "local-v1");
        this.loadPreviousKeys(configService.get("DATABASE_CONNECTION_ENCRYPTION_PREVIOUS_KEYS", "{}"));
        if (configuredKey) {
            this.encryptionKeys.set(this.encryptionKeyId, this.decodeKey(configuredKey, "DATABASE_CONNECTION_ENCRYPTION_KEY"));
            return;
        }
        if (nodeEnvironment === "production") {
            throw new Error("DATABASE_CONNECTION_ENCRYPTION_KEY is required in production");
        }
        const developmentSecret = configService.getOrThrow("JWT_SECRET");
        const developmentKey = Buffer.from((0, node_crypto_1.hkdfSync)("sha256", Buffer.from(developmentSecret, "utf8"), Buffer.from("peptrace-client-database-connections", "utf8"), Buffer.from("aes-256-gcm", "utf8"), 32));
        this.encryptionKeys.set(this.encryptionKeyId, developmentKey);
        this.logger.warn("Using a development-derived database credential key; configure DATABASE_CONNECTION_ENCRYPTION_KEY before deployment");
    }
    encrypt(value, additionalAuthenticatedData) {
        const encryptionIv = (0, node_crypto_1.randomBytes)(12);
        const cipher = (0, node_crypto_1.createCipheriv)("aes-256-gcm", this.getEncryptionKey(this.encryptionKeyId), encryptionIv);
        cipher.setAAD(Buffer.from(additionalAuthenticatedData, "utf8"));
        const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
        return {
            authenticationTag: Uint8Array.from(cipher.getAuthTag()),
            ciphertext: Uint8Array.from(ciphertext),
            encryptionIv: Uint8Array.from(encryptionIv),
            encryptionKeyId: this.encryptionKeyId
        };
    }
    decrypt(ciphertext, encryptionIv, authenticationTag, additionalAuthenticatedData, encryptionKeyId) {
        const decipher = (0, node_crypto_1.createDecipheriv)("aes-256-gcm", this.getEncryptionKey(encryptionKeyId), encryptionIv);
        decipher.setAAD(Buffer.from(additionalAuthenticatedData, "utf8"));
        decipher.setAuthTag(Buffer.from(authenticationTag));
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    }
    loadPreviousKeys(value) {
        let parsed;
        try {
            parsed = JSON.parse(value);
        }
        catch {
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
    decodeKey(encodedKey, label) {
        const decodedKey = Buffer.from(encodedKey, "base64");
        if (decodedKey.length !== 32) {
            throw new Error(`${label} must decode to exactly 32 bytes`);
        }
        return decodedKey;
    }
    getEncryptionKey(keyId) {
        const key = this.encryptionKeys.get(keyId);
        if (!key) {
            throw new Error(`Database credential encryption key ${keyId} is not configured`);
        }
        return key;
    }
};
exports.DatabaseCredentialEncryptionService = DatabaseCredentialEncryptionService;
exports.DatabaseCredentialEncryptionService = DatabaseCredentialEncryptionService = DatabaseCredentialEncryptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseCredentialEncryptionService);
//# sourceMappingURL=database-credential-encryption.service.js.map