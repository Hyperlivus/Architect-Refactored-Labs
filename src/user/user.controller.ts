import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../shared/jwt-auth.guard';
import { CurrentUser } from '../shared/current-user.decorator';
import { UserNotFoundError } from './user.errors';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() userId: number) {
    const user = await this.userService.findOne({ id: userId });
    if (!user) throw new UserNotFoundError();
    const { passwordHash, otp, ...rest } = user;
    return rest;
  }
}
