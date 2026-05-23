import { CreateChatHandler } from '../../../../../src/chat/application/commands/create-chat.handler';
import { CreateChatCommand } from '../../../../../src/chat/application/commands/create-chat.command';
import { ChatDomain } from '../../../../../src/chat/domain/chat.domain';
import { ChatTagTakenError } from '../../../../../src/chat/domain/chat.errors';
import type { IChatRepository } from '../../../../../src/chat/domain/chat.repository.interface';
import { CHAT_REPOSITORY } from '../../../../../src/chat/domain/chat.repository.interface';
import type { MemberService } from '../../../../../src/member/application/member.service';

const mockRepo: jest.Mocked<IChatRepository> = {
  findById: jest.fn(),
  findByTag: jest.fn(),
  save: jest.fn(),
  list: jest.fn(),
};

const mockMemberService = { createOwner: jest.fn() } as unknown as MemberService;

describe('CreateChatHandler', () => {
  let handler: CreateChatHandler;

  beforeEach(() => {
    handler = new CreateChatHandler(mockRepo, mockMemberService);
    jest.clearAllMocks();
  });

  it('should create chat and return its id', async () => {
    mockRepo.findByTag.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue(new ChatDomain(1, 'Test Chat', 'testchat', null));
    (mockMemberService.createOwner as jest.Mock).mockResolvedValue({});

    const id = await handler.execute(
      new CreateChatCommand('Test Chat', 'testchat', null, 42),
    );

    expect(id).toBe(1);
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockMemberService.createOwner).toHaveBeenCalledWith(1, 42);
  });

  it('should throw ChatTagTakenError when tag is already in use', async () => {
    mockRepo.findByTag.mockResolvedValue(
      new ChatDomain(1, 'Existing', 'testchat', null),
    );

    await expect(
      handler.execute(new CreateChatCommand('New', 'testchat', null, 1)),
    ).rejects.toThrow(ChatTagTakenError);

    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when factory validation fails (short name)', async () => {
    mockRepo.findByTag.mockResolvedValue(null);

    await expect(
      handler.execute(new CreateChatCommand('X', 'testchat', null, 1)),
    ).rejects.toThrow();
  });
});
