"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealEstateModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const prisma_module_1 = require("../prisma/prisma.module");
const real_estate_controller_1 = require("./real-estate.controller");
const real_estate_service_1 = require("./real-estate.service");
let RealEstateModule = class RealEstateModule {
};
exports.RealEstateModule = RealEstateModule;
exports.RealEstateModule = RealEstateModule = __decorate([
    (0, common_1.Module)({
        controllers: [real_estate_controller_1.RealEstateController, real_estate_controller_1.RealEstatePublicController],
        imports: [auth_module_1.AuthModule, prisma_module_1.PrismaModule],
        providers: [real_estate_service_1.RealEstateService]
    })
], RealEstateModule);
//# sourceMappingURL=real-estate.module.js.map