import { Logger } from '../utils/Logger.js';

interface LimitConfig {
  points: number;
  duration: number;
  blockDuration: number;
}

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
  blockedUntil: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private config: LimitConfig;

  constructor(config: LimitConfig) {
    this.config = config;
  }

  consume(key: string, cost: number = 1): boolean {
    const now = Date.now();
    let entry = this.limits.get(key);

    if (!entry) {
      entry = { tokens: this.config.points, lastRefill: now, blockedUntil: 0 };
      this.limits.set(key, entry);
    }

    if (now < entry.blockedUntil) {
      return false;
    }

    const elapsed = (now - entry.lastRefill) / 1000;
    entry.tokens = Math.min(
      this.config.points,
      entry.tokens + elapsed * (this.config.points / this.config.duration)
    );
    entry.lastRefill = now;

    if (entry.tokens >= cost) {
      entry.tokens -= cost;
      return true;
    }

    entry.blockedUntil = now + this.config.blockDuration;
    Logger.warn(`Rate limit exceeded for ${key}, blocked for ${this.config.blockDuration}ms`);
    return false;
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  isBlocked(key: string): boolean {
    const entry = this.limits.get(key);
    if (!entry) return false;
    return Date.now() < entry.blockedUntil;
  }
}
