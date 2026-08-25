import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { PlatformController } from "./platform.controller";
import { PlatformService } from "./platform.service";

@Module({
  controllers: [PlatformController],
  imports: [AuthModule, PrismaModule],
  providers: [PlatformService]
})
export class PlatformModule {}
