import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from '../../src/member/application/member.service';
import {
  MEMBER_REPOSITORY,
  IMemberRepository,
} from '../../src/member/domain/member.repository.interface';
import { MemberFactory } from '../../src/member/domain/member.factory';
import { MemberDomain } from '../../src/member/domain/member.domain';
import {
  DEFAULT_PERMISSIONS,
  Permission,
  Role,
} from '../../src/member/domain/member.enum';
import {
  AlreadyMemberError,
  InsufficientPermissionsError,
  MemberBannedError,
  MemberNotFoundError,
} from '../../src/member/domain/member.errors';
import { UserNotFoundError } from '../../src/user/domain/user.errors';

const mockMemberRepo: Partial<IMemberRepository> = {
  findByChatAndUser: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockMemberFactory = {
  createOwner: jest.fn(),
  add: jest.fn(),
  ban: jest.fn(),
  prepareUnban: jest.fn(),
  updatePermissions: jest.fn(),
  updateRole: jest.fn(),
};

const make = (
  overrides: {
    id?: number;
    userId?: number;
    chatId?: number;
    role?: Role;
    permissions?: Permission[];
    bannedAt?: Date | null;
    leftAt?: Date | null;
  } = {},
): MemberDomain =>
  new MemberDomain(
    overrides.id ?? 10,
    overrides.userId ?? 1,
    overrides.chatId ?? 5,
    overrides.role ?? Role.MEMBER,
    overrides.permissions ?? [Permission.SEND_MESSAGES],
    overrides.bannedAt ?? null,
    overrides.leftAt ?? null,
  );

describe('MemberService', () => {
  let service: MemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: MEMBER_REPOSITORY, useValue: mockMemberRepo },
        { provide: MemberFactory, useValue: mockMemberFactory },
      ],
    }).compile();

    service = module.get(MemberService);
    jest.clearAllMocks();
  });

  describe('addMember', () => {
    const requesting = make({
      id: 1,
      role: Role.ADMIN,
      permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
    });

    it('should create a new member with default MEMBER role', async () => {
      const newMember = new MemberDomain(
        undefined,
        2,
        5,
        Role.MEMBER,
        DEFAULT_PERMISSIONS[Role.MEMBER],
        null,
        null,
      );
      const savedMember = make({ id: 20, userId: 2 });
      (mockMemberFactory.add as jest.Mock).mockResolvedValue(newMember);
      (mockMemberRepo.create as jest.Mock).mockResolvedValue(savedMember);

      const result = await service.addMember(5, { userId: 2 }, requesting);

      expect(mockMemberFactory.add).toHaveBeenCalledWith(
        5,
        { userId: 2 },
        requesting,
      );
      expect(mockMemberRepo.create).toHaveBeenCalledWith(newMember);
      expect(result).toEqual(savedMember);
    });

    it('should reactivate a previously left member via save', async () => {
      const leftMember = make({ id: 10, userId: 2, leftAt: new Date() });
      leftMember.rejoin(Role.MEMBER, DEFAULT_PERMISSIONS[Role.MEMBER]);
      (mockMemberFactory.add as jest.Mock).mockResolvedValue(leftMember);
      (mockMemberRepo.save as jest.Mock).mockImplementation((m: MemberDomain) =>
        Promise.resolve(m),
      );

      const result = await service.addMember(5, { userId: 2 }, requesting);

      expect(mockMemberRepo.save).toHaveBeenCalledWith(leftMember);
      expect(result.leftAt).toBeNull();
    });

    it('should throw MemberBannedError when target is banned', async () => {
      (mockMemberFactory.add as jest.Mock).mockRejectedValue(
        new MemberBannedError(),
      );

      await expect(
        service.addMember(5, { userId: 2 }, requesting),
      ).rejects.toThrow(MemberBannedError);
    });

    it('should throw AlreadyMemberError when already an active member', async () => {
      (mockMemberFactory.add as jest.Mock).mockRejectedValue(
        new AlreadyMemberError(),
      );

      await expect(
        service.addMember(5, { userId: 2 }, requesting),
      ).rejects.toThrow(AlreadyMemberError);
    });

    it('should throw UserNotFoundError when target user does not exist', async () => {
      (mockMemberFactory.add as jest.Mock).mockRejectedValue(
        new UserNotFoundError(),
      );

      await expect(
        service.addMember(5, { userId: 99 }, requesting),
      ).rejects.toThrow(UserNotFoundError);
    });

    it('should throw InsufficientPermissionsError when ADMIN tries to assign ADMIN role', async () => {
      (mockMemberFactory.add as jest.Mock).mockRejectedValue(
        new InsufficientPermissionsError(
          'Cannot assign a role equal to or higher than your own',
        ),
      );

      await expect(
        service.addMember(5, { userId: 2, role: Role.ADMIN }, requesting),
      ).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should allow SUPER_ADMIN to assign ADMIN role', async () => {
      const superAdmin = make({ id: 1, role: Role.SUPER_ADMIN });
      const newAdmin = make({ id: undefined, userId: 2, role: Role.ADMIN });
      const savedAdmin = make({ id: 20, role: Role.ADMIN });
      (mockMemberFactory.add as jest.Mock).mockResolvedValue(newAdmin);
      (mockMemberRepo.create as jest.Mock).mockResolvedValue(savedAdmin);

      const result = await service.addMember(
        5,
        { userId: 2, role: Role.ADMIN },
        superAdmin,
      );
      expect(result.role).toBe(Role.ADMIN);
    });
  });

  describe('ban', () => {
    it('should call ban() on target and persist when actor has permission', async () => {
      const actor = make({
        id: 1,
        role: Role.ADMIN,
        permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
      });
      const target = make({ id: 2, role: Role.MEMBER });
      (mockMemberFactory.ban as jest.Mock).mockReturnValue(true);
      (mockMemberRepo.save as jest.Mock).mockImplementation((m: MemberDomain) =>
        Promise.resolve(m),
      );

      await service.ban(target, actor);

      expect(mockMemberFactory.ban).toHaveBeenCalledWith(target, actor);
      expect(mockMemberRepo.save).toHaveBeenCalledWith(target);
    });

    it('should throw when actor lacks BAN_MEMBERS permission', async () => {
      (mockMemberFactory.ban as jest.Mock).mockImplementation(() => {
        throw new InsufficientPermissionsError();
      });

      await expect(
        service.ban(make({ id: 2 }), make({ id: 1, permissions: [] })),
      ).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should throw when ADMIN tries to ban another ADMIN', async () => {
      (mockMemberFactory.ban as jest.Mock).mockImplementation(() => {
        throw new InsufficientPermissionsError(
          'Cannot ban a member with equal or higher role',
        );
      });

      const actor = make({
        id: 1,
        role: Role.ADMIN,
        permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
      });
      const target = make({ id: 2, role: Role.ADMIN });
      await expect(service.ban(target, actor)).rejects.toThrow(
        InsufficientPermissionsError,
      );
    });

    it('should be a no-op when target is already banned', async () => {
      const actor = make({ id: 1, role: Role.SUPER_ADMIN });
      const target = make({ id: 2, bannedAt: new Date() });
      (mockMemberFactory.ban as jest.Mock).mockReturnValue(false);

      await service.ban(target, actor);
      expect(mockMemberRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('leave', () => {
    it('should call leave() on member and persist', async () => {
      const member = make();
      (mockMemberRepo.save as jest.Mock).mockImplementation((m: MemberDomain) =>
        Promise.resolve(m),
      );

      await service.leave(member);

      expect(member.hasLeft()).toBe(true);
      expect(mockMemberRepo.save).toHaveBeenCalledWith(member);
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions when actor has EDIT_PERMISSIONS and higher role', async () => {
      const actor = make({
        id: 1,
        role: Role.SUPER_ADMIN,
        permissions: DEFAULT_PERMISSIONS[Role.SUPER_ADMIN],
      });
      const target = make({ id: 2, role: Role.MEMBER });
      const newPerms = [Permission.SEND_MESSAGES, Permission.ADD_MEMBERS];
      (mockMemberFactory.updatePermissions as jest.Mock).mockImplementation(
        (t: MemberDomain, perms: Permission[]) => t.updatePermissions(perms),
      );
      (mockMemberRepo.save as jest.Mock).mockImplementation((m: MemberDomain) =>
        Promise.resolve(m),
      );

      const result = await service.updatePermissions(
        target,
        { permissions: newPerms },
        actor,
      );
      expect(result.permissions).toEqual(newPerms);
    });

    it('should throw when actor lacks EDIT_PERMISSIONS permission', async () => {
      (mockMemberFactory.updatePermissions as jest.Mock).mockImplementation(
        () => {
          throw new InsufficientPermissionsError();
        },
      );

      await expect(
        service.updatePermissions(
          make({ id: 2 }),
          { permissions: [] },
          make({ id: 1, permissions: [] }),
        ),
      ).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('updateRole', () => {
    it('should update role and reset permissions to defaults', async () => {
      const actor = make({ id: 1, role: Role.SUPER_ADMIN });
      const target = make({ id: 2, role: Role.MEMBER });
      (mockMemberFactory.updateRole as jest.Mock).mockImplementation(
        (t: MemberDomain, role: Role) =>
          t.setRole(role, DEFAULT_PERMISSIONS[role]),
      );
      (mockMemberRepo.save as jest.Mock).mockImplementation((m: MemberDomain) =>
        Promise.resolve(m),
      );

      const result = await service.updateRole(
        target,
        { role: Role.ADMIN },
        actor,
      );

      expect(result.role).toBe(Role.ADMIN);
      expect(result.permissions).toEqual(DEFAULT_PERMISSIONS[Role.ADMIN]);
    });

    it('should throw when ADMIN tries to promote to ADMIN', async () => {
      (mockMemberFactory.updateRole as jest.Mock).mockImplementation(() => {
        throw new InsufficientPermissionsError(
          'Cannot assign a role equal to or higher than your own',
        );
      });

      await expect(
        service.updateRole(
          make({ id: 2, role: Role.MEMBER }),
          { role: Role.ADMIN },
          make({
            id: 1,
            role: Role.ADMIN,
            permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
          }),
        ),
      ).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('getTargetMember', () => {
    it('should return the member when found in the correct chat', async () => {
      const member = make({ id: 10, chatId: 5 });
      (mockMemberRepo.findById as jest.Mock).mockResolvedValue(member);

      expect(await service.getTargetMember(5, 10)).toEqual(member);
    });

    it('should throw MemberNotFoundError when member is from a different chat', async () => {
      (mockMemberRepo.findById as jest.Mock).mockResolvedValue(
        make({ id: 10, chatId: 99 }),
      );
      await expect(service.getTargetMember(5, 10)).rejects.toThrow(
        MemberNotFoundError,
      );
    });
  });
});
