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
exports.UpsertTenantBackendServiceDto = exports.UpdateBackendServiceDto = exports.CreateBackendServiceDto = exports.ListBackendServicesQueryDto = exports.BackendServiceEndpointDto = exports.BackendServiceHttpMethod = exports.TenantBackendServiceStatus = exports.BackendServiceStatus = exports.BackendServiceScope = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var BackendServiceScope;
(function (BackendServiceScope) {
    BackendServiceScope["CLIENT_SPECIFIC"] = "CLIENT_SPECIFIC";
    BackendServiceScope["SHARED"] = "SHARED";
})(BackendServiceScope || (exports.BackendServiceScope = BackendServiceScope = {}));
var BackendServiceStatus;
(function (BackendServiceStatus) {
    BackendServiceStatus["ACTIVE"] = "ACTIVE";
    BackendServiceStatus["DEPRECATED"] = "DEPRECATED";
    BackendServiceStatus["DRAFT"] = "DRAFT";
})(BackendServiceStatus || (exports.BackendServiceStatus = BackendServiceStatus = {}));
var TenantBackendServiceStatus;
(function (TenantBackendServiceStatus) {
    TenantBackendServiceStatus["DISABLED"] = "DISABLED";
    TenantBackendServiceStatus["ENABLED"] = "ENABLED";
    TenantBackendServiceStatus["PAUSED"] = "PAUSED";
})(TenantBackendServiceStatus || (exports.TenantBackendServiceStatus = TenantBackendServiceStatus = {}));
var BackendServiceHttpMethod;
(function (BackendServiceHttpMethod) {
    BackendServiceHttpMethod["DELETE"] = "DELETE";
    BackendServiceHttpMethod["GET"] = "GET";
    BackendServiceHttpMethod["PATCH"] = "PATCH";
    BackendServiceHttpMethod["POST"] = "POST";
    BackendServiceHttpMethod["PUT"] = "PUT";
})(BackendServiceHttpMethod || (exports.BackendServiceHttpMethod = BackendServiceHttpMethod = {}));
class BackendServiceEndpointDto {
    method;
    path;
    summary;
    roles;
}
exports.BackendServiceEndpointDto = BackendServiceEndpointDto;
__decorate([
    (0, class_validator_1.IsEnum)(BackendServiceHttpMethod),
    __metadata("design:type", String)
], BackendServiceEndpointDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], BackendServiceEndpointDto.prototype, "path", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], BackendServiceEndpointDto.prototype, "summary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(24),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BackendServiceEndpointDto.prototype, "roles", void 0);
class ListBackendServicesQueryDto {
    scope;
    status;
}
exports.ListBackendServicesQueryDto = ListBackendServicesQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(BackendServiceScope),
    __metadata("design:type", String)
], ListBackendServicesQueryDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(BackendServiceStatus),
    __metadata("design:type", String)
], ListBackendServicesQueryDto.prototype, "status", void 0);
class CreateBackendServiceDto {
    key;
    name;
    scope;
    category;
    description;
    owner;
    basePath;
    status;
    defaultEnabled;
    endpoints;
    requiredRoles;
    tags;
    configSchema;
    docsPath;
}
exports.CreateBackendServiceDto = CreateBackendServiceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    (0, class_validator_1.Matches)(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    __metadata("design:type", String)
], CreateBackendServiceDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateBackendServiceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(BackendServiceScope),
    __metadata("design:type", String)
], CreateBackendServiceDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateBackendServiceDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(600),
    __metadata("design:type", String)
], CreateBackendServiceDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateBackendServiceDto.prototype, "owner", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateBackendServiceDto.prototype, "basePath", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(BackendServiceStatus),
    __metadata("design:type", String)
], CreateBackendServiceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateBackendServiceDto.prototype, "defaultEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(64),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BackendServiceEndpointDto),
    __metadata("design:type", Array)
], CreateBackendServiceDto.prototype, "endpoints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(24),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateBackendServiceDto.prototype, "requiredRoles", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(24),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateBackendServiceDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateBackendServiceDto.prototype, "configSchema", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreateBackendServiceDto.prototype, "docsPath", void 0);
class UpdateBackendServiceDto {
    name;
    scope;
    category;
    description;
    owner;
    basePath;
    status;
    defaultEnabled;
    endpoints;
    requiredRoles;
    tags;
    configSchema;
    docsPath;
}
exports.UpdateBackendServiceDto = UpdateBackendServiceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateBackendServiceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(BackendServiceScope),
    __metadata("design:type", String)
], UpdateBackendServiceDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateBackendServiceDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(600),
    __metadata("design:type", String)
], UpdateBackendServiceDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateBackendServiceDto.prototype, "owner", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateBackendServiceDto.prototype, "basePath", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(BackendServiceStatus),
    __metadata("design:type", String)
], UpdateBackendServiceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateBackendServiceDto.prototype, "defaultEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(64),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BackendServiceEndpointDto),
    __metadata("design:type", Array)
], UpdateBackendServiceDto.prototype, "endpoints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(24),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateBackendServiceDto.prototype, "requiredRoles", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(24),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateBackendServiceDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateBackendServiceDto.prototype, "configSchema", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], UpdateBackendServiceDto.prototype, "docsPath", void 0);
class UpsertTenantBackendServiceDto {
    isEnabled;
    status;
    config;
    notes;
}
exports.UpsertTenantBackendServiceDto = UpsertTenantBackendServiceDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertTenantBackendServiceDto.prototype, "isEnabled", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(TenantBackendServiceStatus),
    __metadata("design:type", String)
], UpsertTenantBackendServiceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpsertTenantBackendServiceDto.prototype, "config", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(400),
    __metadata("design:type", String)
], UpsertTenantBackendServiceDto.prototype, "notes", void 0);
//# sourceMappingURL=backend-services.dto.js.map