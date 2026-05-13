import { SendMessageHandler } from '../../../../../src/message/application/commands/send-message.handler';
import { SendMessageCommand } from '../../../../../src/message/application/commands/send-message.command';
import { MessageDomain } from '../../../../../src/message/domain/message.domain';
import { InvalidMessageDataError } from '../../../../../src/message/domain/message.factory';
import type { IMessageRepository } from '../../../../../src/message/domain/message.repository.interface';

const mockRepo: jest.Mocked<IMessageRepository> = {
  findActiveById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  list: jest.fn(),
};

describe('SendMessageHandler', () => {
  let handler: SendMessageHandler;

  beforeEach(() => {
    handler = new SendMessageHandler(mockRepo);
    jest.clearAllMocks();
  });

  it('should create message and return read model', async () => {
    const saved = new MessageDomain(1, 'Hello world', 5, 10, new Date(), null);
    mockRepo.create.mockResolvedValue(saved);

    const result = await handler.execute(
      new SendMessageCommand(5, 'Hello world', 10),
    );

    expect(result.id).toBe(1);
    expect(result.content).toBe('Hello world');
    expect(result.chatId).toBe(5);
    expect(result.memberId).toBe(10);
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('should throw InvalidMessageDataError for empty content', async () => {
    await expect(
      handler.execute(new SendMessageCommand(5, '   ', 10)),
    ).rejects.toThrow(InvalidMessageDataError);

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should throw when content exceeds 4000 characters', async () => {
    await expect(
      handler.execute(new SendMessageCommand(5, 'x'.repeat(4001), 10)),
    ).rejects.toThrow(InvalidMessageDataError);
  });
});
