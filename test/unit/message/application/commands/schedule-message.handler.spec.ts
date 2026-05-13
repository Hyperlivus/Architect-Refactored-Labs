import { ScheduleMessageHandler } from '../../../../../src/message/application/commands/schedule-message.handler';
import { ScheduleMessageCommand } from '../../../../../src/message/application/commands/schedule-message.command';
import { ScheduledMessageDomain } from '../../../../../src/message/domain/scheduled-message.domain';
import { InvalidMessageDataError } from '../../../../../src/message/domain/message.factory';
import { MessageScheduledInPastError } from '../../../../../src/message/domain/message.errors';
import type { IMessageRepository } from '../../../../../src/message/domain/message.repository.interface';

const mockRepo: jest.Mocked<IMessageRepository> = {
  findActiveById: jest.fn(),
  findPendingScheduled: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  list: jest.fn(),
};

const futureDate = () => new Date(Date.now() + 60_000);

describe('ScheduleMessageHandler', () => {
  let handler: ScheduleMessageHandler;

  beforeEach(() => {
    handler = new ScheduleMessageHandler(mockRepo);
    jest.clearAllMocks();
  });

  it('should schedule a message and return read model', async () => {
    const scheduledAt = futureDate();
    const saved = new ScheduledMessageDomain(
      1,
      'Hello future',
      5,
      10,
      new Date(),
      null,
      scheduledAt,
      null,
    );
    mockRepo.create.mockResolvedValue(saved);

    const result = await handler.execute(
      new ScheduleMessageCommand(5, 'Hello future', 10, scheduledAt),
    );

    expect(result.id).toBe(1);
    expect(result.content).toBe('Hello future');
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('should throw MessageScheduledInPastError when scheduledAt is in the past', async () => {
    const pastDate = new Date(Date.now() - 1000);

    await expect(
      handler.execute(new ScheduleMessageCommand(5, 'Hello', 10, pastDate)),
    ).rejects.toThrow(MessageScheduledInPastError);

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should throw InvalidMessageDataError for empty content', async () => {
    await expect(
      handler.execute(new ScheduleMessageCommand(5, '   ', 10, futureDate())),
    ).rejects.toThrow(InvalidMessageDataError);

    expect(mockRepo.create).not.toHaveBeenCalled();
  });
});
