import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(280)
  text: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  backgroundColor?: string;
}
