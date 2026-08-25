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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretsController = void 0;
const common_1 = require("@nestjs/common");
const current_client_user_decorator_1 = require("../auth/current-client-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const secrets_dto_1 = require("./secrets.dto");
const secrets_service_1 = require("./secrets.service");
let SecretsController = class SecretsController {
    secretsService;
    constructor(secretsService) {
        this.secretsService = secretsService;
    }
    listSecrets(query, user) {
        return this.secretsService.listSecrets(query, user);
    }
    createSecret(dto, user) {
        return this.secretsService.createSecret(dto, user);
    }
    listAuditEvents(query, user) {
        return this.secretsService.listAuditEvents(query, user);
    }
    getSecret(secret, user) {
        return this.secretsService.getSecret(secret, user);
    }
    updateSecret(secret, dto, user) {
        return this.secretsService.updateSecret(secret, dto, user);
    }
    listVersions(secret, user) {
        return this.secretsService.listVersions(secret, user);
    }
    addVersion(secret, dto, user) {
        return this.secretsService.addVersion(secret, dto, user);
    }
    accessVersion(secret, version, user) {
        return this.secretsService.accessVersion(secret, version, user);
    }
    updateVersionState(secret, version, dto, user) {
        return this.secretsService.updateVersionState(secret, version, dto, user);
    }
    destroyVersion(secret, version, user) {
        return this.secretsService.destroyVersion(secret, version, user);
    }
    listGrants(secret, user) {
        return this.secretsService.listGrants(secret, user);
    }
    setGrant(secret, userId, dto, user) {
        return this.secretsService.setGrant(secret, userId, dto, user);
    }
    removeGrant(secret, userId, user) {
        return this.secretsService.removeGrant(secret, userId, user);
    }
};
exports.SecretsController = SecretsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [secrets_dto_1.ListSecretsQueryDto, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "listSecrets", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [secrets_dto_1.CreateSecretDto, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "createSecret", null);
__decorate([
    (0, common_1.Get)("audit"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [secrets_dto_1.ListSecretAuditQueryDto, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "listAuditEvents", null);
__decorate([
    (0, common_1.Get)(":secret"),
    __param(0, (0, common_1.Param)("secret")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "getSecret", null);
__decorate([
    (0, common_1.Patch)(":secret"),
    __param(0, (0, common_1.Param)("secret")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, secrets_dto_1.UpdateSecretDto, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "updateSecret", null);
__decorate([
    (0, common_1.Get)(":secret/versions"),
    __param(0, (0, common_1.Param)("secret")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "listVersions", null);
__decorate([
    (0, common_1.Post)(":secret/versions"),
    __param(0, (0, common_1.Param)("secret")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, secrets_dto_1.AddSecretVersionDto, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "addVersion", null);
__decorate([
    (0, common_1.Get)(":secret/versions/:version/access"),
    (0, common_1.Header)("Cache-Control", "no-store, max-age=0"),
    (0, common_1.Header)("Pragma", "no-cache"),
    __param(0, (0, common_1.Param)("secret")),
    __param(1, (0, common_1.Param)("version")),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "accessVersion", null);
__decorate([
    (0, common_1.Patch)(":secret/versions/:version"),
    __param(0, (0, common_1.Param)("secret")),
    __param(1, (0, common_1.Param)("version")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, secrets_dto_1.UpdateSecretVersionDto, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "updateVersionState", null);
__decorate([
    (0, common_1.Delete)(":secret/versions/:version"),
    __param(0, (0, common_1.Param)("secret")),
    __param(1, (0, common_1.Param)("version")),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "destroyVersion", null);
__decorate([
    (0, common_1.Get)(":secret/grants"),
    __param(0, (0, common_1.Param)("secret")),
    __param(1, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "listGrants", null);
__decorate([
    (0, common_1.Put)(":secret/grants/:userId"),
    __param(0, (0, common_1.Param)("secret")),
    __param(1, (0, common_1.Param)("userId")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, secrets_dto_1.SetSecretGrantDto, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "setGrant", null);
__decorate([
    (0, common_1.Delete)(":secret/grants/:userId"),
    __param(0, (0, common_1.Param)("secret")),
    __param(1, (0, common_1.Param)("userId")),
    __param(2, (0, current_client_user_decorator_1.CurrentClientUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SecretsController.prototype, "removeGrant", null);
exports.SecretsController = SecretsController = __decorate([
    (0, common_1.Controller)("secrets"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [secrets_service_1.SecretsService])
], SecretsController);
//# sourceMappingURL=secrets.controller.js.map