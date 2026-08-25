import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

export const SECRET_GRANT_ROLES = ["viewer", "accessor", "manager"] as const;
export const SECRET_VERSION_STATES = ["ENABLED", "DISABLED"] as const;

export type SecretGrantRole = (typeof SECRET_GRANT_ROLES)[number];
export type MutableSecretVersionState = (typeof SECRET_VERSION_STATES)[number];

export class ListSecretsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 25;
}

export class CreateSecretDto {
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
}

export class UpdateSecretDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsObject()
  labels?: Record<string, string>;
}

export class AddSecretVersionDto {
  @IsString()
  @MinLength(1)
  value!: string;
}

export class UpdateSecretVersionDto {
  @IsIn(SECRET_VERSION_STATES)
  state!: MutableSecretVersionState;
}

export class SetSecretGrantDto {
  @IsIn(SECRET_GRANT_ROLES)
  role!: SecretGrantRole;
}

export class ListSecretAuditQueryDto {
  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 50;
}
