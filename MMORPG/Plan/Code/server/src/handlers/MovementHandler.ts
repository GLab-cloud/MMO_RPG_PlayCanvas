import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';
import { AntiCheat } from '../security/AntiCheat.js';
import { Logger } from '../utils/Logger.js';

export class MovementHandler {
  private room: WorldRoom;
  private antiCheat: AntiCheat;

  constructor(room: WorldRoom) {
    this.room = room;
    this.antiCheat = new AntiCheat();
  }

  handle(client: Client, data: { x: number; y: number; z: number; rotation: number }): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    if (!this.antiCheat.validateMovement(player, data)) {
      Logger.warn(`Speed hack detected for player ${client.sessionId}`);
      this.room.send(client, 'cheat:warning', { reason: 'invalid_movement' });
      return;
    }

    player.x = data.x;
    player.y = data.y;
    player.z = data.z;
    player.rotation = data.rotation ?? player.rotation;
  }
}
