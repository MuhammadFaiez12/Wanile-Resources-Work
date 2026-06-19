import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slack_user_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
