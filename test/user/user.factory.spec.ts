import { Test, TestingModule } from '@nestjs/testing';
import { UserFactory } from '../../src/user/domain/user.factory';
import {
  USER_REPOSITORY,
  IUserRepository,
} from '../../src/user/domain/user.repository.interface';
import { UserDomain } from '../../src/user/domain/user.domain';
import { UserAlreadyExistsError } from '../../src/user/domain/user.errors';

const mockUserRepo: Partial<IUserRepository> = {
  findByEmail: jest.fn(),
  findByTag: jest.fn(),
};

const existingUser = new UserDomain(
  1,
  'taken@test.com',
  'Taken',
  'takenuser',
  'hash',
  true,
  null,
);

const validParams = {
  email: 'new@test.com',
  nickname: 'NewUser',
  tag: 'newuser',
  passwordHash: 'hash',
};

describe('UserFactory', () => {
  let factory: UserFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserFactory,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
      ],
    }).compile();

    factory = module.get(UserFactory);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a UserDomain when email and tag are unique', async () => {
      (mockUserRepo.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepo.findByTag as jest.Mock).mockResolvedValue(null);

      const user = await factory.create(validParams);

      expect(user).toBeInstanceOf(UserDomain);
      expect(user.email).toBe('new@test.com');
      expect(user.emailVerified).toBe(false);
      expect(user.otp).toBeNull();
      expect(user.id).toBeUndefined();
    });

    it('should lowercase the email', async () => {
      (mockUserRepo.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepo.findByTag as jest.Mock).mockResolvedValue(null);

      const user = await factory.create({
        ...validParams,
        email: 'NEW@TEST.COM',
      });

      expect(user.email).toBe('new@test.com');
    });

    it('should throw UserAlreadyExistsError when email is taken', async () => {
      (mockUserRepo.findByEmail as jest.Mock).mockResolvedValue(existingUser);
      (mockUserRepo.findByTag as jest.Mock).mockResolvedValue(null);

      await expect(factory.create(validParams)).rejects.toThrow(
        UserAlreadyExistsError,
      );
    });

    it('should throw UserAlreadyExistsError when tag is taken', async () => {
      (mockUserRepo.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepo.findByTag as jest.Mock).mockResolvedValue(existingUser);

      await expect(factory.create(validParams)).rejects.toThrow(
        UserAlreadyExistsError,
      );
    });

    it('should check email and tag in parallel', async () => {
      (mockUserRepo.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepo.findByTag as jest.Mock).mockResolvedValue(null);

      await factory.create(validParams);

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('new@test.com');
      expect(mockUserRepo.findByTag).toHaveBeenCalledWith('newuser');
    });
  });
});
