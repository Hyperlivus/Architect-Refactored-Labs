import { EventBus } from '@nestjs/cqrs';
import { MessageSchedulerService } from '../../../../../src/message/application/scheduler/message-scheduler.service';
import { ScheduledMessageDeliveredEvent } from '../../../../../src/message/application/events/scheduled-message-delivered.event';
import { ScheduledMessageDomain } from '../../../../../src/message/domain/scheduled-message.domain';
import type { IMessageRepository } from '../../../../../src/message/domain/message.repository.interface';

const mockRepo: jest.Mocked<IMessageRepository> = {
  findActiveById: jest.fn(),
  findPendingScheduled: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  list: jest.fn(),
};

const mockEventBus = { publish: jest.fn() } as unknown as EventBus;

const makeScheduled = (id: number): ScheduledMessageDomain =>
  new ScheduledMessageDomain(
    id,
    'Scheduled content',
    5,
    10,
    new Date(),
    null,
    new Date(Date.now() - 1000),
    null,
  );

describe('MessageSchedulerService', () => {
  let service: MessageSchedulerService;

  beforeEach(() => {
    service = new MessageSchedulerService(mockRepo, mockEventBus);
    jest.clearAllMocks();
  });

  it('should deliver pending messages and publish events', async () => {
    const msg = makeScheduled(1);
    mockRepo.findPendingScheduled.mockResolvedValue([msg]);
    mockRepo.save.mockImplementation((m) => Promise.resolve(m));

    await service.processScheduledMessages();

    expect(msg.isPending()).toBe(false);
    expect(mockRepo.save).toHaveBeenCalledWith(msg);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(ScheduledMessageDeliveredEvent),
    );
  });

  it('should publish one event per message', async () => {
    mockRepo.findPendingScheduled.mockResolvedValue([
      makeScheduled(1),
      makeScheduled(2),
    ]);
    mockRepo.save.mockImplementation((m) => Promise.resolve(m));

    await service.processScheduledMessages();

    expect(mockEventBus.publish).toHaveBeenCalledTimes(2);
  });

  it('should do nothing when no pending messages', async () => {
    mockRepo.findPendingScheduled.mockResolvedValue([]);

    await service.processScheduledMessages();

    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should continue processing remaining messages when one save fails', async () => {
    const msg1 = makeScheduled(1);
    const msg2 = makeScheduled(2);
    mockRepo.findPendingScheduled.mockResolvedValue([msg1, msg2]);
    mockRepo.save
      .mockRejectedValueOnce(new Error('DB error'))
      .mockImplementation((m) => Promise.resolve(m));

    await expect(service.processScheduledMessages()).resolves.not.toThrow();
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });
});
