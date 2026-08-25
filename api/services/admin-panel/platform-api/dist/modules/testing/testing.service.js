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
exports.TestingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TestingService = class TestingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listTests(query) {
        return this.prisma.labTest.findMany({
            include: {
                lab: true,
                peptide: true,
                vendor: true
            },
            orderBy: { createdAt: "desc" },
            where: {
                peptideId: query.peptideId,
                testingStatus: query.status,
                vendorId: query.vendorId
            }
        });
    }
    async getTest(id) {
        const test = await this.prisma.labTest.findUnique({
            include: {
                lab: true,
                peptide: true,
                vendor: true
            },
            where: { id }
        });
        if (!test) {
            throw new common_1.NotFoundException("Lab test not found");
        }
        return test;
    }
    createTest(dto) {
        return this.prisma.labTest.create({
            data: {
                ...dto,
                resultsReleasedAt: dto.testingStatus === "COMPLETE" ? new Date() : null
            }
        });
    }
};
exports.TestingService = TestingService;
exports.TestingService = TestingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TestingService);
//# sourceMappingURL=testing.service.js.map