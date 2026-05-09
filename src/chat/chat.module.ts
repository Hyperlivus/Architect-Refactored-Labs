import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './chat.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MemberModule } from '../member/member.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Chat]), MemberModule, UserModule],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
