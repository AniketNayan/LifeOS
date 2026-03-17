import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type RateLimitBucket = {
  attempts: number;
  expiresAt: number;
};

@Injectable()
export class AuthRateLimitService {
  private readonly buckets = new Map<string, RateLimitBucket>();

  check(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      return;
    }

    if (bucket.attempts >= limit) {
      const retryAfterSeconds = Math.ceil((bucket.expiresAt - now) / 1000);
      throw new HttpException(
        `Too many attempts. Try again in ${retryAfterSeconds}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(key: string, windowMs: number) {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      this.buckets.set(key, {
        attempts: 1,
        expiresAt: now + windowMs,
      });
      return;
    }

    bucket.attempts += 1;
    this.buckets.set(key, bucket);
  }

  clear(key: string) {
    this.buckets.delete(key);
  }
}
