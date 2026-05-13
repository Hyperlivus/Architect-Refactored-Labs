import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import {
  MESSAGE_REPOSITORY,
  IMessageRepository,
} from '../domain/message.repository.interface';
import { MessageDomain } from '../domain/message.domain';
import { MessageNotFoundError } from '../domain/message.errors';
import { InsufficientPermissionsError } from '../../member/domain/member.errors';
import { MemberDomain } from '../../member/domain/member.domain';
import { Permission, Role } from '../../member/domain/member.enum';

const mockMessageRepo: Partial<IMessageRepository> = {
  findActiveById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  list: jest.fn(),
};

const makeMessage = (
  overrides: Partial<{
    id: number;
    content: string;
    chatId: number;
    memberId: number;
    createdAt: Date;
    deletedAt: Date | null;
  }> = {},
): MessageDomain =>
  new MessageDomain(
    overrides.id ?? 1,
    overrides.content ?? 'Hello',
    overrides.chatId ?? 5,
    overrides.memberId ?? 10,
    overrides.createdAt ?? new Date(),
    overrides.deletedAt ?? null,
  );

const makeMember = (
  id = 10,
  role = Role.MEMBER,
  permissions: Permission[] = [Permission.SEND_MESSAGES],
): MemberDomain => new MemberDomain(id, 1, 5, role, permissions, null, null);

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: MESSAGE_REPOSITORY, useValue: mockMessageRepo },
      ],
    }).compile();

    service = module.get(MessageService);
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('should create and return a message', async () => {
      const member = makeMember();
      const msg = makeMessage();
      (mockMessageRepo.create as jest.Mock).mockResolvedValue(msg);

      const result = await service.send(5, { content: 'Hello' }, member);

      expect(mockMessageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Hello',
          chatId: 5,
          memberId: member.id,
        }),
      );
      expect(result).toEqual(msg);
    });
  });

  describe('list', () => {
    it('should return paginated non-deleted messages', async () => {
      const messages = [makeMessage(), makeMessage({ id: 2 })];
      (mockMessageRepo.list as jest.Mock).mockResolvedValue({
        items: messages,
        total: 2,
      });

      const result = await service.list(5, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockMessageRepo.list).toHaveBeenCalledWith(5, 0, 20);
    });

    it('should calculate correct skip for page 2', async () => {
      (mockMessageRepo.list as jest.Mock).mockResolvedValue({
        items: [],
        total: 25,
      });
      await service.list(5, { page: 2, limit: 10 });
      expect(mockMessageRepo.list).toHaveBeenCalledWith(5, 10, 10);
    });
  });

  describe('delete', () => {
    it('should allow message owner to delete their own message', async () => {
      const member = makeMember(10);
      const msg = makeMessage({ memberId: 10 });
      (mockMessageRepo.findActiveById as jest.Mock).mockResolvedValue(msg);
      (mockMessageRepo.save as jest.Mock).mockImplementation(
        (m: MessageDomain) => Promise.resolve(m),
      );

      await service.delete(1, 5, member);

      expect(msg.isDeleted()).toBe(true);
      expect(mockMessageRepo.save).toHaveBeenCalledWith(msg);
    });

    it('should allow member with DELETE_MESSAGES to delete others messages', async () => {
      const member = makeMember(20, Role.ADMIN, [Permission.DELETE_MESSAGES]);
      const msg = makeMessage({ memberId: 10 });
      (mockMessageRepo.findActiveById as jest.Mock).mockResolvedValue(msg);
      (mockMessageRepo.save as jest.Mock).mockImplementation(
        (m: MessageDomain) => Promise.resolve(m),
      );

      await service.delete(1, 5, member);
      expect(mockMessageRepo.save).toHaveBeenCalled();
    });

    it('should throw InsufficientPermissionsError when not owner and no permission', async () => {
      const member = makeMember(20, Role.MEMBER, []);
      const msg = makeMessage({ memberId: 10 });
      (mockMessageRepo.findActiveById as jest.Mock).mockResolvedValue(msg);

      await expect(service.delete(1, 5, member)).rejects.toThrow(
        InsufficientPermissionsError,
      );
    });

    it('should throw MessageNotFoundError when message does not exist', async () => {
      (mockMessageRepo.findActiveById as jest.Mock).mockResolvedValue(null);
      await expect(service.delete(99, 5, makeMember())).rejects.toThrow(
        MessageNotFoundError,
      );
    });
  });
});
