import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../../user/application/user.service';
import {
  InvalidCredentialsError,
  InvalidOtpError,
} from '../../domain/auth.errors';
import { VerifyEmailCommand } from './verify-email.command';

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler
  implements ICommandHandler<VerifyEmailCommand, { accessToken: string }>
{
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<{ accessToken: string }> {
    const { email, otp } = command;

    const user = await this.userService.findByEmail(email);
    if (!user) throw new InvalidCredentialsError();
    if (!user.otp || user.otp !== otp) throw new InvalidOtpError();

    await this.userService.verifyEmail(user.id!);

    return {
      accessToken: this.jwtService.sign({ sub: user.id!, email: user.email }),
    };
  }
}
