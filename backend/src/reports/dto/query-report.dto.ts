import { IsDateString, IsOptional, IsString } from 'class-validator';

export class QueryReportDto {
  @IsOptional()
  @IsString()
  employee?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
