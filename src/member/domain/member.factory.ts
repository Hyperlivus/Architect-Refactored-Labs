import { DomainError } from '../../shared/domain.error';
import { DEFAULT_PERMISSIONS, Permission, Role } from './member.enum';
import { MemberDomain } from './member.domain';

export class InvalidMemberDataError extends DomainError {
  constructor(reason: string) {
    super(reason);
  }
}

export class MemberFactory {
  static createOwner(chatId: number, userId: number): MemberDomain {
    return new MemberDomain(
      undefined,
      userId,
      chatId,
      Role.SUPER_ADMIN,
      DEFAULT_PERMISSIONS[Role.SUPER_ADMIN],
      null,
      null,
    );
  }

  static create(params: {
    chatId: number;
    userId: number;
    role: Role;
    permissions?: Permission[];
  }): MemberDomain {
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

    return new MemberDomain(
      undefined,
      params.userId,
      params.chatId,
      params.role,
      permissions,
      null,
      null,
    );
  }
}
