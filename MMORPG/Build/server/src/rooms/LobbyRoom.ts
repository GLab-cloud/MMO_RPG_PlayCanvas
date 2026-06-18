import colyseus from 'colyseus';
const { Room } = colyseus;
import { generateId } from '../utils/Helpers.js';

interface ChannelInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
}

interface LobbyState {
  channels: ChannelInfo[];
  characters: { id: string; name: string; level: number; class: string }[];
}

export class LobbyRoom extends Room<LobbyState> {
  maxClients = 100;

  onCreate(_options: any): void {
    this.setState({
      channels: [
        { id: 'channel-1', name: 'Channel 1', playerCount: 0, maxPlayers: 200 },
        { id: 'channel-2', name: 'Channel 2', playerCount: 0, maxPlayers: 200 },
        { id: 'channel-3', name: 'Channel 3', playerCount: 0, maxPlayers: 200 },
      ],
      characters: [],
    });

    this.onMessage('select_channel', (client, data: { channelId: string }) => {
      const channel = this.state.channels.find(c => c.id === data.channelId);
      if (channel) {
        client.send('channel_selected', { channelId: data.channelId, channelName: channel.name });
      }
    });

    this.onMessage('create_character', (client, data: { name: string; class: string }) => {
      const character = {
        id: generateId(),
        name: data.name,
        level: 1,
        class: data.class || 'adventurer',
      };
      this.state.characters.push(character);
      client.send('character_created', character);
    });

    this.onMessage('select_character', (client, data: { characterId: string }) => {
      const char = this.state.characters.find(c => c.id === data.characterId);
      if (char) {
        client.send('character_selected', char);
      }
    });
  }

  onJoin(client: Client): void {
    client.send('lobby_joined', { channels: this.state.channels, characters: this.state.characters });
  }

  onLeave(_client: Client): void {
  }

  onDispose(): void {
  }
}
