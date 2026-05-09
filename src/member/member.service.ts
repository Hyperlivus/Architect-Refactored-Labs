import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './member.entity';
import { DEFAULT_PERMISSIONS, Permission, Role, ROLE_RANK } from './member.enum';
import {
  AlreadyMemberError,
  InsufficientPermissionsError,
  MemberBannedError,
  MemberNotFoundError,
} from './member.errors';
import { UserService } from '../user/user.service';
import { UserNotFoundError } from '../user/user.errors';
import type { AddMemberDto, UpdatePermissionsDto, UpdateRoleDto } from './member.dto';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private readonly repo: Repository<Member>,
    private readonly userService: UserService,
  ) {}

  findByChatAndUser(chatId: number, userId: number): Promise<Member | null> {
    return this.repo.findOne({ where: { chatId, userId } });
  }

  findById(id: number): Promise<Member | null> {
    return this.repo.findOne({ where: { id } });
  }

  hasPermission(member: Member, permission: Permission): boolean {
    return member.role === Role.SUPER_ADMIN || member.permissions.includes(permission);
  }

  // SUPER_ADMIN can act on anyone except themselves
  // ADMIN can only act on MEMBERs
  canActOn(actor: Member, target: Member): boolean {
    if (actor.id === target.id) return false;
    if (actor.role === Role.SUPER_ADMIN) return true;
    return ROLE_RANK[actor.role] > ROLE_RANK[target.role];
  }

  async createOwner(chatId: number, userId: number): Promise<Member> {
    const member = this.repo.create({
      chatId,
      userId,
      role: Role.SUPER_ADMIN,
      permissions: DEFAULT_PERMISSIONS[Role.SUPER_ADMIN],
      bannedAt: null,
      leftAt: null,
    });
    return this.repo.save(member);
  }

  async addMember(chatId: number, dto: AddMemberDto, requesting: Member): Promise<Member> {
    if (!this.hasPermission(requesting, Permission.ADD_MEMBERS)) {
      throw new InsufficientPermissionsError();
    }

    const targetUser = await this.userService.findOne({ id: dto.userId });
    if (!targetUser) throw new UserNotFoundError();

    const existing = await this.findByChatAndUser(chatId, dto.userId);

    if (existing?.bannedAt) throw new MemberBannedError();

    const role = dto.role ?? Role.MEMBER;
    const permissions = dto.permissions ?? DEFAULT_PERMISSIONS[role];

    if (requesting.role !== Role.SUPER_ADMIN && ROLE_RANK[role] >= ROLE_RANK[requesting.role]) {
      throw new InsufficientPermissionsError('Cannot assign a role equal to or higher than your own');
    }

    // Re-join: reactivate the existing record
    if (existing?.leftAt) {
      existing.leftAt = null;
      existing.role = role;
      existing.permissions = permissions;
      return this.repo.save(existing);
    }

    if (existing) throw new AlreadyMemberError();

    const member = this.repo.create({
      chatId,
      userId: dto.userId,
      role,
      permissions,
      bannedAt: null,
      leftAt: null,
    });
    return this.repo.save(member);
  }

  async ban(targetMember: Member, requesting: Member): Promise<void> {
    if (!this.hasPermission(requesting, Permission.BAN_MEMBERS)) {
      throw new InsufficientPermissionsError();
    }
    if (!this.canActOn(requesting, targetMember)) {
      throw new InsufficientPermissionsError('Cannot ban a member with equal or higher role');
    }
    if (targetMember.bannedAt) return;

    targetMember.bannedAt = new Date();
    await this.repo.save(targetMember);
  }

  async unban(targetMember: Member, requesting: Member): Promise<void> {
    if (!this.hasPermission(requesting, Permission.BAN_MEMBERS)) {
      throw new InsufficientPermissionsError();
    }
    if (!this.canActOn(requesting, targetMember)) {
      throw new InsufficientPermissionsError('Cannot unban a member with equal or higher role');
    }

    targetMember.bannedAt = null;
    await this.repo.save(targetMember);
  }

  async leave(member: Member): Promise<void> {
    member.leftAt = new Date();
    await this.repo.save(member);
  }

  async updatePermissions(
    targetMember: Member,
    dto: UpdatePermissionsDto,
    requesting: Member,
  ): Promise<Member> {
    if (!this.hasPermission(requesting, Permission.EDIT_PERMISSIONS)) {
      throw new InsufficientPermissionsError();
    }
    if (!this.canActOn(requesting, targetMember)) {
      throw new InsufficientPermissionsError('Cannot edit permissions of a member with equal or higher role');
    }

    targetMember.permissions = dto.permissions;
    return this.repo.save(targetMember);
  }

  async updateRole(
    targetMember: Member,
    dto: UpdateRoleDto,
    requesting: Member,
  ): Promise<Member> {
    if (!this.hasPermission(requesting, Permission.EDIT_PERMISSIONS)) {
      throw new InsufficientPermissionsError();
    }
    if (!this.canActOn(requesting, targetMember)) {
      throw new InsufficientPermissionsError('Cannot change role of a member with equal or higher role');
    }
    if (requesting.role !== Role.SUPER_ADMIN && ROLE_RANK[dto.role] >= ROLE_RANK[requesting.role]) {
      throw new InsufficientPermissionsError('Cannot assign a role equal to or higher than your own');
    }

    targetMember.role = dto.role;
    targetMember.permissions = DEFAULT_PERMISSIONS[dto.role];
    return this.repo.save(targetMember);
  }

  async getTargetMember(chatId: number, memberId: number): Promise<Member> {
    const target = await this.findById(memberId);
    if (!target || target.chatId !== chatId) throw new MemberNotFoundError();
    return target;
  }
}
