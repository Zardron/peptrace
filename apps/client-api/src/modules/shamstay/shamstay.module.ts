import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ShamstayController, ShamstayPublicController } from "./shamstay.controller";
import { ShamstayService } from "./shamstay.service";

@Module({
  controllers: [ShamstayController, ShamstayPublicController],
  imports: [AuthModule, PrismaModule],
  providers: [ShamstayService]
})
export class ShamstayModule {}
