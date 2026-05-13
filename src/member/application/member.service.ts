import { Inject, Injectable } from '@nestjs/common';
import { MEMBER_REPOSITORY } from '../domain/member.repository.interface';
import type { IMemberRepository } from '../domain/member.repository.interface';
import {
  DEFAULT_PERMISSIONS,
  Permission,
  Role,
  ROLE_RANK,
} from '../domain/member.enum';
import {
  AlreadyMemberError,
  InsufficientPermissionsError,
  MemberBannedError,
  MemberNotFoundError,
} from '../domain/member.errors';
import { UserService } from '../../user/application/user.service';
import { UserNotFoundError } from '../../user/domain/user.errors';
import type {
  AddMemberDto,
  UpdatePermissionsDto,
  UpdateRoleDto,
} from './member.dto';
import { MemberFactory } from '../domain/member.factory';
import type { MemberDomain } from '../domain/member.domain';

@Injectable()
export class MemberService {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
    private readonly userService: UserService,
  ) {}

  findByChatAndUser(
    chatId: number,
    userId: number,
  ): Promise<MemberDomain | null> {
    return this.memberRepository.findByChatAndUser(chatId, userId);
  }

  findById(id: number): Promise<MemberDomain | null> {
    return this.memberRepository.findById(id);
  }

  async createOwner(chatId: number, userId: number): Promise<MemberDomain> {
    return this.memberRepository.create(
      MemberFactory.createOwner(chatId, userId),
    );
  }

  async addMember(
    chatId: number,
    dto: AddMemberDto,
    requesting: MemberDomain,
  ): Promise<MemberDomain> {
    if (!requesting.hasPermission(Permission.ADD_MEMBERS)) {
      throw new InsufficientPermissionsError();
    }

    const targetUser = await this.userService.findById(dto.userId);
    if (!targetUser) throw new UserNotFoundError();

    const existing = await this.findByChatAndUser(chatId, dto.userId);

    if (existing?.isBanned()) throw new MemberBannedError();

    const role = dto.role ?? Role.MEMBER;

    if (
      requesting.role !== Role.SUPER_ADMIN &&
      ROLE_RANK[role] >= ROLE_RANK[requesting.role]
    ) {
      throw new InsufficientPermissionsError(
        'Cannot assign a role equal to or higher than your own',
      );
    }

    const data = MemberFactory.create({
      chatId,
      userId: dto.userId,
      role,
      permissions: dto.permissions,
    });

    if (existing?.hasLeft()) {
      existing.leftAt = null;
      existing.role = data.role;
      existing.permissions = data.permissions;
      return this.memberRepository.save(existing);
    }

    if (existing) throw new AlreadyMemberError();

    return this.memberRepository.create(data);
  }

  async ban(
    targetMember: MemberDomain,
    requesting: MemberDomain,
  ): Promise<void> {
    if (!requesting.hasPermission(Permission.BAN_MEMBERS)) {
      throw new InsufficientPermissionsError();
    }
    if (!requesting.canActOn(targetMember)) {
      throw new InsufficientPermissionsError(
        'Cannot ban a member with equal or higher role',
      );
    }
    if (targetMember.isBanned()) return;

    targetMember.ban();
    await this.memberRepository.save(targetMember);
  }

  async unban(
    targetMember: MemberDomain,
    requesting: MemberDomain,
  ): Promise<void> {
    if (!requesting.hasPermission(Permission.BAN_MEMBERS)) {
      throw new InsufficientPermissionsError();
    }
    if (!requesting.canActOn(targetMember)) {
      throw new InsufficientPermissionsError(
        'Cannot unban a member with equal or higher role',
      );
    }

    targetMember.unban();
    await this.memberRepository.save(targetMember);
  }

  async leave(member: MemberDomain): Promise<void> {
    member.leave();
    await this.memberRepository.save(member);
  }

  async updatePermissions(
    targetMember: MemberDomain,
    dto: UpdatePermissionsDto,
    requesting: MemberDomain,
  ): Promise<MemberDomain> {
    if (!requesting.hasPermission(Permission.EDIT_PERMISSIONS)) {
      throw new InsufficientPermissionsError();
    }
    if (!requesting.canActOn(targetMember)) {
      throw new InsufficientPermissionsError(
        'Cannot edit permissions of a member with equal or higher role',
      );
    }

    targetMember.permissions = dto.permissions;
    return this.memberRepository.save(targetMember);
  }

  async updateRole(
    targetMember: MemberDomain,
    dto: UpdateRoleDto,
    requesting: MemberDomain,
  ): Promise<MemberDomain> {
    if (!requesting.hasPermission(Permission.EDIT_PERMISSIONS)) {
      throw new InsufficientPermissionsError();
    }
    if (!requesting.canActOn(targetMember)) {
      throw new InsufficientPermissionsError(
        'Cannot change role of a member with equal or higher role',
      );
    }
    if (
      requesting.role !== Role.SUPER_ADMIN &&
      ROLE_RANK[dto.role] >= ROLE_RANK[requesting.role]
    ) {
      throw new InsufficientPermissionsError(
        'Cannot assign a role equal to or higher than your own',
      );
    }

    targetMember.setRole(dto.role, DEFAULT_PERMISSIONS[dto.role]);
    return this.memberRepository.save(targetMember);
  }

  async getTargetMember(
    chatId: number,
    memberId: number,
  ): Promise<MemberDomain> {
    const target = await this.findById(memberId);
    if (!target || target.chatId !== chatId) throw new MemberNotFoundError();
    return target;
  }
}
