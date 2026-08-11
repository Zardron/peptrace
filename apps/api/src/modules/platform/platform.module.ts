import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PlatformController } from "./platform.controller";
import { PlatformService } from "./platform.service";

@Module({
  controllers: [PlatformController],
  imports: [PrismaModule],
  providers: [PlatformService]
})
export class PlatformModule {}
