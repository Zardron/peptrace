import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";

@Module({
  controllers: [ClientsController],
  imports: [PrismaModule],
  providers: [ClientsService]
})
export class ClientsModule {}
