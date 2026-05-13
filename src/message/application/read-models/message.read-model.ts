import type { MessageDomain } from '../../domain/message.domain';

export class MessageReadModel {
  id: number;
  content: string;
  chatId: number;
  memberId: number;
  createdAt: Date;
}

export function toMessageReadModel(domain: MessageDomain): MessageReadModel {
  return {
    id: domain.id!,
    content: domain.content,
    chatId: domain.chatId,
    memberId: domain.memberId,
    createdAt: domain.createdAt!,
  };
}
