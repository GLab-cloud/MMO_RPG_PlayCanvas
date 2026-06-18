import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';
import { Logger } from '../utils/Logger.js';

export class PartyHandler {
  private room: WorldRoom;
  private parties: Map<string, { id: string; leaderId: string; members: string[] }> = new Map();

  constructor(room: WorldRoom) {
    this.room = room;
  }

  handleInvite(client: Client, data: { targetId: string }): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    const target = this.room.state.players.get(data.targetId);
    if (!target) {
      this.room.send(client, 'party:error', { message: 'Player not found' });
      return;
    }

    this.room.send(client, 'party:invite', {
      fromId: client.sessionId,
      fromName: player.name,
    });
  }

  handleAccept(client: Client, data: { partyId: string }): void {
    this.room.send(client, 'party:joined', { partyId: data.partyId });
  }

  handleLeave(client: Client): void {
    for (const [id, party] of this.parties) {
      const idx = party.members.indexOf(client.sessionId);
      if (idx >= 0) {
        party.members.splice(idx, 1);
        if (party.members.length === 0) {
          this.parties.delete(id);
        }
        this.room.broadcast('party:left', {
          partyId: id,
          sessionId: client.sessionId,
        });
        return;
      }
    }
  }

  handleKick(client: Client, data: { memberId: string }): void {
    for (const [_id, party] of this.parties) {
      if (party.leaderId === client.sessionId) {
        const idx = party.members.indexOf(data.memberId);
        if (idx >= 0) {
          party.members.splice(idx, 1);
          this.room.broadcast('party:kicked', {
            memberId: data.memberId,
          });
        }
        return;
      }
    }
  }

  handleDisconnect(client: Client): void {
    this.handleLeave(client);
  }
}
