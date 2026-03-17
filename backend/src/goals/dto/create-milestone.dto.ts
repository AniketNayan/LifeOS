import { IsString } from 'class-validator';

export class CreateMilestoneDto {
  @IsString()
  title!: string;
}
