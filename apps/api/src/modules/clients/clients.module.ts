import { Module } from "@nestjs/common";
import { AdminPanelModule } from "../admin-panel/admin-panel.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";

@Module({
  controllers: [ClientsController],
  imports: [AdminPanelModule, AuthModule, PrismaModule],
  providers: [ClientsService]
})
export class ClientsModule {}
