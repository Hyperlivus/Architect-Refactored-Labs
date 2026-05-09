import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,32}$/, {
    message: 'tag must be 3-32 alphanumeric characters or underscores',
  })
  tag: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}

export class UpdateChatDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}
