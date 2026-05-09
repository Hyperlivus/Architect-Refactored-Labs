import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  emailOrTag: string;

  @IsString()
  password: string;
}
