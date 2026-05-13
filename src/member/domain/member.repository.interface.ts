import type { MemberDomain } from './member.domain';

export const MEMBER_REPOSITORY = Symbol('IMemberRepository');

export interface IMemberRepository {
  findById(id: number): Promise<MemberDomain | null>;
  findByChatAndUser(
    chatId: number,
    userId: number,
  ): Promise<MemberDomain | null>;
  save(domain: MemberDomain): Promise<MemberDomain>;
}
