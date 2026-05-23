import { Inject, Injectable } from '@nestjs/common';
import { MEMBER_REPOSITORY } from '../domain/member.repository.interface';
import type { IMemberRepository } from '../domain/member.repository.interface';
import { MemberNotFoundError } from '../domain/member.errors';
import { MemberFactory } from '../domain/member.factory';
import type {
  AddMemberDto,
  UpdatePermissionsDto,
  UpdateRoleDto,
} from './member.dto';
import type { MemberDomain } from '../domain/member.domain';

@Injectable()
export class MemberService {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
    private readonly memberFactory: MemberFactory,
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
      this.memberFactory.createOwner(chatId, userId),
    );
  }

  async addMember(
    chatId: number,
    dto: AddMemberDto,
    requesting: MemberDomain,
  ): Promise<MemberDomain> {
    const member = await this.memberFactory.add(chatId, dto, requesting);
    return member.id !== undefined
      ? this.memberRepository.save(member)
      : this.memberRepository.create(member);
  }

  async ban(
    targetMember: MemberDomain,
    requesting: MemberDomain,
  ): Promise<void> {
    const changed = this.memberFactory.ban(targetMember, requesting);
    if (changed) await this.memberRepository.save(targetMember);
  }

  async unban(
    targetMember: MemberDomain,
    requesting: MemberDomain,
  ): Promise<void> {
    this.memberFactory.unban(targetMember, requesting);
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
    this.memberFactory.updatePermissions(
      targetMember,
      dto.permissions,
      requesting,
    );
    return this.memberRepository.save(targetMember);
  }

  async updateRole(
    targetMember: MemberDomain,
    dto: UpdateRoleDto,
    requesting: MemberDomain,
  ): Promise<MemberDomain> {
    this.memberFactory.updateRole(targetMember, dto.role, requesting);
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
