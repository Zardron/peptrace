import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import "reflect-metadata";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>("CORS_ORIGIN", "http://localhost:5173");

  app.use(helmet());
  app.enableCors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((origin) => origin.trim()),
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );
  app.setGlobalPrefix("client-api");

  await app.listen(configService.get<number>("CLIENT_API_PORT", 3001), configService.get<string>("HOST", "127.0.0.1"));
}

void bootstrap();
