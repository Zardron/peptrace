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
exports.CreateLabTestDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const constants_1 = require("../../common/constants");
class CreateLabTestDto {
    labId;
    vialSizeMg;
    vendorId;
    peptideId;
    assay;
    testingStatus;
    purityPercent;
    labelClaimPercent;
}
exports.CreateLabTestDto = CreateLabTestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLabTestDto.prototype, "labId", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateLabTestDto.prototype, "vialSizeMg", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLabTestDto.prototype, "vendorId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLabTestDto.prototype, "peptideId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(constants_1.ASSAYS),
    __metadata("design:type", String)
], CreateLabTestDto.prototype, "assay", void 0);
__decorate([
    (0, class_validator_1.IsIn)(constants_1.TESTING_STATUSES),
    __metadata("design:type", String)
], CreateLabTestDto.prototype, "testingStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateLabTestDto.prototype, "purityPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateLabTestDto.prototype, "labelClaimPercent", void 0);
//# sourceMappingURL=testing.dto.js.map