import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';
import { Logger } from '../utils/Logger.js';

export class InventoryHandler {
  private room: WorldRoom;

  constructor(room: WorldRoom) {
    this.room = room;
  }

  handleMove(client: Client, data: { fromSlot: number; toSlot: number }): void {
    this.room.send(client, 'inventory:moved', {
      fromSlot: data.fromSlot,
      toSlot: data.toSlot,
    });
  }

  handleUse(client: Client, data: { slot: number; targetId?: string }): void {
    this.room.send(client, 'inventory:used', { slot: data.slot });
  }

  handleEquip(client: Client, data: { slot: number }): void {
    this.room.send(client, 'inventory:equipped', { slot: data.slot });
  }

  handleDrop(client: Client, data: { slot: number; quantity: number }): void {
    this.room.send(client, 'inventory:dropped', {
      slot: data.slot,
      quantity: data.quantity,
    });
  }

  handlePickup(client: Client, data: { itemId: string }): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    this.room.send(client, 'inventory:pickup', { itemId: data.itemId });
  }
}
