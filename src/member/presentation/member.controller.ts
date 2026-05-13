import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { MemberGuard } from './member.guard';
import { RequiresPermission } from './requires-permission.decorator';
import {
  AddMemberDto,
  UpdatePermissionsDto,
  UpdateRoleDto,
} from '../application/member.dto';
import { Permission } from '../domain/member.enum';
import { JwtAuthGuard } from '../../shared/jwt-auth.guard';
import { CurrentMember } from '../../shared/current-member.decorator';
import { AddMemberCommand } from '../application/commands/add-member.command';
import { BanMemberCommand } from '../application/commands/ban-member.command';
import { UnbanMemberCommand } from '../application/commands/unban-member.command';
import { LeaveChatCommand } from '../application/commands/leave-chat.command';
import { UpdateMemberPermissionsCommand } from '../application/commands/update-member-permissions.command';
import { UpdateMemberRoleCommand } from '../application/commands/update-member-role.command';
import type { MemberDomain } from '../domain/member.domain';

@Controller('chat/:chatId/members')
@UseGuards(JwtAuthGuard, MemberGuard)
export class MemberController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @RequiresPermission(Permission.ADD_MEMBERS)
  addMember(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: AddMemberDto,
    @CurrentMember() requesting: MemberDomain,
  ) {
    return this.commandBus.execute(
      new AddMemberCommand(
        chatId,
        dto.userId,
        requesting.id!,
        dto.role,
        dto.permissions,
      ),
    );
  }

  @Patch(':memberId/permissions')
  @RequiresPermission(Permission.EDIT_PERMISSIONS)
  updatePermissions(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdatePermissionsDto,
    @CurrentMember() requesting: MemberDomain,
  ) {
    return this.commandBus.execute(
      new UpdateMemberPermissionsCommand(
        chatId,
        memberId,
        dto.permissions,
        requesting.id!,
      ),
    );
  }

  @Patch(':memberId/role')
  @RequiresPermission(Permission.EDIT_PERMISSIONS)
  updateRole(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateRoleDto,
    @CurrentMember() requesting: MemberDomain,
  ) {
    return this.commandBus.execute(
      new UpdateMemberRoleCommand(chatId, memberId, dto.role, requesting.id!),
    );
  }

  @Patch(':memberId/ban')
  @RequiresPermission(Permission.BAN_MEMBERS)
  async ban(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentMember() requesting: MemberDomain,
  ) {
    await this.commandBus.execute(
      new BanMemberCommand(chatId, memberId, requesting.id!),
    );
    return { message: 'Member banned' };
  }

  @Patch(':memberId/unban')
  @RequiresPermission(Permission.BAN_MEMBERS)
  async unban(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentMember() requesting: MemberDomain,
  ) {
    await this.commandBus.execute(
      new UnbanMemberCommand(chatId, memberId, requesting.id!),
    );
    return { message: 'Member unbanned' };
  }

  @Delete('leave')
  @HttpCode(HttpStatus.OK)
  async leave(@CurrentMember() member: MemberDomain) {
    await this.commandBus.execute(new LeaveChatCommand(member.id!));
    return { message: 'Left the chat' };
  }
}
