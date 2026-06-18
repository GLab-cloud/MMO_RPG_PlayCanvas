import { Logger } from '../utils/Logger.js';

const MOVE_SPEED_MAX = 10;
const TELEPORT_THRESHOLD = 15;
const RATE_LIMITS: Record<string, { maxPerSecond: number; window: number }> = {
  chat: { maxPerSecond: 5, window: 1000 },
  attack: { maxPerSecond: 10, window: 1000 },
  pickup: { maxPerSecond: 5, window: 1000 },
  move: { maxPerSecond: 30, window: 1000 },
};

export class AntiCheat {
  private lastPositions: Map<string, { x: number; z: number; time: number }> = new Map();
  private rateLimitCounts: Map<string, Map<string, number[]>> = new Map();
  private suspiciousCount: Map<string, number> = new Map();

  validateMovement(
    player: { x: number; z: number },
    data: { x: number; z: number }
  ): boolean {
    const last = this.lastPositions.get(player.x + ',' + player.z);
    const now = Date.now();

    if (last) {
      const dt = (now - last.time) / 1000;
      if (dt <= 0) return false;

      const dx = data.x - last.x;
      const dz = data.z - last.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const speed = dist / dt;

      if (speed > MOVE_SPEED_MAX) {
        this.incrementSuspicious(player.x + ',' + player.z);
        return false;
      }

      if (dist > TELEPORT_THRESHOLD && dt < 1) {
        this.incrementSuspicious(player.x + ',' + player.z);
        return false;
      }
    }

    if (!this.checkRateLimit('move', player.x + ',' + player.z)) {
      return false;
    }

    this.lastPositions.set(player.x + ',' + player.z, { x: data.x, z: data.z, time: now });
    return true;
  }

  checkRateLimit(action: string, key: string): boolean {
    const config = RATE_LIMITS[action];
    if (!config) return true;

    const now = Date.now();
    let actionCounts = this.rateLimitCounts.get(key);
    if (!actionCounts) {
      actionCounts = new Map();
      this.rateLimitCounts.set(key, actionCounts);
    }

    let timestamps = actionCounts.get(action);
    if (!timestamps) {
      timestamps = [];
      actionCounts.set(action, timestamps);
    }

    const cutoff = now - config.window;
    while (timestamps.length > 0 && timestamps[0]! < cutoff) {
      timestamps.shift();
    }

    if (timestamps.length >= config.maxPerSecond) {
      this.incrementSuspicious(key);
      return false;
    }

    timestamps.push(now);
    return true;
  }

  validateActionSequence(seq: number, lastSeq: number): boolean {
    if (seq <= lastSeq) return false;
    if (seq - lastSeq > 10) return false;
    return true;
  }

  private incrementSuspicious(key: string): void {
    const count = (this.suspiciousCount.get(key) || 0) + 1;
    this.suspiciousCount.set(key, count);

    if (count >= 10) {
      Logger.warn(`Anti-cheat: Player ${key} flagged for suspicious activity`);
    }
  }

  validateStatAllocation(
    stat: string,
    currentValue: number,
    maxAllowed: number
  ): boolean {
    return currentValue < maxAllowed;
  }
}
