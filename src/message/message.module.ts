import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './infrastructure/message.entity';
import { MessageRepository } from './infrastructure/message.repository';
import { MESSAGE_REPOSITORY } from './domain/message.repository.interface';
import { MessageController } from './presentation/message.controller';
import { MemberModule } from '../member/member.module';
import { UserModule } from '../user/user.module';
import { SendMessageHandler } from './application/commands/send-message.handler';
import { DeleteMessageHandler } from './application/commands/delete-message.handler';
import { ScheduleMessageHandler } from './application/commands/schedule-message.handler';
import { ListMessagesHandler } from './application/queries/list-messages.handler';
import { ScheduledMessageDeliveredHandler } from './application/events/scheduled-message-delivered.handler';
import { MessageSchedulerService } from './application/scheduler/message-scheduler.service';

const CommandHandlers = [
  SendMessageHandler,
  DeleteMessageHandler,
  ScheduleMessageHandler,
];
const QueryHandlers = [ListMessagesHandler];
const EventHandlers = [ScheduledMessageDeliveredHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Message]),
    MemberModule,
    UserModule,
  ],
  providers: [
    { provide: MESSAGE_REPOSITORY, useClass: MessageRepository },
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    MessageSchedulerService,
  ],
  controllers: [MessageController],
})
export class MessageModule {}
