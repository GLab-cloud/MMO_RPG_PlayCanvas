import { describe, it, expect, beforeEach } from 'vitest';

interface MovementData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

class AntiCheat {
  private lastPosition: MovementData | null = null;
  private actionCounts: Map<string, number[]> = new Map();
  private lastSeq: Map<string, number> = new Map();
  suspiciousCount: number = 0;

  private recordViolation(): void {
    this.suspiciousCount++;
  }

  validateMovement(
    newPos: MovementData,
    lastPos: MovementData | null
  ): boolean {
    if (!lastPos) {
      this.lastPosition = newPos;
      return true;
    }
    const dt = (newPos.timestamp - lastPos.timestamp) / 1000;
    if (dt <= 0) {
      this.recordViolation();
      return false;
    }
    const dx = newPos.x - lastPos.x;
    const dy = newPos.y - lastPos.y;
    const dz = newPos.z - lastPos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const speed = dist / dt;

    if (speed > 10) {
      this.recordViolation();
      return false;
    }
    if (dist > 15 && dt < 1) {
      this.recordViolation();
      return false;
    }
    this.lastPosition = newPos;
    return true;
  }

  checkRateLimit(action: string, maxPerSecond: number): boolean {
    const now = Date.now();
    const timestamps = this.actionCounts.get(action) || [];
    const recent = timestamps.filter(t => now - t < 1000);
    if (recent.length >= maxPerSecond) {
      this.recordViolation();
      return false;
    }
    recent.push(now);
    this.actionCounts.set(action, recent);
    return true;
  }

  validateActionSequence(sessionId: string, seq: number): boolean {
    const last = this.lastSeq.get(sessionId) || 0;
    if (seq <= last) {
      this.recordViolation();
      return false;
    }
    this.lastSeq.set(sessionId, seq);
    return true;
  }
}

describe('AntiCheat', () => {
  let ac: AntiCheat;

  beforeEach(() => {
    ac = new AntiCheat();
  });

  it('validateMovement returns false for speed > 10 units/sec', () => {
    const prev = { x: 0, y: 0, z: 0, timestamp: 0 };
    const curr = { x: 50, y: 0, z: 0, timestamp: 1000 };
    expect(ac.validateMovement(curr, prev)).toBe(false);
  });

  it('validateMovement returns false for teleport (dist > 15 in < 1s)', () => {
    const prev = { x: 0, y: 0, z: 0, timestamp: 0 };
    const curr = { x: 20, y: 0, z: 0, timestamp: 100 };
    expect(ac.validateMovement(curr, prev)).toBe(false);
  });

  it('validateMovement returns true for normal movement', () => {
    const prev = { x: 0, y: 0, z: 0, timestamp: 0 };
    const curr = { x: 5, y: 0, z: 0, timestamp: 1000 };
    expect(ac.validateMovement(curr, prev)).toBe(true);
  });

  it('checkRateLimit returns false when exceeding limit', () => {
    for (let i = 0; i < 5; i++) {
      if (i < 4) {
        expect(ac.checkRateLimit('attack', 4)).toBe(true);
      } else {
        expect(ac.checkRateLimit('attack', 4)).toBe(false);
      }
    }
  });

  it('checkRateLimit returns true when within limit', () => {
    expect(ac.checkRateLimit('chat', 10)).toBe(true);
    expect(ac.checkRateLimit('chat', 10)).toBe(true);
    expect(ac.checkRateLimit('chat', 10)).toBe(true);
  });

  it('validateActionSequence returns false for seq <= lastSeq', () => {
    expect(ac.validateActionSequence('player1', 1)).toBe(true);
    expect(ac.validateActionSequence('player1', 0)).toBe(false);
    expect(ac.validateActionSequence('player1', 1)).toBe(false);
  });

  it('validateActionSequence returns true for valid sequence', () => {
    expect(ac.validateActionSequence('player1', 1)).toBe(true);
    expect(ac.validateActionSequence('player1', 2)).toBe(true);
    expect(ac.validateActionSequence('player1', 3)).toBe(true);
  });

  it('suspicious count increments on violation', () => {
    expect(ac.suspiciousCount).toBe(0);
    ac.validateMovement(
      { x: 100, y: 0, z: 0, timestamp: 100 },
      { x: 0, y: 0, z: 0, timestamp: 0 }
    );
    expect(ac.suspiciousCount).toBe(1);
    ac.validateActionSequence('p1', 1);
    expect(ac.suspiciousCount).toBe(1);
    ac.validateActionSequence('p1', 0);
    expect(ac.suspiciousCount).toBe(2);
  });
});
