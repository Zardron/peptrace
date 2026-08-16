import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { DatabaseCredentialEncryptionService } from "./database-credential-encryption.service";
import { DatabaseConnectionsController } from "./database-connections.controller";
import { DatabaseConnectionsService } from "./database-connections.service";

@Module({
  controllers: [DatabaseConnectionsController],
  imports: [AuthModule, PrismaModule],
  providers: [DatabaseConnectionsService, DatabaseCredentialEncryptionService]
})
export class DatabaseConnectionsModule {}
