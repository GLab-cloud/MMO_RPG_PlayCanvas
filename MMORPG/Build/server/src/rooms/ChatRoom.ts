import colyseus from 'colyseus';
const { Room } = colyseus;
import type { Client } from 'colyseus';
import { ChatHandler, ChatChannel } from '../handlers/ChatHandler.js';

interface ChatState {
  history: { sender: string; message: string; channel: string; timestamp: number }[];
}

export class ChatRoom extends Room<ChatState> {
  maxClients = 200;
  private chatHandler: ChatHandler = new ChatHandler();

  onCreate(_options: any): void {
    this.setState({ history: [] });

    this.onMessage('chat:message', (client, data: { message: string; channel: string; target?: string }) => {
      const senderId = client.sessionId;
      const senderName = data.target || `Player_${senderId.slice(0, 4)}`;
      const result = this.chatHandler.handleChat(senderId, senderName, { ...data, channel: data.channel as ChatChannel });
      if (!result.valid) {
        client.send('chat:error', { error: result.error });
        return;
      }
      if (result.broadcast) {
        this.broadcast('chat:message', result.broadcast);
      }
      if (result.whisper) {
        const targetClient = this.clients.find(c => c.sessionId === data.target);
        if (targetClient) {
          targetClient.send('chat:whisper', result.whisper);
          client.send('chat:whisper_sent', result.whisper);
        } else {
          client.send('chat:error', { error: 'Player not found' });
        }
      }
      this.state.history = this.chatHandler.getHistory();
    });
  }

  onJoin(client: Client): void {
    client.send('chat:history', { messages: this.chatHandler.getHistory() });
  }

  onLeave(_client: Client): void {
  }

  onDispose(): void {
  }
}
