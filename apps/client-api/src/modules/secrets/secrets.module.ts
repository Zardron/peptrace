import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SecretEncryptionService } from "./secret-encryption.service";
import { SecretsController } from "./secrets.controller";
import { SecretsService } from "./secrets.service";

@Module({
  controllers: [SecretsController],
  imports: [AuthModule, PrismaModule],
  providers: [SecretEncryptionService, SecretsService]
})
export class SecretsModule {}
