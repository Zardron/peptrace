import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { OperationsController } from "./operations.controller";
import { OperationsService } from "./operations.service";

@Module({
  controllers: [OperationsController],
  imports: [AuthModule, PrismaModule],
  providers: [OperationsService]
})
export class OperationsModule {}
