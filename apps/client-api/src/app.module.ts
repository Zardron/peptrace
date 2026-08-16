import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { join } from "node:path";
import { AppController } from "./app.controller";
import { envValidationSchema } from "./config/env.validation";
import { AdminPanelModule } from "./modules/admin-panel/admin-panel.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        join(process.cwd(), ".env.local"),
        join(process.cwd(), ".env"),
        join(process.cwd(), "../../.env.local"),
        join(process.cwd(), "../../.env")
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
    UsersModule
  ],
  controllers: [AppController]
})
export class AppModule {}
