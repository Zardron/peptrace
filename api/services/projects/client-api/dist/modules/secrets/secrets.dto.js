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
exports.ListSecretAuditQueryDto = exports.SetSecretGrantDto = exports.UpdateSecretVersionDto = exports.AddSecretVersionDto = exports.UpdateSecretDto = exports.CreateSecretDto = exports.ListSecretsQueryDto = exports.SECRET_VERSION_STATES = exports.SECRET_GRANT_ROLES = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
exports.SECRET_GRANT_ROLES = ["viewer", "accessor", "manager"];
exports.SECRET_VERSION_STATES = ["ENABLED", "DISABLED"];
class ListSecretsQueryDto {
    search;
    page = 1;
    pageSize = 25;
}
exports.ListSecretsQueryDto = ListSecretsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListSecretsQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListSecretsQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListSecretsQueryDto.prototype, "pageSize", void 0);
class CreateSecretDto {
    name;
    description;
    labels;
}
exports.CreateSecretDto = CreateSecretDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(255),
    (0, class_validator_1.Matches)(/^[A-Za-z][A-Za-z0-9_-]*$/, {
        message: "name must start with a letter and contain only letters, numbers, underscores, or hyphens"
    }),
    __metadata("design:type", String)
], CreateSecretDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateSecretDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateSecretDto.prototype, "labels", void 0);
class UpdateSecretDto {
    description;
    labels;
}
exports.UpdateSecretDto = UpdateSecretDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateSecretDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateSecretDto.prototype, "labels", void 0);
class AddSecretVersionDto {
    value;
}
exports.AddSecretVersionDto = AddSecretVersionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], AddSecretVersionDto.prototype, "value", void 0);
class UpdateSecretVersionDto {
    state;
}
exports.UpdateSecretVersionDto = UpdateSecretVersionDto;
__decorate([
    (0, class_validator_1.IsIn)(exports.SECRET_VERSION_STATES),
    __metadata("design:type", String)
], UpdateSecretVersionDto.prototype, "state", void 0);
class SetSecretGrantDto {
    role;
}
exports.SetSecretGrantDto = SetSecretGrantDto;
__decorate([
    (0, class_validator_1.IsIn)(exports.SECRET_GRANT_ROLES),
    __metadata("design:type", String)
], SetSecretGrantDto.prototype, "role", void 0);
class ListSecretAuditQueryDto {
    secret;
    page = 1;
    pageSize = 50;
}
exports.ListSecretAuditQueryDto = ListSecretAuditQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListSecretAuditQueryDto.prototype, "secret", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListSecretAuditQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListSecretAuditQueryDto.prototype, "pageSize", void 0);
//# sourceMappingURL=secrets.dto.js.map