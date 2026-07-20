import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(24)
  name: string;
}

export class UpdateFolderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(24)
  name: string;
}
