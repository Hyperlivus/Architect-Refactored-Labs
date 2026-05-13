import type { UserDomain } from './user.domain';

export const USER_REPOSITORY = Symbol('IUserRepository');

export interface IUserRepository {
  findById(id: number): Promise<UserDomain | null>;
  findByEmail(email: string): Promise<UserDomain | null>;
  findByTag(tag: string): Promise<UserDomain | null>;
  create(domain: UserDomain): Promise<UserDomain>;
  save(domain: UserDomain): Promise<void>;
}
