import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  targetDate?: string;

  @IsOptional()
  @IsString()
  reward?: string;

  @IsOptional()
  @IsIn(['active', 'future', 'completed'])
  status?: 'active' | 'future' | 'completed';
}
