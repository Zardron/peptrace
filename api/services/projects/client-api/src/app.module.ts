import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { join } from "node:path";
import { AppController } from "./app.controller";
import { envValidationSchema } from "./config/env.validation";
import { AdminPanelModule } from "./modules/admin-panel/admin-panel.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { OperationsModule } from "./modules/operations/operations.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { QualityModule } from "./modules/quality/quality.module";
import { RealEstateModule } from "./modules/real-estate/real-estate.module";
import { SecretsModule } from "./modules/secrets/secrets.module";
import { ServicesModule } from "./modules/services/services.module";
import { ShamstayModule } from "./modules/shamstay/shamstay.module";
import { UsersModule } from "./modules/users/users.module";

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
    OperationsModule,
    QualityModule,
    RealEstateModule,
    UsersModule,
    ServicesModule,
    ShamstayModule,
    SecretsModule
  ],
  controllers: [AppController]
})
export class AppModule {}
