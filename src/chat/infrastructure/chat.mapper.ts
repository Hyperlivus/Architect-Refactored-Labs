import { Chat } from './chat.entity';
import { ChatDomain } from '../domain/chat.domain';

export class ChatMapper {
  static toDomain(entity: Chat): ChatDomain {
    return new ChatDomain(
      entity.id,
      entity.name,
      entity.tag,
      entity.description,
    );
  }

  static toEntity(domain: ChatDomain): {
    id?: number;
    name: string;
    tag: string;
    description: string | null;
  } {
    return {
      ...(domain.id !== undefined && { id: domain.id }),
      name: domain.name,
      tag: domain.tag,
      description: domain.description,
    };
  }
}
