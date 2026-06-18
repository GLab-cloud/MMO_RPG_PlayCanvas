import { Client } from 'colyseus';
import { WorldRoom } from '../rooms/WorldRoom.js';
import { AntiCheat } from '../security/AntiCheat.js';
import { Logger } from '../utils/Logger.js';

const CHANNEL_COLORS: Record<string, string> = {
  general: '#ffffff',
  party: '#3498db',
  guild: '#2ecc71',
  whisper: '#e91e63',
  world: '#f1c40f',
  shout: '#e74c3c',
};

export class ChatHandler {
  private room: WorldRoom;
  private antiCheat: AntiCheat;

  constructor(room: WorldRoom) {
    this.room = room;
    this.antiCheat = new AntiCheat();
  }

  handle(client: Client, data: { channel: string; text: string; recipientId?: string }): void {
    const player = this.room.state.players.get(client.sessionId);
    if (!player) return;

    if (!this.antiCheat.checkRateLimit('chat', client.sessionId)) {
      this.room.send(client, 'chat:error', { message: 'Slow down your chatting.' });
      return;
    }

    const sanitized = this.sanitizeText(data.text);
    if (!sanitized || sanitized.length > 200) return;

    const message = {
      id: `${Date.now()}-${client.sessionId}`,
      channel: data.channel,
      senderId: client.sessionId,
      senderName: player.name,
      text: sanitized,
      color: CHANNEL_COLORS[data.channel] || '#ffffff',
      timestamp: Date.now(),
    };

    switch (data.channel) {
      case 'whisper':
        if (data.recipientId) {
          this.room.send(client, 'chat:message', message);
          const recipient = this.room.state.players.get(data.recipientId);
          if (recipient) {
            this.room.clients.forEach((c) => {
              if (c.sessionId === data.recipientId) {
                this.room.send(c, 'chat:message', message);
              }
            });
          } else {
            this.room.send(client, 'chat:error', { message: 'Player not found.' });
          }
        }
        break;

      case 'party':
        this.room.broadcast('chat:message', message);
        break;

      case 'world':
      case 'shout':
        this.room.broadcast('chat:message', message);
        break;

      default:
        this.room.broadcast('chat:message', message);
        break;
    }
  }

  private sanitizeText(text: string): string {
    return text.trim().replace(/[<>&]/g, (c) => {
      switch (c) { case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; default: return c; }
    });
  }
}
