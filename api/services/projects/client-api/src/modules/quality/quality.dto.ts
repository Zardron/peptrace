import { Type } from "class-transformer";
import { IsISO8601, IsInt, IsObject, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class ListQualityQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  peptideId?: string;

  @IsOptional()
  @IsString()
  batchId?: string;
}

export class UpdateQualityStatusDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreatePeptraceBatchDto {
  @IsString()
  @MinLength(2)
  batchCode!: string;

  @IsString()
  vendorId!: string;

  @IsString()
  peptideId!: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsISO8601()
  manufacturedAt?: string;

  @IsOptional()
  @IsISO8601()
  receivedAt?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantityVials!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  vialSizeMg!: number;

  @IsOptional()
  @IsString()
  storageCondition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdatePeptraceBatchDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  batchCode?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  peptideId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsISO8601()
  manufacturedAt?: string;

  @IsOptional()
  @IsISO8601()
  receivedAt?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantityVials?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vialSizeMg?: number;

  @IsOptional()
  @IsString()
  storageCondition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreatePeptraceCertificateDto {
  @IsString()
  batchId!: string;

  @IsOptional()
  @IsString()
  labTestId?: string;

  @IsString()
  @MinLength(2)
  certificateNumber!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsISO8601()
  issuedAt?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsObject()
  summary?: Record<string, unknown>;
}

export class UpdatePeptraceCertificateDto {
  @IsOptional()
  @IsString()
  batchId?: string;

  @IsOptional()
  @IsString()
  labTestId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  certificateNumber?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsISO8601()
  issuedAt?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsObject()
  summary?: Record<string, unknown>;
}
