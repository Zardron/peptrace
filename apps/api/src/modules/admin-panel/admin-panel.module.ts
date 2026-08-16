import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminPanelController } from "./admin-panel.controller";
import { AdminPanelService } from "./admin-panel.service";

@Module({
  controllers: [AdminPanelController],
  imports: [AuthModule, PrismaModule],
  providers: [AdminPanelService]
})
export class AdminPanelModule {}
