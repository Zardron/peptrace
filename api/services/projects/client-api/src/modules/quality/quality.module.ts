import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { QualityController, QualityPublicController } from "./quality.controller";
import { QualityService } from "./quality.service";

@Module({
  controllers: [QualityController, QualityPublicController],
  imports: [AuthModule, PrismaModule],
  providers: [QualityService]
})
export class QualityModule {}
