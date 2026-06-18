import { Room, Client } from 'colyseus';
import { Logger } from '../utils/Logger.js';

interface LobbyState {
  channels: Array<{ id: string; name: string; playerCount: number; maxPlayers: number }>;
  serverStatus: string;
  playerCount: number;
}

export class LobbyRoom extends Room<LobbyState> {
  onCreate(): void {
    this.setState({
      channels: [
        { id: 'ch1', name: 'Flarine', playerCount: 0, maxPlayers: 200 },
        { id: 'ch2', name: 'Saint Morning', playerCount: 0, maxPlayers: 200 },
        { id: 'ch3', name: 'Darken', playerCount: 0, maxPlayers: 200 },
      ],
      serverStatus: 'online',
      playerCount: 0,
    });

    this.onMessage('select_channel', (client: Client, data: { channelId: string }) => {
      const channel = this.state.channels.find((c) => c.id === data.channelId);
      if (channel && channel.playerCount < channel.maxPlayers) {
        this.send(client, 'channel_selected', { channelId: data.channelId });
        Logger.info(`Player ${client.sessionId} selected channel ${data.channelId}`);
      } else {
        this.send(client, 'channel_full', { message: 'Channel is full' });
      }
    });

    this.onMessage('create_character', (client: Client, data: { name: string; class: string }) => {
      this.send(client, 'character_created', { name: data.name, class: data.class });
    });

    this.onMessage('select_character', (client: Client, data: { characterId: string }) => {
      this.send(client, 'entering_world', { characterId: data.characterId });
    });
  }

  onJoin(client: Client): void {
    this.state.playerCount++;
    Logger.info(`Player in lobby: ${client.sessionId}`);
  }

  onLeave(client: Client): void {
    this.state.playerCount--;
  }
}
