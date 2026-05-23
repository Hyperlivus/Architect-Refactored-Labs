import { User } from './user.entity';
import { UserDomain } from '../domain/user.domain';

export class UserMapper {
  static toDomain(entity: User): UserDomain {
    return new UserDomain(
      entity.id,
      entity.email,
      entity.nickname,
      entity.tag,
      entity.passwordHash,
      entity.emailVerified,
      entity.otp,
    );
  }

  static toEntity(domain: UserDomain): {
    id?: number;
    email: string;
    nickname: string;
    tag: string;
    passwordHash: string;
    emailVerified: boolean;
    otp: string | null;
  } {
    return {
      ...(domain.id !== undefined && { id: domain.id }),
      email: domain.email,
      nickname: domain.nickname,
      tag: domain.tag,
      passwordHash: domain.passwordHash,
      emailVerified: domain.emailVerified,
      otp: domain.otp,
    };
  }
}
