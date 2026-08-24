import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateLabTestDto } from "./testing.dto";
import { TestingService } from "./testing.service";

@Controller("testing")
@UseGuards(JwtAuthGuard)
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Get()
  listTests(
    @Query("status") status?: string,
    @Query("vendorId") vendorId?: string,
    @Query("peptideId") peptideId?: string
  ) {
    return this.testingService.listTests({ peptideId, status, vendorId });
  }

  @Get(":id")
  getTest(@Param("id") id: string) {
    return this.testingService.getTest(id);
  }

  @Post()
  createTest(@Body() dto: CreateLabTestDto) {
    return this.testingService.createTest(dto);
  }
}
