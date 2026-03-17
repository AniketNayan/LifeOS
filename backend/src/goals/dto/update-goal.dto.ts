import { IsBoolean, IsIn, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

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

  @IsOptional()
  @IsBoolean()
  rewardClaimed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  contributionDays?: number;
}
