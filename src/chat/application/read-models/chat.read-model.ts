import type { ChatDomain } from '../../domain/chat.domain';

export class ChatReadModel {
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
