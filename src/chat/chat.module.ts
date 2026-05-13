import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './infrastructure/chat.entity';
import { ChatRepository } from './infrastructure/chat.repository';
import { CHAT_REPOSITORY } from './domain/chat.repository.interface';
import { ChatController } from './presentation/chat.controller';
import { MemberModule } from '../member/member.module';
import { CreateChatHandler } from './application/commands/create-chat.handler';
import { UpdateChatHandler } from './application/commands/update-chat.handler';
import { GetChatHandler } from './application/queries/get-chat.handler';
import { ListChatsHandler } from './application/queries/list-chats.handler';

const CommandHandlers = [CreateChatHandler, UpdateChatHandler];
const QueryHandlers = [GetChatHandler, ListChatsHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([Chat]), MemberModule],
  providers: [
    { provide: CHAT_REPOSITORY, useClass: ChatRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
