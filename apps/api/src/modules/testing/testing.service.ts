import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLabTestDto } from "./testing.dto";

@Injectable()
export class TestingService {
  constructor(private readonly prisma: PrismaService) {}

  listTests(query: { peptideId?: string; status?: string; vendorId?: string }) {
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

  async getTest(id: string) {
    const test = await this.prisma.labTest.findUnique({
      include: {
        lab: true,
        peptide: true,
        vendor: true
      },
      where: { id }
    });

    if (!test) {
      throw new NotFoundException("Lab test not found");
    }

    return test;
  }

  createTest(dto: CreateLabTestDto) {
    return this.prisma.labTest.create({
      data: {
        ...dto,
        resultsReleasedAt: dto.testingStatus === "COMPLETE" ? new Date() : null
      }
    });
  }
}
