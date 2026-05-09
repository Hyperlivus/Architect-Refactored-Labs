import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(2, 50)
  nickname: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: 'tag must be 3-20 alphanumeric characters or underscores',
  })
  tag: string;

  @IsString()
  @Length(8, 100)
  password: string;
}
