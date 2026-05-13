import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './infrastructure/member.entity';
import { MemberRepository } from './infrastructure/member.repository';
import { MEMBER_REPOSITORY } from './domain/member.repository.interface';
import { MemberService } from './application/member.service';
import { MemberGuard } from './presentation/member.guard';
import { MemberController } from './presentation/member.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Member]), UserModule],
  providers: [
    { provide: MEMBER_REPOSITORY, useClass: MemberRepository },
    MemberService,
    MemberGuard,
  ],
  controllers: [MemberController],
  exports: [MemberService, MemberGuard],
})
export class MemberModule {}
