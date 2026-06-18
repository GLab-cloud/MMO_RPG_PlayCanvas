import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';

export class TradeHandler {
  private room: WorldRoom;
  private activeTrades: Map<string, {
    requesterId: string;
    targetId: string;
    status: string;
    requesterConfirmed: boolean;
    targetConfirmed: boolean;
  }> = new Map();

  constructor(room: WorldRoom) {
    this.room = room;
  }

  handleRequest(client: Client, data: { targetId: string }): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    const target = this.room.state.players.get(data.targetId);
    if (!target) {
      this.room.send(client, 'trade:error', { message: 'Player not found' });
      return;
    }

    const tradeId = `trade_${Date.now()}_${client.sessionId}`;
    this.activeTrades.set(tradeId, {
      requesterId: client.sessionId,
      targetId: data.targetId,
      status: 'pending',
      requesterConfirmed: false,
      targetConfirmed: false,
    });

    this.room.send(client, 'trade:requested', { tradeId, targetId: data.targetId });
    this.room.send(client, { sessionId: client.sessionId } as Client, 'trade:request', {
      tradeId,
      fromId: client.sessionId,
      fromName: player.name,
    });
  }

  handleAccept(client: Client, data: { tradeId: string }): void {
    const trade = this.activeTrades.get(data.tradeId);
    if (!trade || trade.targetId !== client.sessionId) return;

    trade.status = 'accepted';
    this.room.send(client, 'trade:accepted', { tradeId: data.tradeId });
  }

  handleAddItem(client: Client, data: { tradeId: string; slot: number; quantity: number }): void {
    this.room.send(client, 'trade:itemAdded', {
      tradeId: data.tradeId,
      slot: data.slot,
      quantity: data.quantity,
    });
  }

  handleConfirm(client: Client, data: { tradeId: string }): void {
    const trade = this.activeTrades.get(data.tradeId);
    if (!trade) return;

    if (client.sessionId === trade.requesterId) {
      trade.requesterConfirmed = true;
    } else if (client.sessionId === trade.targetId) {
      trade.targetConfirmed = true;
    }

    if (trade.requesterConfirmed && trade.targetConfirmed) {
      trade.status = 'confirmed';
      this.room.broadcast('trade:completed', { tradeId: data.tradeId });
      this.activeTrades.delete(data.tradeId);
    }
  }
}
