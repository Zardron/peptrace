import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TestingController } from "./testing.controller";
import { TestingService } from "./testing.service";

@Module({
  controllers: [TestingController],
  imports: [PrismaModule],
  providers: [TestingService]
})
export class TestingModule {}
