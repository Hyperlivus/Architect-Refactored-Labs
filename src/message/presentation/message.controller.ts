import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessageService } from '../application/message.service';
import { SendMessageDto } from '../application/message.dto';
import { JwtAuthGuard } from '../../shared/jwt-auth.guard';
import { MemberGuard } from '../../member/presentation/member.guard';
import { RequiresPermission } from '../../member/presentation/requires-permission.decorator';
import { Permission } from '../../member/domain/member.enum';
import { CurrentMember } from '../../shared/current-member.decorator';
import { PaginationDto } from '../../shared/pagination.dto';
import type { MemberDomain } from '../../member/domain/member.domain';

@Controller('chat/:chatId/messages')
@UseGuards(JwtAuthGuard, MemberGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @RequiresPermission(Permission.SEND_MESSAGES)
  send(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: SendMessageDto,
    @CurrentMember() member: MemberDomain,
  ) {
    return this.messageService.send(chatId, dto, member);
  }

  @Get()
  list(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query() pagination: PaginationDto,
  ) {
    return this.messageService.list(chatId, pagination);
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @CurrentMember() member: MemberDomain,
  ) {
    await this.messageService.delete(messageId, chatId, member);
    return { message: 'Message deleted' };
  }
}
