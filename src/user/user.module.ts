import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtAuthGuard } from '../shared/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, JwtAuthGuard],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
