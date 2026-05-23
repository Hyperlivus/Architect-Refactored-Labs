import { UserDomain } from '../../src/user/domain/user.domain';
import { InvalidUserDataError } from '../../src/user/domain/user.errors';

describe('UserDomain', () => {
  describe('constructor invariant validation', () => {
    it('should create a valid user', () => {
      const user = new UserDomain(
        undefined,
        'user@test.com',
        'Alice',
        'alice123',
        'hash',
        false,
        null,
      );
      expect(user.email).toBe('user@test.com');
      expect(user.nickname).toBe('Alice');
      expect(user.tag).toBe('alice123');
    });

    it('should throw InvalidUserDataError for invalid email (no @)', () => {
      expect(
        () =>
          new UserDomain(
            undefined,
            'invalid-email',
            'Alice',
            'alice',
            'hash',
            false,
            null,
          ),
      ).toThrow(InvalidUserDataError);
    });

    it('should throw InvalidUserDataError for invalid email (no domain)', () => {
      expect(
        () =>
          new UserDomain(
            undefined,
            'user@',
            'Alice',
            'alice',
            'hash',
            false,
            null,
          ),
      ).toThrow(InvalidUserDataError);
    });

    it('should throw InvalidUserDataError for tag shorter than 3 chars', () => {
      expect(
        () =>
          new UserDomain(
            undefined,
            'user@test.com',
            'Alice',
            'ab',
            'hash',
            false,
            null,
          ),
      ).toThrow(InvalidUserDataError);
    });

    it('should throw InvalidUserDataError for tag with spaces or special chars', () => {
      expect(
        () =>
          new UserDomain(
            undefined,
            'user@test.com',
            'Alice',
            'bad tag!',
            'hash',
            false,
            null,
          ),
      ).toThrow(InvalidUserDataError);
    });

    it('should throw InvalidUserDataError for nickname shorter than 2 chars', () => {
      expect(
        () =>
          new UserDomain(
            undefined,
            'user@test.com',
            'A',
            'alice',
            'hash',
            false,
            null,
          ),
      ).toThrow(InvalidUserDataError);
    });

    it('should throw InvalidUserDataError for nickname longer than 50 chars', () => {
      expect(
        () =>
          new UserDomain(
            undefined,
            'user@test.com',
            'A'.repeat(51),
            'alice',
            'hash',
            false,
            null,
          ),
      ).toThrow(InvalidUserDataError);
    });

    it('should throw InvalidUserDataError for empty passwordHash', () => {
      expect(
        () =>
          new UserDomain(
            undefined,
            'user@test.com',
            'Alice',
            'alice',
            '',
            false,
            null,
          ),
      ).toThrow(InvalidUserDataError);
    });
  });

  describe('verifyEmail', () => {
    it('should set emailVerified to true and clear otp', () => {
      const user = new UserDomain(
        1,
        'user@test.com',
        'Alice',
        'alice',
        'hash',
        false,
        '123456',
      );
      user.verifyEmail();
      expect(user.emailVerified).toBe(true);
      expect(user.otp).toBeNull();
    });
  });

  describe('setOtp', () => {
    it('should set a valid 6-digit otp', () => {
      const user = new UserDomain(
        1,
        'user@test.com',
        'Alice',
        'alice',
        'hash',
        false,
        null,
      );
      user.setOtp('123456');
      expect(user.otp).toBe('123456');
    });

    it('should throw InvalidUserDataError for non-6-digit otp', () => {
      const user = new UserDomain(
        1,
        'user@test.com',
        'Alice',
        'alice',
        'hash',
        false,
        null,
      );
      expect(() => user.setOtp('abc')).toThrow(InvalidUserDataError);
      expect(() => user.setOtp('12345')).toThrow(InvalidUserDataError);
      expect(() => user.setOtp('1234567')).toThrow(InvalidUserDataError);
    });
  });

  describe('clearOtp', () => {
    it('should set otp to null', () => {
      const user = new UserDomain(
        1,
        'user@test.com',
        'Alice',
        'alice',
        'hash',
        false,
        '123456',
      );
      user.clearOtp();
      expect(user.otp).toBeNull();
    });
  });

  describe('updateNickname', () => {
    it('should update nickname when valid', () => {
      const user = new UserDomain(
        1,
        'user@test.com',
        'Alice',
        'alice',
        'hash',
        false,
        null,
      );
      user.updateNickname('Bob');
      expect(user.nickname).toBe('Bob');
    });

    it('should throw for nickname shorter than 2 chars', () => {
      const user = new UserDomain(
        1,
        'user@test.com',
        'Alice',
        'alice',
        'hash',
        false,
        null,
      );
      expect(() => user.updateNickname('A')).toThrow(InvalidUserDataError);
    });
  });

  describe('updatePassword', () => {
    it('should update passwordHash', () => {
      const user = new UserDomain(
        1,
        'user@test.com',
        'Alice',
        'alice',
        'hash',
        false,
        null,
      );
      user.updatePassword('newhash');
      expect(user.passwordHash).toBe('newhash');
    });

    it('should throw for empty hash', () => {
      const user = new UserDomain(
        1,
        'user@test.com',
        'Alice',
        'alice',
        'hash',
        false,
        null,
      );
      expect(() => user.updatePassword('')).toThrow(InvalidUserDataError);
    });
  });
});
