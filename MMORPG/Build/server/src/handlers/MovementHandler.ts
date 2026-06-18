import { AntiCheat } from '../security/AntiCheat.js';
import { clamp } from '../utils/Helpers.js';
import { config } from '../config.js';

export class MovementHandler {
  private antiCheat: AntiCheat;

  constructor(antiCheat: AntiCheat) {
    this.antiCheat = antiCheat;
  }

  handleMove(player: { id: string; x: number; z: number; rotation: number; speed: number }, data: { x: number; z: number; rotation: number }): { valid: boolean; x: number; z: number; rotation: number } | { valid: false; reason: string } {
    const check = this.antiCheat.checkMovement(player.id, data.x, data.z);
    if (!check.valid) {
      return { valid: false, reason: check.reason! };
    }
    player.x = clamp(data.x, config.worldBounds.minX, config.worldBounds.maxX);
    player.z = clamp(data.z, config.worldBounds.minZ, config.worldBounds.maxZ);
    player.rotation = data.rotation;
    return { valid: true, x: player.x, z: player.z, rotation: player.rotation };
  }
}
