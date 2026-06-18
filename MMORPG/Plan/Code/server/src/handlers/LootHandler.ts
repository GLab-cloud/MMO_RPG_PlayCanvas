import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';

export class LootHandler {
  private room: WorldRoom;

  constructor(room: WorldRoom) {
    this.room = room;
  }

  handlePickup(client: Client, data: { lootId: string; x: number; z: number }): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    const dist = Math.sqrt(
      Math.pow(player.x - data.x, 2) + Math.pow(player.z - data.z, 2)
    );

    if (dist > 3) {
      this.room.send(client, 'loot:error', { message: 'Too far away' });
      return;
    }

    const lootTypes = ['health', 'armor', 'ammo', 'gold'];
    const type = lootTypes[Math.floor(Math.random() * lootTypes.length)];

    this.room.send(client, 'loot:pickup', {
      lootId: data.lootId,
      type,
      quantity: type === 'gold' ? Math.floor(Math.random() * 100) + 10 : 1,
    });
  }
}
