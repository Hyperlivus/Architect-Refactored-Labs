import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './member.entity';
import { MemberService } from './member.service';
import { MemberGuard } from './member.guard';
import { MemberController } from './member.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Member]), UserModule],
  providers: [MemberService, MemberGuard],
  controllers: [MemberController],
  exports: [MemberService, MemberGuard],
})
export class MemberModule {}
