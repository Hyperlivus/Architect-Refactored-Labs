import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { MemberGuard } from './member.guard';
import { MemberService } from '../application/member.service';
import { MemberDomain } from '../domain/member.domain';
import { Permission, Role } from '../domain/member.enum';

const mockMemberService = { findByChatAndUser: jest.fn() };
const mockReflector = { get: jest.fn() };

const buildContext = (userId: number, chatId: number): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: userId },
        params: { chatId: String(chatId) },
        member: null,
      }),
    }),
    getHandler: () => ({}),
  }) as unknown as ExecutionContext;

const make = (
  overrides: {
    id?: number;
    role?: Role;
    permissions?: Permission[];
    bannedAt?: Date | null;
    leftAt?: Date | null;
  } = {},
): MemberDomain =>
  new MemberDomain(
    overrides.id ?? 10,
    1,
    5,
    overrides.role ?? Role.MEMBER,
    overrides.permissions ?? [Permission.SEND_MESSAGES],
    overrides.bannedAt ?? null,
    overrides.leftAt ?? null,
  );

describe('MemberGuard', () => {
  let guard: MemberGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MemberGuard,
        { provide: MemberService, useValue: mockMemberService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get(MemberGuard);
    jest.clearAllMocks();
    mockReflector.get.mockReturnValue(undefined);
  });

  it('should throw ForbiddenException when user is not a member', async () => {
    mockMemberService.findByChatAndUser.mockResolvedValue(null);
    await expect(guard.canActivate(buildContext(1, 5))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException when user is banned', async () => {
    mockMemberService.findByChatAndUser.mockResolvedValue(
      make({ bannedAt: new Date() }),
    );
    await expect(guard.canActivate(buildContext(1, 5))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException when user has left', async () => {
    mockMemberService.findByChatAndUser.mockResolvedValue(
      make({ leftAt: new Date() }),
    );
    await expect(guard.canActivate(buildContext(1, 5))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException when required permission is missing', async () => {
    mockMemberService.findByChatAndUser.mockResolvedValue(make());
    mockReflector.get.mockReturnValue(Permission.BAN_MEMBERS);
    await expect(guard.canActivate(buildContext(1, 5))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return true when member has the required permission', async () => {
    mockMemberService.findByChatAndUser.mockResolvedValue(
      make({ permissions: [Permission.SEND_MESSAGES] }),
    );
    mockReflector.get.mockReturnValue(Permission.SEND_MESSAGES);
    expect(await guard.canActivate(buildContext(1, 5))).toBe(true);
  });

  it('should allow SUPER_ADMIN regardless of permission metadata', async () => {
    mockMemberService.findByChatAndUser.mockResolvedValue(
      make({ role: Role.SUPER_ADMIN }),
    );
    mockReflector.get.mockReturnValue(Permission.BAN_MEMBERS);
    expect(await guard.canActivate(buildContext(1, 5))).toBe(true);
  });

  it('should return true when no permission is required and member is active', async () => {
    mockMemberService.findByChatAndUser.mockResolvedValue(make());
    expect(await guard.canActivate(buildContext(1, 5))).toBe(true);
  });
});
