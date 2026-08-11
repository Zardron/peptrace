import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController],
  imports: [PrismaModule]
})
export class HealthModule {}
