import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedTime?: number;

  @IsIn(['high', 'medium', 'low'])
  priority!: 'high' | 'medium' | 'low';

  @IsString()
  date!: string;

  @IsOptional()
  @IsString()
  goalId?: string;

  @IsOptional()
  @IsString()
  milestoneId?: string;
}
