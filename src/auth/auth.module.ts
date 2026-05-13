import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthController } from './presentation/auth.controller';
import { UserModule } from '../user/user.module';
import { RegisterHandler } from './application/commands/register.handler';
import { LoginHandler } from './application/commands/login.handler';
import { VerifyEmailHandler } from './application/commands/verify-email.handler';
import { ResendOtpHandler } from './application/commands/resend-otp.handler';

const CommandHandlers = [
  RegisterHandler,
  LoginHandler,
  VerifyEmailHandler,
  ResendOtpHandler,
];

@Module({
  imports: [CqrsModule, UserModule],
  controllers: [AuthController],
  providers: [...CommandHandlers],
})
export class AuthModule {}
