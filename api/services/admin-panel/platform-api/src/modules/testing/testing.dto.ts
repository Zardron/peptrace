import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ASSAYS, TESTING_STATUSES } from "../../common/constants";

export class CreateLabTestDto {
  @IsString()
  labId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  vialSizeMg: number;

  @IsString()
  vendorId: string;

  @IsString()
  peptideId: string;

  @IsIn(ASSAYS)
  assay: string;

  @IsIn(TESTING_STATUSES)
  testingStatus: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  purityPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  labelClaimPercent?: number;
}
