import { Member } from './member.entity';
import { MemberDomain } from '../domain/member.domain';
import { Permission, Role } from '../domain/member.enum';

export class MemberMapper {
  static toDomain(entity: Member): MemberDomain {
    return new MemberDomain(
      entity.id,
      entity.userId,
      entity.chatId,
      entity.role,
      entity.permissions,
      entity.bannedAt,
      entity.leftAt,
    );
  }

  static toEntity(domain: MemberDomain): {
    id?: number;
    userId: number;
    chatId: number;
    role: Role;
    permissions: Permission[];
    bannedAt: Date | null;
    leftAt: Date | null;
  } {
    return {
      ...(domain.id !== undefined && { id: domain.id }),
      userId: domain.userId,
      chatId: domain.chatId,
      role: domain.role,
      permissions: domain.permissions,
      bannedAt: domain.bannedAt,
      leftAt: domain.leftAt,
    };
  }
}
