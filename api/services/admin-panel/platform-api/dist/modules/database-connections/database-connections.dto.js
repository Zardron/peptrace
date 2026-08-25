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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertDatabaseConnectionDto = exports.DatabaseConnectionMode = exports.DatabaseSslMode = exports.DatabaseProvider = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var DatabaseProvider;
(function (DatabaseProvider) {
    DatabaseProvider["MONGODB"] = "MONGODB";
    DatabaseProvider["MYSQL"] = "MYSQL";
    DatabaseProvider["POSTGRESQL"] = "POSTGRESQL";
    DatabaseProvider["SUPABASE"] = "SUPABASE";
})(DatabaseProvider || (exports.DatabaseProvider = DatabaseProvider = {}));
var DatabaseSslMode;
(function (DatabaseSslMode) {
    DatabaseSslMode["DISABLE"] = "DISABLE";
    DatabaseSslMode["REQUIRE"] = "REQUIRE";
    DatabaseSslMode["VERIFY_CA"] = "VERIFY_CA";
    DatabaseSslMode["VERIFY_FULL"] = "VERIFY_FULL";
})(DatabaseSslMode || (exports.DatabaseSslMode = DatabaseSslMode = {}));
var DatabaseConnectionMode;
(function (DatabaseConnectionMode) {
    DatabaseConnectionMode["DIRECT"] = "DIRECT";
    DatabaseConnectionMode["SESSION_POOLER"] = "SESSION_POOLER";
    DatabaseConnectionMode["STANDARD"] = "STANDARD";
    DatabaseConnectionMode["TRANSACTION_POOLER"] = "TRANSACTION_POOLER";
})(DatabaseConnectionMode || (exports.DatabaseConnectionMode = DatabaseConnectionMode = {}));
class UpsertDatabaseConnectionDto {
    provider;
    displayName;
    host;
    port;
    databaseName;
    username;
    password;
    sslMode;
    connectionMode;
    schemaName;
    authSource;
    replicaSet;
    useSrv;
}
exports.UpsertDatabaseConnectionDto = UpsertDatabaseConnectionDto;
__decorate([
    (0, class_validator_1.IsEnum)(DatabaseProvider),
    __metadata("design:type", String)
], UpsertDatabaseConnectionDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpsertDatabaseConnectionDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(253),
    __metadata("design:type", String)
], UpsertDatabaseConnectionDto.prototype, "host", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    __metadata("design:type", Number)
], UpsertDatabaseConnectionDto.prototype, "port", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], UpsertDatabaseConnectionDto.prototype, "databaseName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], UpsertDatabaseConnectionDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(512),
    __metadata("design:type", String)
], UpsertDatabaseConnectionDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(DatabaseSslMode),
    __metadata("design:type", String)
], UpsertDatabaseConnectionDto.prototype, "sslMode", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(DatabaseConnectionMode),
    __metadata("design:type", String)
], UpsertDatabaseConnectionDto.prototype, "connectionMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(63),
    __metadata("design:type", String)
], UpsertDatabaseConnectionDto.prototype, "schemaName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], UpsertDatabaseConnectionDto.prototype, "authSource", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], UpsertDatabaseConnectionDto.prototype, "replicaSet", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertDatabaseConnectionDto.prototype, "useSrv", void 0);
//# sourceMappingURL=database-connections.dto.js.map