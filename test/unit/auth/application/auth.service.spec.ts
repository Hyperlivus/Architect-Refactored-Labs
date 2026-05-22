import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../../../src/auth/application/auth.service';
import { UserService } from '../../../../src/user/application/user.service';
import { MAIL_SERVICE } from '../../../../src/mail/mail.service.interface';
import { UserAlreadyExistsError } from '../../../../src/user/domain/user.errors';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidOtpError,
} from '../../../../src/auth/domain/auth.errors';
import { UserDomain } from '../../../../src/user/domain/user.domain';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

const mockUserService = {
  findByEmail: jest.fn(),
  findByTag: jest.fn(),
  findByEmailOrTag: jest.fn(),
  create: jest.fn(),
  setOtp: jest.fn(),
  verifyEmail: jest.fn(),
};

const mockJwtService = { sign: jest.fn().mockReturnValue('jwt-token') };
const mockMailService = { send: jest.fn().mockResolvedValue(undefined) };

const makeUser = (
  overrides: Partial<{
    id: number;
    email: string;
    nickname: string;
    tag: string;
    passwordHash: string;
    emailVerified: boolean;
    otp: string | null;
  }> = {},
): UserDomain =>
  new UserDomain(
    overrides.id ?? 1,
    overrides.email ?? 'user@test.com',
    overrides.nickname ?? 'User',
    overrides.tag ?? 'usertest',
    overrides.passwordHash ?? 'hashed_password',
    overrides.emailVerified ?? true,
    overrides.otp ?? null,
  );

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
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.findByTag.mockResolvedValue(null);
      jest.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      mockUserService.create.mockResolvedValue(
        makeUser({ id: 2, email: dto.email }),
      );
      mockUserService.setOtp.mockResolvedValue(undefined);

      await service.register(dto);

      expect(mockUserService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email, passwordHash: 'hashed' }),
      );
      expect(mockUserService.setOtp).toHaveBeenCalledWith(
        2,
        expect.stringMatching(/^\d{6}$/),
      );
      expect(mockMailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: dto.email }),
      );
    });

    it('should throw UserAlreadyExistsError when email is taken', async () => {
      mockUserService.findByEmail.mockResolvedValue(makeUser());
      mockUserService.findByTag.mockResolvedValue(null);

      await expect(service.register(dto)).rejects.toThrow(
        UserAlreadyExistsError,
      );
      expect(mockUserService.create).not.toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistsError when tag is taken', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.findByTag.mockResolvedValue(makeUser());

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
      mockUserService.findByEmail.mockResolvedValue(
        makeUser({ emailVerified: false, otp: '123456' }),
      );
      mockUserService.verifyEmail.mockResolvedValue(undefined);

      const result = await service.verifyEmail(dto);

      expect(result).toEqual({ accessToken: 'jwt-token' });
      expect(mockUserService.verifyEmail).toHaveBeenCalledWith(1);
    });

    it('should throw InvalidCredentialsError when user is not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      await expect(service.verifyEmail(dto)).rejects.toThrow(
        InvalidCredentialsError,
      );
    });

    it('should throw InvalidOtpError when OTP does not match', async () => {
      mockUserService.findByEmail.mockResolvedValue(
        makeUser({ otp: '999999' }),
      );
      await expect(service.verifyEmail(dto)).rejects.toThrow(InvalidOtpError);
    });

    it('should throw InvalidOtpError when OTP is null', async () => {
      mockUserService.findByEmail.mockResolvedValue(makeUser({ otp: null }));
      await expect(service.verifyEmail(dto)).rejects.toThrow(InvalidOtpError);
    });
  });

  describe('requestNewOtp', () => {
    const dto = { email: 'user@test.com' };

    it('should generate a new OTP and send email', async () => {
      mockUserService.findByEmail.mockResolvedValue(makeUser());
      mockUserService.setOtp.mockResolvedValue(undefined);

      await service.requestNewOtp(dto);

      expect(mockUserService.setOtp).toHaveBeenCalledWith(
        1,
        expect.stringMatching(/^\d{6}$/),
      );
      expect(mockMailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@test.com' }),
      );
    });

    it('should throw InvalidCredentialsError when user is not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      await expect(service.requestNewOtp(dto)).rejects.toThrow(
        InvalidCredentialsError,
      );
    });
  });
});