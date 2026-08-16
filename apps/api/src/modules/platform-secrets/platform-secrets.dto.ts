import { IsObject, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreatePlatformSecretDto {
  @IsString()
  @MinLength(1)
  tenantId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/^[A-Za-z][A-Za-z0-9_-]*$/, {
    message: "name must start with a letter and contain only letters, numbers, underscores, or hyphens"
  })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsObject()
  labels?: Record<string, string>;

  @IsString()
  @MinLength(1)
  value!: string;
}
