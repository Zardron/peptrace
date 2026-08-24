import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested
} from "class-validator";

export enum BackendServiceScope {
  CLIENT_SPECIFIC = "CLIENT_SPECIFIC",
  SHARED = "SHARED"
}

export enum BackendServiceStatus {
  ACTIVE = "ACTIVE",
  DEPRECATED = "DEPRECATED",
  DRAFT = "DRAFT"
}

export enum TenantBackendServiceStatus {
  DISABLED = "DISABLED",
  ENABLED = "ENABLED",
  PAUSED = "PAUSED"
}

export enum BackendServiceHttpMethod {
  DELETE = "DELETE",
  GET = "GET",
  PATCH = "PATCH",
  POST = "POST",
  PUT = "PUT"
}

export class BackendServiceEndpointDto {
  @IsEnum(BackendServiceHttpMethod)
  method!: BackendServiceHttpMethod;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  path!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  summary!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  roles?: string[];
}

export class ListBackendServicesQueryDto {
  @IsOptional()
  @IsEnum(BackendServiceScope)
  scope?: BackendServiceScope;

  @IsOptional()
  @IsEnum(BackendServiceStatus)
  status?: BackendServiceStatus;
}

export class CreateBackendServiceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  key!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEnum(BackendServiceScope)
  scope!: BackendServiceScope;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(600)
  description!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  owner!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  basePath!: string;

  @IsOptional()
  @IsEnum(BackendServiceStatus)
  status?: BackendServiceStatus;

  @IsOptional()
  @IsBoolean()
  defaultEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(64)
  @ValidateNested({ each: true })
  @Type(() => BackendServiceEndpointDto)
  endpoints?: BackendServiceEndpointDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  requiredRoles?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  configSchema?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  docsPath?: string;
}

export class UpdateBackendServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(BackendServiceScope)
  scope?: BackendServiceScope;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(600)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  owner?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  basePath?: string;

  @IsOptional()
  @IsEnum(BackendServiceStatus)
  status?: BackendServiceStatus;

  @IsOptional()
  @IsBoolean()
  defaultEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(64)
  @ValidateNested({ each: true })
  @Type(() => BackendServiceEndpointDto)
  endpoints?: BackendServiceEndpointDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  requiredRoles?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  configSchema?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  docsPath?: string;
}

export class UpsertTenantBackendServiceDto {
  @IsBoolean()
  isEnabled!: boolean;

  @IsEnum(TenantBackendServiceStatus)
  status!: TenantBackendServiceStatus;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  notes?: string;
}
