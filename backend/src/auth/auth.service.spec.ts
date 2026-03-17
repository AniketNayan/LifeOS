import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    name: 'Aniket',
    email: 'aniket@example.com',
    passwordHash: 'hashed-password',
    refreshTokenHash: 'hashed-refresh',
    googleId: null,
    createdAt: new Date('2026-03-17T00:00:00.000Z'),
  };

  let prisma: any;
  let configService: any;
  let authRateLimitService: jest.Mocked<AuthRateLimitService>;
  let service: AuthService;
  let bcryptHash: jest.Mock;
  let bcryptCompare: jest.Mock;
  let jwtSign: jest.Mock;
  let jwtVerify: jest.Mock;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          FRONTEND_URL: 'http://localhost:5173',
          NODE_ENV: 'test',
        };
        return values[key];
      }),
    };

    authRateLimitService = {
      check: jest.fn(),
      recordFailure: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<AuthRateLimitService>;

    service = new AuthService(prisma, configService, authRateLimitService);

    bcryptHash = bcrypt.hash as unknown as jest.Mock;
    bcryptCompare = bcrypt.compare as unknown as jest.Mock;
    jwtSign = jwt.sign as unknown as jest.Mock;
    jwtVerify = jwt.verify as unknown as jest.Mock;

    bcryptHash.mockResolvedValue('hashed-value');
    bcryptCompare.mockResolvedValue(true);
    jwtSign.mockReturnValue('signed-token');
    jwtVerify.mockReturnValue({
      sub: user.id,
      email: user.email,
      name: user.name,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user, normalizes email, and sets auth cookies', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue(user);

    const req = { headers: {}, ip: '127.0.0.1' } as any;
    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

    const result = await service.register(
      req,
      { name: ' Aniket ', email: '  ANIKET@EXAMPLE.COM ', password: 'password123' },
      res,
    );

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Aniket',
          email: 'aniket@example.com',
          passwordHash: 'hashed-value',
        }),
      }),
    );
    expect(authRateLimitService.clear).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(result).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: user.id,
          email: user.email,
          name: user.name,
        }),
      }),
    );
  });

  it('rejects register when the email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const req = { headers: {}, ip: '127.0.0.1' } as any;
    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

    await expect(
      service.register(req, { name: 'Aniket', email: user.email, password: 'password123' }, res),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(authRateLimitService.recordFailure).toHaveBeenCalled();
  });

  it('rejects login when the password does not match', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    bcryptCompare.mockResolvedValue(false);

    const req = { headers: {}, ip: '127.0.0.1' } as any;
    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

    await expect(
      service.login(req, { email: user.email, password: 'wrong-password' }, res),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(authRateLimitService.recordFailure).toHaveBeenCalled();
  });

  it('refreshes a valid session and rotates cookies', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue(user);

    const req = {
      cookies: { refresh_token: 'refresh-token' },
      headers: {},
      ip: '127.0.0.1',
    } as any;
    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

    const result = await service.refresh(req, res);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: expect.objectContaining({ refreshTokenHash: 'hashed-value' }),
      }),
    );
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(result.user.id).toBe(user.id);
  });
});
