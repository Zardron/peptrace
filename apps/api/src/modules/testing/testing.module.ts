import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { TestingController } from "./testing.controller";
import { TestingService } from "./testing.service";

@Module({
  controllers: [TestingController],
  imports: [AuthModule, PrismaModule],
  providers: [TestingService]
})
export class TestingModule {}
