import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';

export class SkillHandler {
  private room: WorldRoom;

  constructor(room: WorldRoom) {
    this.room = room;
  }

  handle(client: Client, data: { skillId: string; targetId?: string; x?: number; y?: number; z?: number }): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    this.room.broadcast('skill:used', {
      sessionId: client.sessionId,
      skillId: data.skillId,
      targetId: data.targetId,
      x: data.x,
      y: data.y,
      z: data.z,
    }, { except: client });
  }

  private calculateCooldown(skillId: string): number {
    return 3;
  }
}
