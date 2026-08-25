import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import { ACCESS_STATUSES, DATA_REGIONS, TENANT_STATUSES } from "../../common/constants";

const normalizeSlug = ({ value }: { value: unknown }): unknown =>
  typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "")
    : value;

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class CreateClientOwnerDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  displayName: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class CreateClientSettingsDto {
  @IsOptional()
  @IsObject()
  branding?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledModules?: string[];

  @IsOptional()
  @IsObject()
  integrations?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  limits?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  labels?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  businessSettings?: Record<string, unknown>;
}

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  name: string;

  @Transform(normalizeSlug)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  slug: string;

  @IsIn(ACCESS_STATUSES)
  accessStatus: string;

  @IsIn(TENANT_STATUSES)
  status: string;

  @IsString()
  owner: string;

  @IsInt()
  @Min(1)
  enabledAccounts: number;

  @IsInt()
  @Min(0)
  operationalValue: number;

  @IsInt()
  @Min(0)
  openItems: number;

  @IsIn(DATA_REGIONS)
  dataRegion: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  industry?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateClientOwnerDto)
  ownerUser?: CreateClientOwnerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateClientSettingsDto)
  settings?: CreateClientSettingsDto;
}
