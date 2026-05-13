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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../shared/jwt-auth.guard';
import { MemberGuard } from '../../member/presentation/member.guard';
import { RequiresPermission } from '../../member/presentation/requires-permission.decorator';
import { Permission } from '../../member/domain/member.enum';
import { CurrentMember } from '../../shared/current-member.decorator';
import { PaginationDto } from '../../shared/pagination.dto';
import { SendMessageDto, ScheduleMessageDto } from '../application/message.dto';
import { SendMessageCommand } from '../application/commands/send-message.command';
import { DeleteMessageCommand } from '../application/commands/delete-message.command';
import { ScheduleMessageCommand } from '../application/commands/schedule-message.command';
import { ListMessagesQuery } from '../application/queries/list-messages.query';
import type { MemberDomain } from '../../member/domain/member.domain';

@Controller('chat/:chatId/messages')
@UseGuards(JwtAuthGuard, MemberGuard)
export class MessageController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequiresPermission(Permission.SEND_MESSAGES)
  send(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: SendMessageDto,
    @CurrentMember() member: MemberDomain,
  ) {
    return this.commandBus.execute(
      new SendMessageCommand(chatId, dto.content, member.id!),
    );
  }

  @Get()
  list(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query() pagination: PaginationDto,
  ) {
    return this.queryBus.execute(
      new ListMessagesQuery(chatId, pagination.page, pagination.limit),
    );
  }

  @Post('schedule')
  @RequiresPermission(Permission.SEND_MESSAGES)
  schedule(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: ScheduleMessageDto,
    @CurrentMember() member: MemberDomain,
  ) {
    return this.commandBus.execute(
      new ScheduleMessageCommand(
        chatId,
        dto.content,
        member.id!,
        new Date(dto.scheduledAt),
      ),
    );
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @CurrentMember() member: MemberDomain,
  ) {
    await this.commandBus.execute(
      new DeleteMessageCommand(messageId, chatId, member.id!),
    );
    return { message: 'Message deleted' };
  }
}
