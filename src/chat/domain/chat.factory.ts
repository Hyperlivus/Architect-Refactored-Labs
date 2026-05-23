import { Inject, Injectable } from '@nestjs/common';
import { InvalidChatDataError, ChatTagTakenError } from './chat.errors';
import { ChatDomain } from './chat.domain';
import { CHAT_REPOSITORY, IChatRepository } from './chat.repository.interface';
import type { MemberDomain } from '../../member/domain/member.domain';
import { Permission } from '../../member/domain/member.enum';
import { InsufficientPermissionsError } from '../../member/domain/member.errors';

export interface CreateChatParams {
  name: string;
  tag: string;
  description?: string | null;
}

@Injectable()
export class ChatFactory {
  private static readonly TAG_REGEX = /^[a-zA-Z0-9_]{3,32}$/;

  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
  ) {}

  async create(params: CreateChatParams): Promise<ChatDomain> {
    if (params.name.length < 2 || params.name.length > 100) {
      throw new InvalidChatDataError(
        'Chat name must be between 2 and 100 characters',
      );
    }
    if (!ChatFactory.TAG_REGEX.test(params.tag)) {
      throw new InvalidChatDataError(
        'Tag must be 3-32 alphanumeric characters or underscores',
      );
    }
    if (params.description && params.description.length > 500) {
      throw new InvalidChatDataError(
        'Description must not exceed 500 characters',
      );
    }

    const existing = await this.chatRepository.findByTag(params.tag);
    if (existing) throw new ChatTagTakenError();

    return new ChatDomain(
      undefined,
      params.name,
      params.tag,
      params.description ?? null,
    );
  }

  edit(requesting: MemberDomain): void {
    if (!requesting.hasPermission(Permission.EDIT_CHAT_INFO)) {
      throw new InsufficientPermissionsError();
    }
  }
}
