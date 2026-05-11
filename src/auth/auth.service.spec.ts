import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { MAIL_SERVICE } from '../mail/mail.service.interface';
import { UserAlreadyExistsError } from '../user/user.errors';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidOtpError,
} from './auth.errors';
import type { User } from '../user/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

const mockUserService = {
  findOne: jest.fn(),
  findByEmailOrTag: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockJwtService = { sign: jest.fn().mockReturnValue('jwt-token') };
const mockMailService = { send: jest.fn().mockResolvedValue(undefined) };

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'user@test.com',
  nickname: 'User',
  tag: 'usertest',
  passwordHash: 'hashed_password',
  emailVerified: true,
  otp: null,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MAIL_SERVICE, useValue: mockMailService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto = {
      email: 'new@test.com',
      nickname: 'New',
      tag: 'newuser',
      password: 'password123',
    };

    it('should create user and send OTP email on success', async () => {
      mockUserService.findOne.mockResolvedValue(null);
      jest.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      mockUserService.create.mockResolvedValue(
        makeUser({ id: 2, email: dto.email }),
      );
      mockUserService.update.mockResolvedValue(undefined);

      await service.register(dto);

      expect(mockUserService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          passwordHash: 'hashed',
        }),
      );
      expect(mockUserService.update).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          otp: expect.stringMatching(/^\d{6}$/) as unknown,
        }),
      );
      expect(mockMailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: dto.email }),
      );
    });

    it('should throw UserAlreadyExistsError when email is taken', async () => {
      mockUserService.findOne
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(null);

      await expect(service.register(dto)).rejects.toThrow(
        UserAlreadyExistsError,
      );
      expect(mockUserService.create).not.toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistsError when tag is taken', async () => {
      mockUserService.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeUser());

      await expect(service.register(dto)).rejects.toThrow(
        UserAlreadyExistsError,
      );
      expect(mockUserService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = { emailOrTag: 'user@test.com', password: 'password123' };

    it('should return accessToken on valid credentials', async () => {
      mockUserService.findByEmailOrTag.mockResolvedValue(makeUser());
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login(dto);

      expect(result).toEqual({ accessToken: 'jwt-token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'user@test.com',
      });
    });

    it('should throw InvalidCredentialsError when user is not found', async () => {
      mockUserService.findByEmailOrTag.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw InvalidCredentialsError when password is wrong', async () => {
      mockUserService.findByEmailOrTag.mockResolvedValue(makeUser());
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login(dto)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw EmailNotVerifiedError when email is not verified', async () => {
      mockUserService.findByEmailOrTag.mockResolvedValue(
        makeUser({ emailVerified: false }),
      );
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(service.login(dto)).rejects.toThrow(EmailNotVerifiedError);
    });
  });

  describe('verifyEmail', () => {
    const dto = { email: 'user@test.com', otp: '123456' };

    it('should verify email and return accessToken', async () => {
      mockUserService.findOne.mockResolvedValue(
        makeUser({ emailVerified: false, otp: '123456' }),
      );
      mockUserService.update.mockResolvedValue(undefined);

      const result = await service.verifyEmail(dto);

      expect(result).toEqual({ accessToken: 'jwt-token' });
      expect(mockUserService.update).toHaveBeenCalledWith(1, {
        emailVerified: true,
        otp: null,
      });
    });

    it('should throw InvalidCredentialsError when user is not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail(dto)).rejects.toThrow(
        InvalidCredentialsError,
      );
    });

    it('should throw InvalidOtpError when OTP does not match', async () => {
      mockUserService.findOne.mockResolvedValue(makeUser({ otp: '999999' }));

      await expect(service.verifyEmail(dto)).rejects.toThrow(InvalidOtpError);
    });

    it('should throw InvalidOtpError when OTP is null', async () => {
      mockUserService.findOne.mockResolvedValue(makeUser({ otp: null }));

      await expect(service.verifyEmail(dto)).rejects.toThrow(InvalidOtpError);
    });
  });

  describe('requestNewOtp', () => {
    const dto = { email: 'user@test.com' };

    it('should generate a new OTP and send email', async () => {
      mockUserService.findOne.mockResolvedValue(makeUser());
      mockUserService.update.mockResolvedValue(undefined);

      await service.requestNewOtp(dto);

      expect(mockUserService.update).toHaveBeenCalledWith(1, {
        otp: expect.stringMatching(/^\d{6}$/) as unknown,
      });
      expect(mockMailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@test.com' }),
      );
    });

    it('should throw InvalidCredentialsError when user is not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      await expect(service.requestNewOtp(dto)).rejects.toThrow(
        InvalidCredentialsError,
      );
    });
  });
});
