import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from './domain.error';

const ERROR_STATUS: Record<string, number> = {
  // Chat
  InvalidChatDataError: 422,
  ChatNotFoundError: 404,
  ChatTagTakenError: 409,
  // Member
  MemberNotFoundError: 404,
  MemberBannedError: 403,
  AlreadyMemberError: 409,
  InsufficientPermissionsError: 403,
  InvalidMemberDataError: 422,
  // Message
  MessageNotFoundError: 404,
  InvalidMessageDataError: 422,
  MessageScheduledInPastError: 422,
  // User
  UserNotFoundError: 404,
  UserAlreadyExistsError: 409,
  InvalidUserDataError: 422,
  // Auth
  InvalidCredentialsError: 401,
  EmailNotVerifiedError: 403,
  InvalidOtpError: 400,
};

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = ERROR_STATUS[exception.name] ?? 500;
    response.status(statusCode).json({
      statusCode,
      message: exception.message,
      error: exception.name,
    });
  }
}
