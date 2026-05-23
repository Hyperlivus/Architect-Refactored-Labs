import type { ChatDomain } from '../../domain/chat.domain';

export interface ChatReadModel {
  id: number;
  name: string;
  tag: string;
  description: string | null;
}

export function toChatReadModel(domain: ChatDomain): ChatReadModel {
  return {
    id: domain.id!,
    name: domain.name,
    tag: domain.tag,
    description: domain.description,
  };
}
