import { DomainError } from '../shared/domain.error';
import { DEFAULT_PERMISSIONS, Permission, Role } from './member.enum';

export class InvalidMemberDataError extends DomainError {
  readonly statusCode = 422;
  constructor(reason: string) {
    super(reason);
  }
}

export class MemberFactory {
  static createOwner(chatId: number, userId: number) {
    return {
      chatId,
      userId,
      role: Role.SUPER_ADMIN,
      permissions: DEFAULT_PERMISSIONS[Role.SUPER_ADMIN],
      bannedAt: null,
      leftAt: null,
    };
  }

  static create(params: {
    chatId: number;
    userId: number;
    role: Role;
    permissions?: Permission[];
  }) {
    const permissions = params.permissions ?? DEFAULT_PERMISSIONS[params.role];

    if (params.role !== Role.SUPER_ADMIN) {
      const allowed = DEFAULT_PERMISSIONS[params.role];
      const invalid = permissions.filter((p) => !allowed.includes(p));
      if (invalid.length) {
        throw new InvalidMemberDataError(
          `Permissions [${invalid.join(', ')}] are not allowed for role "${params.role}"`,
        );
      }
    }

    return {
      chatId: params.chatId,
      userId: params.userId,
      role: params.role,
      permissions,
      bannedAt: null,
      leftAt: null,
    };
  }
}
