import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { BackendServicesController } from "./backend-services.controller";
import { BackendServicesService } from "./backend-services.service";

@Module({
  controllers: [BackendServicesController],
  imports: [AuthModule, PrismaModule],
  providers: [BackendServicesService]
})
export class BackendServicesModule {}
