import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { MessageService } from './message.service';
import { Message } from './message.entity';
import { MessageNotFoundError } from './message.errors';
import { InsufficientPermissionsError } from '../member/member.errors';
import { MemberService } from '../member/member.service';
import { Permission, Role } from '../member/member.enum';
import type { Member } from '../member/member.entity';

const mockRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockMemberService = { hasPermission: jest.fn() };

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 1, content: 'Hello', chatId: 5, memberId: 10, createdAt: new Date(), deletedAt: null,
  ...overrides,
});

const makeMember = (id = 10, role = Role.MEMBER, permissions: Permission[] = [Permission.SEND_MESSAGES]): Member => ({
  id, userId: 1, chatId: 5, role, permissions, bannedAt: null, leftAt: null,
});

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: getRepositoryToken(Message), useValue: mockRepo },
        { provide: MemberService, useValue: mockMemberService },
      ],
    }).compile();

    service = module.get(MessageService);
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('should create and save a message', async () => {
      const member = makeMember();
      const msg = makeMessage();
      mockRepo.create.mockReturnValue(msg);
      mockRepo.save.mockResolvedValue(msg);

      const result = await service.send(5, { content: 'Hello' }, member);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        content: 'Hello',
        chatId: 5,
        memberId: member.id,
      }));
      expect(result).toEqual(msg);
    });
  });

  describe('list', () => {
    it('should return paginated non-deleted messages', async () => {
      const messages = [makeMessage(), makeMessage({ id: 2 })];
      mockRepo.findAndCount.mockResolvedValue([messages, 2]);

      const result = await service.list(5, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: { chatId: 5, deletedAt: IsNull() },
        skip: 0,
        take: 20,
      }));
    });
  });

  describe('delete', () => {
    it('should allow message owner to delete their own message', async () => {
      const member = makeMember(10);
      const msg = makeMessage({ memberId: 10 });
      mockRepo.findOne.mockResolvedValue(msg);
      mockMemberService.hasPermission.mockReturnValue(false);
      mockRepo.save.mockResolvedValue({ ...msg, deletedAt: new Date() });

      await service.delete(1, 5, member);

      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: expect.any(Date) }));
    });

    it('should allow member with DELETE_MESSAGES to delete others messages', async () => {
      const member = makeMember(20);
      const msg = makeMessage({ memberId: 10 });
      mockRepo.findOne.mockResolvedValue(msg);
      mockMemberService.hasPermission.mockReturnValue(true);
      mockRepo.save.mockResolvedValue({ ...msg, deletedAt: new Date() });

      await service.delete(1, 5, member);

      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw InsufficientPermissionsError when not owner and no permission', async () => {
      const member = makeMember(20);
      const msg = makeMessage({ memberId: 10 });
      mockRepo.findOne.mockResolvedValue(msg);
      mockMemberService.hasPermission.mockReturnValue(false);

      await expect(service.delete(1, 5, member)).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should throw MessageNotFoundError when message does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(99, 5, makeMember())).rejects.toThrow(MessageNotFoundError);
    });

    it('should throw MessageNotFoundError when message is already deleted', async () => {
      const msg = makeMessage({ deletedAt: new Date() });
      mockRepo.findOne.mockResolvedValue(msg);

      await expect(service.delete(1, 5, makeMember())).rejects.toThrow(MessageNotFoundError);
    });
  });
});
