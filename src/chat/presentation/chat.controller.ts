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
import { ChatService } from '../application/chat.service';
import { CreateChatDto, UpdateChatDto } from '../application/chat.dto';
import { JwtAuthGuard } from '../../shared/jwt-auth.guard';
import { MemberGuard } from '../../member/presentation/member.guard';
import { RequiresPermission } from '../../member/presentation/requires-permission.decorator';
import { Permission } from '../../member/domain/member.enum';
import { CurrentUser } from '../../shared/current-user.decorator';
import { CurrentMember } from '../../shared/current-member.decorator';
import { PaginationDto } from '../../shared/pagination.dto';
import type { MemberDomain } from '../../member/domain/member.domain';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateChatDto, @CurrentUser() userId: number) {
    return this.chatService.create(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query() pagination: PaginationDto) {
    return this.chatService.list(pagination);
  }

  @Get(':chatId')
  @UseGuards(JwtAuthGuard, MemberGuard)
  findOne(@Param('chatId', ParseIntPipe) chatId: number) {
    return this.chatService.findById(chatId);
  }

  @Patch(':chatId')
  @UseGuards(JwtAuthGuard, MemberGuard)
  @RequiresPermission(Permission.EDIT_CHAT_INFO)
  async update(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() dto: UpdateChatDto,
    @CurrentMember() requesting: MemberDomain,
  ) {
    const chat = await this.chatService.findById(chatId);
    return this.chatService.update(chat, dto, requesting);
  }
}
