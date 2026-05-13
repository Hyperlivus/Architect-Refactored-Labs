import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './infrastructure/message.entity';
import { MessageRepository } from './infrastructure/message.repository';
import { MESSAGE_REPOSITORY } from './domain/message.repository.interface';
import { MessageController } from './presentation/message.controller';
import { MemberModule } from '../member/member.module';
import { SendMessageHandler } from './application/commands/send-message.handler';
import { DeleteMessageHandler } from './application/commands/delete-message.handler';
import { ListMessagesHandler } from './application/queries/list-messages.handler';

const CommandHandlers = [SendMessageHandler, DeleteMessageHandler];
const QueryHandlers = [ListMessagesHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([Message]), MemberModule],
  providers: [
    { provide: MESSAGE_REPOSITORY, useClass: MessageRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  controllers: [MessageController],
})
export class MessageModule {}
