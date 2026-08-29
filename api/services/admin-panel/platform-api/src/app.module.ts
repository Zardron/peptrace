import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { join } from "node:path";
import { AppController } from "./app.controller";
import { envValidationSchema } from "./config/env.validation";
import { AdminPanelModule } from "./modules/admin-panel/admin-panel.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BackendServicesModule } from "./modules/backend-services/backend-services.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { DatabaseConnectionsModule } from "./modules/database-connections/database-connections.module";
import { HealthModule } from "./modules/health/health.module";
import { PlatformModule } from "./modules/platform/platform.module";
import { PlatformSecretsModule } from "./modules/platform-secrets/platform-secrets.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { TestingModule } from "./modules/testing/testing.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        join(process.cwd(), ".env.local"),
        join(process.cwd(), ".env"),
        join(process.cwd(), "../../.env.local"),
        join(process.cwd(), "../../.env"),
        join(process.cwd(), "../../../../.env.local"),
        join(process.cwd(), "../../../../.env")
      ],
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true
      }
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1h" }
      })
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    AdminPanelModule,
    BackendServicesModule,
    ClientsModule,
    DatabaseConnectionsModule,
    CatalogModule,
    TestingModule,
    PlatformModule,
    PlatformSecretsModule
  ],
  controllers: [AppController]
})
export class AppModule {}
