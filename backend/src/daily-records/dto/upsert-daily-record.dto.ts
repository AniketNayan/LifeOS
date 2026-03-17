import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertDailyRecordDto {
  @IsOptional()
  topTasks?: unknown;

  @IsOptional()
  @IsString()
  mainFocus?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  productivityScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deepWorkHours?: number;

  @IsOptional()
  @IsBoolean()
  healthDone?: boolean;

  @IsOptional()
  @IsBoolean()
  distractionFree?: boolean;

  @IsOptional()
  @IsString()
  workNotes?: string;

  @IsOptional()
  @IsString()
  personalThoughts?: string;

  @IsOptional()
  @IsString()
  lessonsLearned?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  goalContributions?: number;
}
