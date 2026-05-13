import type { MemberDomain } from '../../domain/member.domain';
import type { Permission, Role } from '../../domain/member.enum';

export class MemberReadModel {
  id: number;
  userId: number;
  chatId: number;
  role: Role;
  permissions: Permission[];
  bannedAt: Date | null;
  leftAt: Date | null;
}

export function toMemberReadModel(domain: MemberDomain): MemberReadModel {
  return {
    id: domain.id!,
    userId: domain.userId,
    chatId: domain.chatId,
    role: domain.role,
    permissions: domain.permissions,
    bannedAt: domain.bannedAt,
    leftAt: domain.leftAt,
  };
}
