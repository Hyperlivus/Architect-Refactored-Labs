import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from '../application/user.service';
import { JwtAuthGuard } from '../../shared/jwt-auth.guard';
import { CurrentUser } from '../../shared/current-user.decorator';
import { UserNotFoundError } from '../domain/user.errors';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UserNotFoundError();
    const { passwordHash: _passwordHash, otp: _otp, ...rest } = user;
    return rest;
  }
}
