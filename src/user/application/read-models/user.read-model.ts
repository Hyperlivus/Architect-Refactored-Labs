import type { UserDomain } from '../../domain/user.domain';

export class UserReadModel {
  id: number;
  email: string;
  nickname: string;
  tag: string;
  emailVerified: boolean;
}

export function toUserReadModel(domain: UserDomain): UserReadModel {
  return {
    id: domain.id!,
    email: domain.email,
    nickname: domain.nickname,
    tag: domain.tag,
    emailVerified: domain.emailVerified,
  };
}
