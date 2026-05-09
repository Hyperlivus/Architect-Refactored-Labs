import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { ChatNotFoundError, ChatTagTakenError } from './chat.errors';
import { MemberService } from '../member/member.service';
import type { CreateChatDto, UpdateChatDto } from './chat.dto';
import type { PaginationDto } from '../shared/pagination.dto';
import type { Member } from '../member/member.entity';
import { Permission } from '../member/member.enum';
import { InsufficientPermissionsError } from '../member/member.errors';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly repo: Repository<Chat>,
    private readonly memberService: MemberService,
  ) {}

  async create(dto: CreateChatDto, userId: number): Promise<Chat> {
    const existing = await this.repo.findOne({ where: { tag: dto.tag } });
    if (existing) throw new ChatTagTakenError();

    const chat = await this.repo.save(
      this.repo.create({ name: dto.name, tag: dto.tag, description: dto.description ?? null }),
    );
    await this.memberService.createOwner(chat.id, userId);
    return chat;
  }

  async findById(id: number): Promise<Chat> {
    const chat = await this.repo.findOne({ where: { id } });
    if (!chat) throw new ChatNotFoundError();
    return chat;
  }

  async update(chat: Chat, dto: UpdateChatDto, requesting: Member): Promise<Chat> {
    if (!this.memberService.hasPermission(requesting, Permission.EDIT_CHAT_INFO)) {
      throw new InsufficientPermissionsError();
    }
    if (dto.name !== undefined) chat.name = dto.name;
    if (dto.description !== undefined) chat.description = dto.description ?? null;
    return this.repo.save(chat);
  }

  async list(dto: PaginationDto): Promise<{ items: Chat[]; total: number }> {
    const [items, total] = await this.repo.findAndCount({
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
      order: { id: 'DESC' },
    });
    return { items, total };
  }
}
