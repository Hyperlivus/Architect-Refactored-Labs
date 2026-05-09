import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './user.entity';

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockUser: User = {
  id: 1,
  email: 'test@test.com',
  nickname: 'Test',
  tag: 'testuser',
  passwordHash: 'hash',
  emailVerified: false,
  otp: null,
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(UserService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.findOne({ id: 1 });
      expect(result).toEqual(mockUser);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.findOne({ email: 'x@x.com' })).toBeNull();
    });
  });

  describe('findByEmailOrTag', () => {
    it('should search by email when input contains @', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      await service.findByEmailOrTag('test@test.com');
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
    });

    it('should search by tag when input has no @', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      await service.findByEmailOrTag('testuser');
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { tag: 'testuser' } });
    });
  });

  describe('create', () => {
    it('should create and save a user with correct defaults', async () => {
      const data = { email: 'a@a.com', nickname: 'Alice', tag: 'alice', passwordHash: 'hash' };
      const created = { ...data, emailVerified: false, otp: null };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue({ id: 1, ...created });

      const result = await service.create(data);

      expect(mockRepo.create).toHaveBeenCalledWith({ ...data, emailVerified: false, otp: null });
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should call repo.update with correct args', async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 });
      await service.update(1, { otp: '123456' });
      expect(mockRepo.update).toHaveBeenCalledWith(1, { otp: '123456' });
    });
  });
});
