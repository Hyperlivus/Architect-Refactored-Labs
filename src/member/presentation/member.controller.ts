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
import { MemberService } from '../application/member.service';
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
import type { MemberDomain } from '../domain/member.domain';

@Controller('chat/:chatId/members')
@UseGuards(JwtAuthGuard, MemberGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @RequiresPermission(Permission.ADD_MEMBERS)
  addMember(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: AddMemberDto,
    @CurrentMember() requesting: MemberDomain,
  ) {
    return this.memberService.addMember(chatId, dto, requesting);
  }

  @Patch(':memberId/permissions')
  @RequiresPermission(Permission.EDIT_PERMISSIONS)
  async updatePermissions(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdatePermissionsDto,
    @CurrentMember() requesting: MemberDomain,
  ) {
    const target = await this.memberService.getTargetMember(chatId, memberId);
    return this.memberService.updatePermissions(target, dto, requesting);
  }

  @Patch(':memberId/role')
  @RequiresPermission(Permission.EDIT_PERMISSIONS)
  async updateRole(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateRoleDto,
    @CurrentMember() requesting: MemberDomain,
  ) {
    const target = await this.memberService.getTargetMember(chatId, memberId);
    return this.memberService.updateRole(target, dto, requesting);
  }

  @Patch(':memberId/ban')
  @RequiresPermission(Permission.BAN_MEMBERS)
  async ban(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentMember() requesting: MemberDomain,
  ) {
    const target = await this.memberService.getTargetMember(chatId, memberId);
    await this.memberService.ban(target, requesting);
    return { message: 'Member banned' };
  }

  @Patch(':memberId/unban')
  @RequiresPermission(Permission.BAN_MEMBERS)
  async unban(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentMember() requesting: MemberDomain,
  ) {
    const target = await this.memberService.getTargetMember(chatId, memberId);
    await this.memberService.unban(target, requesting);
    return { message: 'Member unbanned' };
  }

  @Delete('leave')
  @HttpCode(HttpStatus.OK)
  async leave(@CurrentMember() member: MemberDomain) {
    await this.memberService.leave(member);
    return { message: 'Left the chat' };
  }
}
