import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';

export class GuildHandler {
  private room: WorldRoom;
  private guilds: Map<string, { id: string; name: string; leaderId: string; members: string[] }> = new Map();

  constructor(room: WorldRoom) {
    this.room = room;
  }

  handleCreate(client: Client, data: { name: string }): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    const guildId = `guild_${Date.now()}`;
    this.guilds.set(guildId, {
      id: guildId,
      name: data.name,
      leaderId: client.sessionId,
      members: [client.sessionId],
    });

    this.room.send(client, 'guild:created', { guildId, name: data.name });
    this.room.broadcast('guild:new', { name: data.name, leaderName: player.name });
  }

  handleInvite(client: Client, data: { targetId: string }): void {
    this.room.send(client, 'guild:invited', { targetId: data.targetId });
  }

  handleAccept(client: Client, data: { guildId: string }): void {
    this.room.send(client, 'guild:joined', { guildId: data.guildId });
  }

  handleLeave(client: Client, data: { guildId: string }): void {
    this.room.send(client, 'guild:left', { guildId: data.guildId });
  }
}
