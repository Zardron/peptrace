import { IsIn, IsInt, IsString, Min, MinLength } from "class-validator";
import { DATA_REGIONS, TENANT_PLANS, TENANT_STATUSES } from "../../common/constants";

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string;

  @IsIn(TENANT_PLANS)
  plan: string;

  @IsIn(TENANT_STATUSES)
  status: string;

  @IsString()
  owner: string;

  @IsInt()
  @Min(1)
  seats: number;

  @IsInt()
  @Min(0)
  monthlySpend: number;

  @IsInt()
  @Min(0)
  openItems: number;

  @IsIn(DATA_REGIONS)
  dataRegion: string;
}
