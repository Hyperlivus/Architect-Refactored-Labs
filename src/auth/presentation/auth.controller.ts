import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  LoginDto,
  RegisterDto,
  ResendOtpDto,
  VerifyEmailDto,
} from '../application/auth.dto';
import { RegisterCommand } from '../application/commands/register.command';
import { LoginCommand } from '../application/commands/login.command';
import { VerifyEmailCommand } from '../application/commands/verify-email.command';
import { ResendOtpCommand } from '../application/commands/resend-otp.command';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    await this.commandBus.execute(
      new RegisterCommand(dto.email, dto.nickname, dto.tag, dto.password),
    );
    return { message: 'Check your email for the OTP code.' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.commandBus.execute(
      new LoginCommand(dto.emailOrTag, dto.password),
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.commandBus.execute(new VerifyEmailCommand(dto.email, dto.otp));
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() dto: ResendOtpDto) {
    await this.commandBus.execute(new ResendOtpCommand(dto.email));
    return { message: 'New OTP code sent.' };
  }
}
