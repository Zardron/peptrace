import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";

@Module({
  controllers: [ServicesController],
  imports: [AuthModule, PrismaModule],
  providers: [ServicesService]
})
export class ServicesModule {}
