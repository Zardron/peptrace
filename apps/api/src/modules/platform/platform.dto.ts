import { ArrayMinSize, IsArray, IsString, MinLength } from "class-validator";

export class CreateApiKeyDto {
  @IsString()
  @MinLength(2)
  label: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  scopes: string[];
}
