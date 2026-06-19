import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  employee_name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  project_task?: string;

  @IsOptional()
  @IsString()
  work_done?: string;

  @Transform(({ value }) => Math.max(1, Math.min(12, parseInt(value) || 1)))
  @IsInt()
  @Min(1)
  @Max(12)
  hours_spent: number;

  @IsOptional()
  @IsString()
  blockers?: string;

  @IsOptional()
  @IsString()
  tomorrow_plan?: string;

  @Transform(({ value }) => Math.max(1, Math.min(5, parseInt(value) || 3)))
  @IsInt()
  @Min(1)
  @Max(5)
  mood: number;

  @Transform(({ value }) => Math.max(0, Math.min(100, parseInt(value) || 50)))
  @IsInt()
  @Min(0)
  @Max(100)
  progress_percent: number;
}
