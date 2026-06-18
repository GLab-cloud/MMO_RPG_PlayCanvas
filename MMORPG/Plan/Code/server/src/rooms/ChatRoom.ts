import { Room, Client } from 'colyseus';
import { Logger } from '../utils/Logger.js';

export class ChatRoom extends Room {
  private chatHistory: Array<{ channel: string; sender: string; text: string; timestamp: number }> = [];
  private maxHistory = 50;

  onCreate(): void {
    this.onMessage('chat:message', (client: Client, data: { channel: string; text: string; recipient?: string }) => {
      const playerName = client.userData?.username || 'Anonymous';

      const message = {
        channel: data.channel,
        sender: playerName,
        text: data.text.slice(0, 200),
        timestamp: Date.now(),
      };

      this.chatHistory.push(message);
      if (this.chatHistory.length > this.maxHistory) {
        this.chatHistory.shift();
      }

      if (data.recipient) {
        const targetClient = this.clients.find((c) => c.sessionId === data.recipient);
        if (targetClient) {
          this.send(targetClient, 'chat:message', message);
        }
        this.send(client, 'chat:message', message);
      } else {
        this.broadcast('chat:message', message);
      }
    });

    this.onMessage('chat:history', (client: Client) => {
      this.send(client, 'chat:history', { messages: this.chatHistory });
    });
  }

  onJoin(client: Client): void {
    Logger.info(`Chat client joined: ${client.sessionId}`);
    this.send(client, 'chat:history', { messages: this.chatHistory });
  }

  onLeave(client: Client): void {
    Logger.info(`Chat client left: ${client.sessionId}`);
  }
}
