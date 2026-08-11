import { IsNumber, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class CreateVendorDto {
  @IsString()
  @MinLength(2)
  displayName: string;

  @IsString()
  @MinLength(2)
  slug: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  overallRating?: number;
}

export class CreatePeptideDto {
  @IsString()
  @MinLength(2)
  label: string;

  @IsString()
  @MinLength(2)
  slug: string;
}

export class CreateLabDto {
  @IsString()
  @MinLength(2)
  displayName: string;

  @IsString()
  @MinLength(2)
  slug: string;
}
