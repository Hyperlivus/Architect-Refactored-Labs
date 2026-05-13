import { AddMemberHandler } from '../../../../../src/member/application/commands/add-member.handler';
import { AddMemberCommand } from '../../../../../src/member/application/commands/add-member.command';
import { MemberDomain } from '../../../../../src/member/domain/member.domain';
import { DEFAULT_PERMISSIONS, Permission, Role } from '../../../../../src/member/domain/member.enum';
import {
  AlreadyMemberError,
  MemberBannedError,
  MemberNotFoundError,
} from '../../../../../src/member/domain/member.errors';
import { UserNotFoundError } from '../../../../../src/user/domain/user.errors';
import type { IMemberRepository } from '../../../../../src/member/domain/member.repository.interface';
import { MEMBER_REPOSITORY } from '../../../../../src/member/domain/member.repository.interface';
import type { UserService } from '../../../../../src/user/application/user.service';

const mockRepo: jest.Mocked<IMemberRepository> = {
  findById: jest.fn(),
  findByChatAndUser: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockUserService = { findById: jest.fn() } as unknown as UserService;

const makeMember = (
  id: number,
  role = Role.MEMBER,
  overrides: Partial<MemberDomain> = {},
) =>
  new MemberDomain(
    id,
    id * 10,
    5,
    role,
    DEFAULT_PERMISSIONS[role],
    overrides.bannedAt ?? null,
    overrides.leftAt ?? null,
  );

describe('AddMemberHandler', () => {
  let handler: AddMemberHandler;

  beforeEach(() => {
    handler = new AddMemberHandler(mockRepo, mockUserService);
    jest.clearAllMocks();
  });

  it('should add a new member with MEMBER role', async () => {
    const requesting = makeMember(1, Role.ADMIN);
    const newMember = makeMember(20, Role.MEMBER);
    mockRepo.findById.mockResolvedValue(requesting);
    (mockUserService.findById as jest.Mock).mockResolvedValue({ id: 200 });
    mockRepo.findByChatAndUser.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(newMember);

    const result = await handler.execute(
      new AddMemberCommand(5, 200, 1),
    );

    expect(result.role).toBe(Role.MEMBER);
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('should reactivate a previously left member', async () => {
    const requesting = makeMember(1, Role.ADMIN);
    const leftMember = makeMember(20, Role.MEMBER, { leftAt: new Date() });
    mockRepo.findById.mockResolvedValue(requesting);
    (mockUserService.findById as jest.Mock).mockResolvedValue({ id: 200 });
    mockRepo.findByChatAndUser.mockResolvedValue(leftMember);
    mockRepo.save.mockImplementation(async (m) => m);

    const result = await handler.execute(new AddMemberCommand(5, 200, 1));

    expect(result.leftAt).toBeNull();
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should throw MemberBannedError when target is banned', async () => {
    const requesting = makeMember(1, Role.ADMIN);
    mockRepo.findById.mockResolvedValue(requesting);
    (mockUserService.findById as jest.Mock).mockResolvedValue({ id: 200 });
    mockRepo.findByChatAndUser.mockResolvedValue(
      makeMember(20, Role.MEMBER, { bannedAt: new Date() }),
    );

    await expect(
      handler.execute(new AddMemberCommand(5, 200, 1)),
    ).rejects.toThrow(MemberBannedError);
  });

  it('should throw AlreadyMemberError for active member', async () => {
    const requesting = makeMember(1, Role.ADMIN);
    mockRepo.findById.mockResolvedValue(requesting);
    (mockUserService.findById as jest.Mock).mockResolvedValue({ id: 200 });
    mockRepo.findByChatAndUser.mockResolvedValue(makeMember(20));

    await expect(
      handler.execute(new AddMemberCommand(5, 200, 1)),
    ).rejects.toThrow(AlreadyMemberError);
  });

  it('should throw UserNotFoundError when target user does not exist', async () => {
    const requesting = makeMember(1, Role.ADMIN);
    mockRepo.findById.mockResolvedValue(requesting);
    (mockUserService.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      handler.execute(new AddMemberCommand(5, 999, 1)),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should throw MemberNotFoundError when requesting member is not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    (mockUserService.findById as jest.Mock).mockResolvedValue({ id: 200 });
    mockRepo.findByChatAndUser.mockResolvedValue(null);

    await expect(
      handler.execute(new AddMemberCommand(5, 200, 999)),
    ).rejects.toThrow(MemberNotFoundError);
  });
});
