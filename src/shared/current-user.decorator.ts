import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request['user'] as { id: number }).id;
  },
);