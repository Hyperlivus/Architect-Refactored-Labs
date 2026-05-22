import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../../src/user/application/user.service';
import {
  USER_REPOSITORY,
  IUserRepository,
} from '../../../../src/user/domain/user.repository.interface';
import { UserDomain } from '../../../../src/user/domain/user.domain';

const mockUserRepo: Partial<IUserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByTag: jest.fn(),
  save: jest.fn(),
};

const mockUser = new UserDomain(
  1,
  'test@test.com',
  'Test',
  'testuser',
  'hash',
  false,
  null,
);

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get(UserService);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      (mockUserRepo.findById as jest.Mock).mockResolvedValue(mockUser);
      expect(await service.findById(1)).toEqual(mockUser);
      expect(mockUserRepo.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when not found', async () => {
      (mockUserRepo.findById as jest.Mock).mockResolvedValue(null);
      expect(await service.findById(999)).toBeNull();
    });
  });

  describe('findByEmailOrTag', () => {
    it('should search by email when input contains @', async () => {
      (mockUserRepo.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      await service.findByEmailOrTag('test@test.com');
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@test.com');
    });

    it('should search by tag when input has no @', async () => {
      (mockUserRepo.findByTag as jest.Mock).mockResolvedValue(mockUser);
      await service.findByEmailOrTag('testuser');
      expect(mockUserRepo.findByTag).toHaveBeenCalledWith('testuser');
    });
  });

  describe('create', () => {
    it('should validate via factory and delegate to repository', async () => {
      const data = {
        email: 'a@a.com',
        nickname: 'Alice',
        tag: 'alice',
        passwordHash: 'hash',
      };
      const created = new UserDomain(1, 'a@a.com', 'Alice', 'alice', 'hash', false, null);
      (mockUserRepo.save as jest.Mock).mockResolvedValue(created);

      const result = await service.create(data);

      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ emailVerified: false, otp: null }),
      );
      expect(result.id).toBe(1);
    });
  });

  describe('setOtp', () => {
    it('should find user, set OTP and persist', async () => {
      const user = new UserDomain(1, 'test@test.com', 'Test', 'testuser', 'hash', false, null);
      (mockUserRepo.findById as jest.Mock).mockResolvedValue(user);
      (mockUserRepo.save as jest.Mock).mockResolvedValue(undefined);

      await service.setOtp(1, '123456');

      expect(user.otp).toBe('123456');
      expect(mockUserRepo.save).toHaveBeenCalledWith(user);
    });

    it('should do nothing when user is not found', async () => {
      (mockUserRepo.findById as jest.Mock).mockResolvedValue(null);
      await service.setOtp(999, '123456');
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should find user, verify email and persist', async () => {
      const user = new UserDomain(1, 'test@test.com', 'Test', 'testuser', 'hash', false, '123456');
      (mockUserRepo.findById as jest.Mock).mockResolvedValue(user);
      (mockUserRepo.save as jest.Mock).mockResolvedValue(undefined);

      await service.verifyEmail(1);

      expect(user.emailVerified).toBe(true);
      expect(mockUserRepo.save).toHaveBeenCalledWith(user);
    });

    it('should do nothing when user is not found', async () => {
      (mockUserRepo.findById as jest.Mock).mockResolvedValue(null);
      await service.verifyEmail(999);
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });
  });
});