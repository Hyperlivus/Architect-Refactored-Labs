import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../../user/application/user.service';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
} from '../../domain/auth.errors';
import { LoginCommand } from './login.command';

@CommandHandler(LoginCommand)
export class LoginHandler
  implements ICommandHandler<LoginCommand, { accessToken: string }>
{
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: LoginCommand): Promise<{ accessToken: string }> {
    const { emailOrTag, password } = command;

    const user = await this.userService.findByEmailOrTag(emailOrTag);
    if (!user) throw new InvalidCredentialsError();

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new InvalidCredentialsError();

    if (!user.emailVerified) throw new EmailNotVerifiedError();

    return {
      accessToken: this.jwtService.sign({ sub: user.id!, email: user.email }),
    };
  }
}
