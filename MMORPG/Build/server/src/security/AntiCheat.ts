import { validatePosition } from './Validator.js';
import { config } from '../config.js';

const MAX_SPEED = 10;
const SUSPICION_THRESHOLD = 5;

interface PlayerTracking {
  lastX: number;
  lastZ: number;
  lastUpdate: number;
  speedViolations: number;
  teleportViolations: number;
  suspiciousActions: number;
  actionCounts: Map<string, { count: number; resetTime: number }>;
}

export class AntiCheat {
  private tracking: Map<string, PlayerTracking> = new Map();

  checkMovement(playerId: string, x: number, z: number): { valid: boolean; reason?: string } {
    let track = this.tracking.get(playerId);
    if (!track) {
      track = { lastX: x, lastZ: z, lastUpdate: Date.now(), speedViolations: 0, teleportViolations: 0, suspiciousActions: 0, actionCounts: new Map() };
      this.tracking.set(playerId, track);
      return { valid: true };
    }

    const posCheck = validatePosition(x, z, config.worldBounds);
    if (!posCheck.valid) {
      track.teleportViolations++;
      return { valid: false, reason: posCheck.error };
    }

    const now = Date.now();
    const dt = (now - track.lastUpdate) / 1000;
    if (dt > 0) {
      const dist = Math.sqrt((x - track.lastX) ** 2 + (z - track.lastZ) ** 2);
      const speed = dist / dt;
      if (speed > MAX_SPEED * 1.5) {
        track.speedViolations++;
        if (track.speedViolations >= SUSPICION_THRESHOLD) {
          return { valid: false, reason: 'Speed hack detected' };
        }
        return { valid: false, reason: 'Moving too fast' };
      }
      if (speed > MAX_SPEED) {
        track.speedViolations++;
      }
    }

    if (dt > 0 && dt < 5) {
      const dist = Math.sqrt((x - track.lastX) ** 2 + (z - track.lastZ) ** 2);
      if (dist > 50) {
        track.teleportViolations++;
        if (track.teleportViolations >= SUSPICION_THRESHOLD) {
          return { valid: false, reason: 'Teleport hack detected' };
        }
        return { valid: false, reason: 'Teleport detected' };
      }
    }

    track.lastX = x;
    track.lastZ = z;
    track.lastUpdate = now;
    return { valid: true };
  }

  checkRateLimit(playerId: string, actionType: string, maxPerSecond: number): boolean {
    let track = this.tracking.get(playerId);
    if (!track) {
      track = { lastX: 0, lastZ: 0, lastUpdate: Date.now(), speedViolations: 0, teleportViolations: 0, suspiciousActions: 0, actionCounts: new Map() };
      this.tracking.set(playerId, track);
    }
    const now = Date.now();
    let actionTrack = track.actionCounts.get(actionType);
    if (!actionTrack || now > actionTrack.resetTime) {
      actionTrack = { count: 0, resetTime: now + 1000 };
      track.actionCounts.set(actionType, actionTrack);
    }
    actionTrack.count++;
    return actionTrack.count <= maxPerSecond;
  }

  logSuspicious(playerId: string, reason: string): void {
    let track = this.tracking.get(playerId);
    if (track) {
      track.suspiciousActions++;
    }
  }

  getSuspicionLevel(playerId: string): number {
    const track = this.tracking.get(playerId);
    if (!track) return 0;
    return track.suspiciousActions;
  }
}
