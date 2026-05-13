import { Inject, Injectable } from '@nestjs/common';
import { CHAT_REPOSITORY } from '../domain/chat.repository.interface';
import type { IChatRepository } from '../domain/chat.repository.interface';
import { ChatNotFoundError, ChatTagTakenError } from '../domain/chat.errors';
import { ChatFactory } from '../domain/chat.factory';
import { MemberService } from '../../member/application/member.service';
import { Permission } from '../../member/domain/member.enum';
import { InsufficientPermissionsError } from '../../member/domain/member.errors';
import type { CreateChatDto, UpdateChatDto } from './chat.dto';
import type { PaginationDto } from '../../shared/pagination.dto';
import type { MemberDomain } from '../../member/domain/member.domain';
import type { ChatDomain } from '../domain/chat.domain';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
    private readonly memberService: MemberService,
  ) {}

  async create(dto: CreateChatDto, userId: number): Promise<ChatDomain> {
    const existing = await this.chatRepository.findByTag(dto.tag);
    if (existing) throw new ChatTagTakenError();

    const chat = await this.chatRepository.create(
      ChatFactory.create({
        name: dto.name,
        tag: dto.tag,
        description: dto.description,
      }),
    );
    await this.memberService.createOwner(chat.id!, userId);
    return chat;
  }

  async findById(id: number): Promise<ChatDomain> {
    const chat = await this.chatRepository.findById(id);
    if (!chat) throw new ChatNotFoundError();
    return chat;
  }

  async update(
    chat: ChatDomain,
    dto: UpdateChatDto,
    requesting: MemberDomain,
  ): Promise<ChatDomain> {
    if (!requesting.hasPermission(Permission.EDIT_CHAT_INFO)) {
      throw new InsufficientPermissionsError();
    }
    chat.updateInfo({
      name: dto.name,
      description:
        dto.description !== undefined ? (dto.description ?? null) : undefined,
    });
    return this.chatRepository.save(chat);
  }

  async list(
    dto: PaginationDto,
  ): Promise<{ items: ChatDomain[]; total: number }> {
    return this.chatRepository.list((dto.page - 1) * dto.limit, dto.limit);
  }
}
