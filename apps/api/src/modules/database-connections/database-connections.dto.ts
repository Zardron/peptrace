import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

export enum DatabaseProvider {
  MONGODB = "MONGODB",
  MYSQL = "MYSQL",
  POSTGRESQL = "POSTGRESQL",
  SUPABASE = "SUPABASE"
}

export enum DatabaseSslMode {
  DISABLE = "DISABLE",
  REQUIRE = "REQUIRE",
  VERIFY_CA = "VERIFY_CA",
  VERIFY_FULL = "VERIFY_FULL"
}

export enum DatabaseConnectionMode {
  DIRECT = "DIRECT",
  SESSION_POOLER = "SESSION_POOLER",
  STANDARD = "STANDARD",
  TRANSACTION_POOLER = "TRANSACTION_POOLER"
}

export class UpsertDatabaseConnectionDto {
  @IsEnum(DatabaseProvider)
  provider!: DatabaseProvider;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(253)
  host!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  databaseName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  password?: string;

  @IsEnum(DatabaseSslMode)
  sslMode!: DatabaseSslMode;

  @IsEnum(DatabaseConnectionMode)
  connectionMode!: DatabaseConnectionMode;

  @IsOptional()
  @IsString()
  @MaxLength(63)
  schemaName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  authSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  replicaSet?: string;

  @IsOptional()
  @IsBoolean()
  useSrv?: boolean;
}
