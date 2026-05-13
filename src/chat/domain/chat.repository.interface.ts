import type { ChatDomain } from './chat.domain';

export const CHAT_REPOSITORY = Symbol('IChatRepository');

export interface IChatRepository {
  findById(id: number): Promise<ChatDomain | null>;
  findByTag(tag: string): Promise<ChatDomain | null>;
  create(domain: ChatDomain): Promise<ChatDomain>;
  save(domain: ChatDomain): Promise<ChatDomain>;
  list(
    skip: number,
    take: number,
  ): Promise<{ items: ChatDomain[]; total: number }>;
}
