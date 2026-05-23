import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../shared/domain.error';
import {
  DEFAULT_PERMISSIONS,
  Permission,
  Role,
  ROLE_RANK,
} from './member.enum';
import { MemberDomain } from './member.domain';
import {
  MEMBER_REPOSITORY,
  IMemberRepository,
} from './member.repository.interface';
import {
  AlreadyMemberError,
  InsufficientPermissionsError,
  MemberBannedError,
} from './member.errors';
import { UserService } from '../../user/application/user.service';
import { UserNotFoundError } from '../../user/domain/user.errors';

export class InvalidMemberDataError extends DomainError {
  constructor(reason: string) {
    super(reason);
  }
}

export interface AddMemberParams {
  userId: number;
  role?: Role;
  permissions?: Permission[];
}

@Injectable()
export class MemberFactory {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
    private readonly userService: UserService,
  ) {}

  createOwner(chatId: number, userId: number): MemberDomain {
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

  async add(
    chatId: number,
    params: AddMemberParams,
    requesting: MemberDomain,
  ): Promise<MemberDomain> {
    if (!requesting.hasPermission(Permission.ADD_MEMBERS)) {
      throw new InsufficientPermissionsError();
    }

    const targetUser = await this.userService.findById(params.userId);
    if (!targetUser) throw new UserNotFoundError();

    const existing = await this.memberRepository.findByChatAndUser(
      chatId,
      params.userId,
    );
    if (existing?.isBanned()) throw new MemberBannedError();

    const role = params.role ?? Role.MEMBER;

    if (
      requesting.role !== Role.SUPER_ADMIN &&
      ROLE_RANK[role] >= ROLE_RANK[requesting.role]
    ) {
      throw new InsufficientPermissionsError(
        'Cannot assign a role equal to or higher than your own',
      );
    }

    const permissions = params.permissions ?? DEFAULT_PERMISSIONS[role];
    if (role !== Role.SUPER_ADMIN) {
      const allowed = DEFAULT_PERMISSIONS[role];
      const invalid = permissions.filter((p) => !allowed.includes(p));
      if (invalid.length) {
        throw new InvalidMemberDataError(
          `Permissions [${invalid.join(', ')}] are not allowed for role "${role}"`,
        );
      }
    }

    if (existing?.hasLeft()) {
      existing.rejoin(role, permissions);
      return existing;
    }

    if (existing) throw new AlreadyMemberError();

    return new MemberDomain(
      undefined,
      params.userId,
      chatId,
      role,
      permissions,
      null,
      null,
    );
  }

  ban(target: MemberDomain, requesting: MemberDomain): boolean {
    if (!requesting.hasPermission(Permission.BAN_MEMBERS)) {
      throw new InsufficientPermissionsError();
    }
    if (!requesting.canActOn(target)) {
      throw new InsufficientPermissionsError(
        'Cannot ban a member with equal or higher role',
      );
    }
    if (target.isBanned()) return false;
    target.ban();
    return true;
  }

  unban(target: MemberDomain, requesting: MemberDomain): void {
    if (!requesting.hasPermission(Permission.BAN_MEMBERS)) {
      throw new InsufficientPermissionsError();
    }
    if (!requesting.canActOn(target)) {
      throw new InsufficientPermissionsError(
        'Cannot unban a member with equal or higher role',
      );
    }
    target.unban();
  }

  updatePermissions(
    target: MemberDomain,
    permissions: Permission[],
    requesting: MemberDomain,
  ): void {
    if (!requesting.hasPermission(Permission.EDIT_PERMISSIONS)) {
      throw new InsufficientPermissionsError();
    }
    if (!requesting.canActOn(target)) {
      throw new InsufficientPermissionsError(
        'Cannot edit permissions of a member with equal or higher role',
      );
    }
    target.updatePermissions(permissions);
  }

  updateRole(target: MemberDomain, role: Role, requesting: MemberDomain): void {
    if (!requesting.hasPermission(Permission.EDIT_PERMISSIONS)) {
      throw new InsufficientPermissionsError();
    }
    if (!requesting.canActOn(target)) {
      throw new InsufficientPermissionsError(
        'Cannot change role of a member with equal or higher role',
      );
    }
    if (
      requesting.role !== Role.SUPER_ADMIN &&
      ROLE_RANK[role] >= ROLE_RANK[requesting.role]
    ) {
      throw new InsufficientPermissionsError(
        'Cannot assign a role equal to or higher than your own',
      );
    }
    target.setRole(role, DEFAULT_PERMISSIONS[role]);
  }
}
