import { Message } from './message.entity';
import { MessageDomain } from '../domain/message.domain';

export class MessageMapper {
  static toDomain(entity: Message): MessageDomain {
    return new MessageDomain(
      entity.id,
      entity.content,
      entity.chatId,
      entity.memberId,
      entity.createdAt,
      entity.deletedAt,
    );
  }

  static toEntity(domain: MessageDomain): {
    id?: number;
    content: string;
    chatId: number;
    memberId: number;
    createdAt?: Date;
    deletedAt: Date | null;
  } {
    return {
      ...(domain.id !== undefined && { id: domain.id }),
      content: domain.content,
      chatId: domain.chatId,
      memberId: domain.memberId,
      ...(domain.createdAt !== undefined && { createdAt: domain.createdAt }),
      deletedAt: domain.deletedAt,
    };
  }
}
