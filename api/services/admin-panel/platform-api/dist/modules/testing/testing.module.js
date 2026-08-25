"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestingModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const prisma_module_1 = require("../prisma/prisma.module");
const testing_controller_1 = require("./testing.controller");
const testing_service_1 = require("./testing.service");
let TestingModule = class TestingModule {
};
exports.TestingModule = TestingModule;
exports.TestingModule = TestingModule = __decorate([
    (0, common_1.Module)({
        controllers: [testing_controller_1.TestingController],
        imports: [auth_module_1.AuthModule, prisma_module_1.PrismaModule],
        providers: [testing_service_1.TestingService]
    })
], TestingModule);
//# sourceMappingURL=testing.module.js.map