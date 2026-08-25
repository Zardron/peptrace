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
exports.CreateClientDto = exports.CreateClientSettingsDto = exports.CreateClientOwnerDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const constants_1 = require("../../common/constants");
const normalizeSlug = ({ value }) => typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "")
    : value;
const normalizeEmail = ({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value;
class CreateClientOwnerDto {
    email;
    displayName;
    password;
}
exports.CreateClientOwnerDto = CreateClientOwnerDto;
__decorate([
    (0, class_transformer_1.Transform)(normalizeEmail),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateClientOwnerDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateClientOwnerDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], CreateClientOwnerDto.prototype, "password", void 0);
class CreateClientSettingsDto {
    branding;
    enabledModules;
    integrations;
    limits;
    labels;
    businessSettings;
}
exports.CreateClientSettingsDto = CreateClientSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateClientSettingsDto.prototype, "branding", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateClientSettingsDto.prototype, "enabledModules", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateClientSettingsDto.prototype, "integrations", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateClientSettingsDto.prototype, "limits", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateClientSettingsDto.prototype, "labels", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateClientSettingsDto.prototype, "businessSettings", void 0);
class CreateClientDto {
    name;
    slug;
    accessStatus;
    status;
    owner;
    enabledAccounts;
    operationalValue;
    openItems;
    dataRegion;
    industry;
    accentColor;
    ownerUser;
    settings;
}
exports.CreateClientDto = CreateClientDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateClientDto.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Transform)(normalizeSlug),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateClientDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsIn)(constants_1.ACCESS_STATUSES),
    __metadata("design:type", String)
], CreateClientDto.prototype, "accessStatus", void 0);
__decorate([
    (0, class_validator_1.IsIn)(constants_1.TENANT_STATUSES),
    __metadata("design:type", String)
], CreateClientDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClientDto.prototype, "owner", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateClientDto.prototype, "enabledAccounts", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateClientDto.prototype, "operationalValue", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateClientDto.prototype, "openItems", void 0);
__decorate([
    (0, class_validator_1.IsIn)(constants_1.DATA_REGIONS),
    __metadata("design:type", String)
], CreateClientDto.prototype, "dataRegion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateClientDto.prototype, "industry", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClientDto.prototype, "accentColor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CreateClientOwnerDto),
    __metadata("design:type", CreateClientOwnerDto)
], CreateClientDto.prototype, "ownerUser", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CreateClientSettingsDto),
    __metadata("design:type", CreateClientSettingsDto)
], CreateClientDto.prototype, "settings", void 0);
//# sourceMappingURL=clients.dto.js.map