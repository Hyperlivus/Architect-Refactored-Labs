import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { UserController } from '../src/user/user.controller';
import { UserService } from '../src/user/user.service';
import { JwtAuthGuard } from '../src/shared/jwt-auth.guard';
import { DomainExceptionFilter } from '../src/shared/domain-exception.filter';
import { UserNotFoundError } from '../src/user/user.errors';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidOtpError,
} from '../src/auth/auth.errors';
import { UserAlreadyExistsError } from '../src/user/user.errors';

const JWT_SECRET = 'test-secret';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  verifyEmail: jest.fn(),
  requestNewOtp: jest.fn(),
};

const mockUserService = { findOne: jest.fn() };

describe('Auth & User (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ global: true, secret: JWT_SECRET, signOptions: { expiresIn: '1d' } })],
      controllers: [AuthController, UserController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        JwtAuthGuard,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    jwtService = module.get(JwtService);
  });

  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  // ─── POST /auth/register ───────────────────────────────────────────────
  describe('POST /auth/register', () => {
    const validBody = { email: 'test@test.com', nickname: 'Test', tag: 'testuser', password: 'password123' };

    it('201 — registers successfully', async () => {
      mockAuthService.register.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validBody)
        .expect(201)
        .expect(({ body }) => expect(body.message).toBeDefined());
    });

    it('409 — email already exists', async () => {
      mockAuthService.register.mockRejectedValue(new UserAlreadyExistsError('email'));

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validBody)
        .expect(409);
    });

    it('400 — invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validBody, email: 'not-an-email' })
        .expect(400);
    });

    it('400 — password too short', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validBody, password: '123' })
        .expect(400);
    });

    it('400 — invalid tag format', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validBody, tag: 'hi' })
        .expect(400);
    });

    it('400 — unknown field is stripped (whitelist)', async () => {
      mockAuthService.register.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validBody, unknownField: 'x' })
        .expect(400); // forbidNonWhitelisted: true
    });
  });

  // ─── POST /auth/login ──────────────────────────────────────────────────
  describe('POST /auth/login', () => {
    const validBody = { emailOrTag: 'test@test.com', password: 'password123' };

    it('200 — returns accessToken on valid credentials', async () => {
      mockAuthService.login.mockResolvedValue({ accessToken: 'token123' });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(validBody)
        .expect(200)
        .expect(({ body }) => expect(body.accessToken).toBe('token123'));
    });

    it('401 — invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(new InvalidCredentialsError());

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(validBody)
        .expect(401);
    });

    it('403 — email not verified', async () => {
      mockAuthService.login.mockRejectedValue(new EmailNotVerifiedError());

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(validBody)
        .expect(403);
    });

    it('400 — missing password field', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ emailOrTag: 'test@test.com' })
        .expect(400);
    });
  });

  // ─── POST /auth/verify-email ───────────────────────────────────────────
  describe('POST /auth/verify-email', () => {
    const validBody = { email: 'test@test.com', otp: '123456' };

    it('200 — verifies email and returns token', async () => {
      mockAuthService.verifyEmail.mockResolvedValue({ accessToken: 'verified-token' });

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send(validBody)
        .expect(200)
        .expect(({ body }) => expect(body.accessToken).toBe('verified-token'));
    });

    it('400 — invalid OTP', async () => {
      mockAuthService.verifyEmail.mockRejectedValue(new InvalidOtpError());

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send(validBody)
        .expect(400);
    });

    it('400 — OTP must be exactly 6 characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ ...validBody, otp: '12345' })
        .expect(400);
    });
  });

  // ─── POST /auth/resend-otp ─────────────────────────────────────────────
  describe('POST /auth/resend-otp', () => {
    it('200 — sends new OTP', async () => {
      mockAuthService.requestNewOtp.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/resend-otp')
        .send({ email: 'test@test.com' })
        .expect(200)
        .expect(({ body }) => expect(body.message).toBeDefined());
    });

    it('401 — user not found treated as invalid credentials', async () => {
      mockAuthService.requestNewOtp.mockRejectedValue(new InvalidCredentialsError());

      await request(app.getHttpServer())
        .post('/auth/resend-otp')
        .send({ email: 'ghost@test.com' })
        .expect(401);
    });

    it('400 — invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/resend-otp')
        .send({ email: 'not-email' })
        .expect(400);
    });
  });

  // ─── GET /user/me ──────────────────────────────────────────────────────
  describe('GET /user/me', () => {
    const makeToken = (userId: number) =>
      jwtService.sign({ sub: userId, email: 'test@test.com' });

    it('200 — returns user data without sensitive fields', async () => {
      const token = makeToken(1);
      mockUserService.findOne.mockResolvedValue({
        id: 1, email: 'test@test.com', nickname: 'Test', tag: 'testuser',
        emailVerified: true, passwordHash: 'secret', otp: '123456',
      });

      await request(app.getHttpServer())
        .get('/user/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(1);
          expect(body.email).toBe('test@test.com');
          expect(body.passwordHash).toBeUndefined();
          expect(body.otp).toBeUndefined();
        });
    });

    it('401 — no token provided', async () => {
      await request(app.getHttpServer()).get('/user/me').expect(401);
    });

    it('401 — invalid token', async () => {
      await request(app.getHttpServer())
        .get('/user/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('404 — user not found in DB after valid token', async () => {
      const token = makeToken(999);
      mockUserService.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/user/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
