import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { MemberService } from '../application/member.service';
import { PERMISSION_KEY } from './requires-permission.decorator';
import { Role } from '../domain/member.enum';
import type { Permission } from '../domain/member.enum';

@Injectable()
export class MemberGuard implements CanActivate {
  constructor(
    private readonly memberService: MemberService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request['user'] as { id: number }).id;
    const chatId = +request.params['chatId'];

    const member = await this.memberService.findByChatAndUser(chatId, userId);

    if (!member) throw new ForbiddenException('Not a member of this chat');
    if (member.isBanned())
      throw new ForbiddenException('You are banned from this chat');
    if (member.hasLeft())
      throw new ForbiddenException('You have left this chat');

    request['member'] = member;

    if (member.role === Role.SUPER_ADMIN) return true;

    const required = this.reflector.get<Permission>(
      PERMISSION_KEY,
      context.getHandler(),
    );
    if (required && !member.hasPermission(required)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
