import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export const CLIENT_USER_ROLES = ["owner", "admin", "manager", "member", "viewer"] as const;
export const CLIENT_USER_STATUSES = ["active", "inactive"] as const;

export type ClientUserRole = (typeof CLIENT_USER_ROLES)[number];
export type ClientUserStatus = (typeof CLIENT_USER_STATUSES)[number];

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(CLIENT_USER_ROLES)
  role?: ClientUserRole;

  @IsOptional()
  @IsIn(CLIENT_USER_STATUSES)
  status?: ClientUserStatus;

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

export class CreateUserDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsIn(CLIENT_USER_ROLES)
  role!: ClientUserRole;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;

  @IsOptional()
  @IsIn(CLIENT_USER_ROLES)
  role?: ClientUserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ResetUserPasswordDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
