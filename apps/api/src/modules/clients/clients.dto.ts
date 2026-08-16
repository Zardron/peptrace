import { IsIn, IsInt, IsString, Min, MinLength } from "class-validator";
import { ACCESS_STATUSES, DATA_REGIONS, TENANT_STATUSES } from "../../common/constants";

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
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
}
