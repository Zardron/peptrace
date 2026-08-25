import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminPanelModule } from "../admin-panel/admin-panel.module";
import { PrismaModule } from "../prisma/prisma.module";
import { PlatformSecretEncryptionService } from "./platform-secret-encryption.service";
import { PlatformSecretsController } from "./platform-secrets.controller";
import { PlatformSecretsService } from "./platform-secrets.service";

@Module({
  controllers: [PlatformSecretsController],
  imports: [AdminPanelModule, AuthModule, PrismaModule],
  providers: [PlatformSecretsService, PlatformSecretEncryptionService]
})
export class PlatformSecretsModule {}
