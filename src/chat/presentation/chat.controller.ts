import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../shared/jwt-auth.guard';
import { MemberGuard } from '../../member/presentation/member.guard';
import { RequiresPermission } from '../../member/presentation/requires-permission.decorator';
import { Permission } from '../../member/domain/member.enum';
import { CurrentUser } from '../../shared/current-user.decorator';
import { CurrentMember } from '../../shared/current-member.decorator';
import { PaginationDto } from '../../shared/pagination.dto';
import { CreateChatDto, UpdateChatDto } from '../application/chat.dto';
import { CreateChatCommand } from '../application/commands/create-chat.command';
import { UpdateChatCommand } from '../application/commands/update-chat.command';
import { GetChatQuery } from '../application/queries/get-chat.query';
import { ListChatsQuery } from '../application/queries/list-chats.query';
import type { MemberDomain } from '../../member/domain/member.domain';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateChatDto, @CurrentUser() userId: number) {
    return this.commandBus.execute(
      new CreateChatCommand(dto.name, dto.tag, dto.description, userId),
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query() pagination: PaginationDto) {
    return this.queryBus.execute(
      new ListChatsQuery(pagination.page, pagination.limit),
    );
  }

  @Get(':chatId')
  @UseGuards(JwtAuthGuard, MemberGuard)
  findOne(@Param('chatId', ParseIntPipe) chatId: number) {
    return this.queryBus.execute(new GetChatQuery(chatId));
  }

  @Patch(':chatId')
  @UseGuards(JwtAuthGuard, MemberGuard)
  @RequiresPermission(Permission.EDIT_CHAT_INFO)
  update(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: UpdateChatDto,
    @CurrentMember() _requesting: MemberDomain,
  ) {
    return this.commandBus.execute(
      new UpdateChatCommand(chatId, dto.name, dto.description),
    );
  }
}
