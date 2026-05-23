import { Inject, Injectable } from '@nestjs/common';
import { CHAT_REPOSITORY } from '../domain/chat.repository.interface';
import type { IChatRepository } from '../domain/chat.repository.interface';
import { ChatNotFoundError } from '../domain/chat.errors';
import { ChatFactory } from '../domain/chat.factory';
import { MemberService } from '../../member/application/member.service';
import type { CreateChatDto, UpdateChatDto } from './chat.dto';
import type { PaginationDto } from '../../shared/pagination.dto';
import type { MemberDomain } from '../../member/domain/member.domain';
import type { ChatDomain } from '../domain/chat.domain';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
    private readonly chatFactory: ChatFactory,
    private readonly memberService: MemberService,
  ) {}

  async create(dto: CreateChatDto, userId: number): Promise<ChatDomain> {
    const chat = await this.chatRepository.create(
      await this.chatFactory.create({
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
    this.chatFactory.edit(requesting);
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
