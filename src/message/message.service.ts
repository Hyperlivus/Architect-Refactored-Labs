import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Message } from './message.entity';
import { MessageNotFoundError } from './message.errors';
import { InsufficientPermissionsError } from '../member/member.errors';
import { MemberService } from '../member/member.service';
import { Permission } from '../member/member.enum';
import type { Member } from '../member/member.entity';
import type { SendMessageDto } from './message.dto';
import { MessageFactory } from './message.factory';
import type { PaginationDto } from '../shared/pagination.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly repo: Repository<Message>,
    private readonly memberService: MemberService,
  ) {}

  async send(chatId: number, dto: SendMessageDto, member: Member): Promise<Message> {
    const data = MessageFactory.create({ content: dto.content, chatId, memberId: member.id });
    return this.repo.save(this.repo.create(data));
  }

  async list(
    chatId: number,
    dto: PaginationDto,
  ): Promise<{ items: Message[]; total: number }> {
    const [items, total] = await this.repo.findAndCount({
      where: { chatId, deletedAt: IsNull() },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  async delete(messageId: number, chatId: number, requesting: Member): Promise<void> {
    const message = await this.repo.findOne({ where: { id: messageId, chatId } });
    if (!message || message.deletedAt) throw new MessageNotFoundError();

    const isOwner = message.memberId === requesting.id;
    const canDelete = this.memberService.hasPermission(requesting, Permission.DELETE_MESSAGES);

    if (!isOwner && !canDelete) {
      throw new InsufficientPermissionsError('You can only delete your own messages');
    }

    message.deletedAt = new Date();
    await this.repo.save(message);
  }
}
