import type { MessageDomain } from './message.domain';

export const MESSAGE_REPOSITORY = Symbol('IMessageRepository');

export interface IMessageRepository {
  findActiveById(id: number, chatId: number): Promise<MessageDomain | null>;
  create(domain: MessageDomain): Promise<MessageDomain>;
  save(domain: MessageDomain): Promise<MessageDomain>;
  list(
    chatId: number,
    skip: number,
    take: number,
  ): Promise<{ items: MessageDomain[]; total: number }>;
}
