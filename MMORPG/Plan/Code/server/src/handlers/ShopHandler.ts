import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';

export class ShopHandler {
  private room: WorldRoom;

  constructor(room: WorldRoom) {
    this.room = room;
  }

  handleOpen(client: Client, data: { npcId: string }): void {
    this.room.send(client, 'shop:opened', {
      npcId: data.npcId,
      items: [],
    });
  }

  handleBuy(client: Client, data: { itemId: number; quantity: number }): void {
    this.room.send(client, 'shop:bought', {
      itemId: data.itemId,
      quantity: data.quantity,
    });
  }

  handleSell(client: Client, data: { slot: number; quantity: number }): void {
    this.room.send(client, 'shop:sold', {
      slot: data.slot,
      quantity: data.quantity,
    });
  }
}
