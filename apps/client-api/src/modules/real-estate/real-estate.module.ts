import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RealEstateController, RealEstatePublicController } from "./real-estate.controller";
import { RealEstateService } from "./real-estate.service";

@Module({
  controllers: [RealEstateController, RealEstatePublicController],
  imports: [AuthModule, PrismaModule],
  providers: [RealEstateService]
})
export class RealEstateModule {}
