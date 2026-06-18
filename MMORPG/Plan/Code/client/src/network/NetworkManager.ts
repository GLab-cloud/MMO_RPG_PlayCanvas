import { Client, Room } from 'colyseus.js';

interface WorldState {
  players: Map<string, { id: string; name: string; x: number; y: number; z: number; rotation: number; hp: number; maxHp: number; level: number }>;
  monsters: Map<string, { id: string; templateId: number; x: number; y: number; z: number; hp: number; maxHp: number }>;
  time: number;
  weather: string;
  playerCount: number;
}

export class NetworkManager {
  private client!: Client;
  private room!: Room<WorldState>;
  private sessionId: string = '';
  private authToken: string = '';
  private latency: number = 0;
  private messageHandlers: Map<string, (data: unknown) => void> = new Map();
  private stateChangeCallbacks: Array<(state: WorldState) => void> = [];
  private pendingActions: Array<{ action: string; data: unknown }> = [];

  async connect(serverUrl: string, token: string): Promise<void> {
    this.authToken = token;
    this.client = new Client(serverUrl);

    this.room = await this.client.joinOrCreate('world', {
      token,
      name: 'Player',
      level: 1,
      x: 0, y: 0, z: 0,
      hp: 100, mp: 50,
      class: 'Beginner',
    });

    this.sessionId = this.room.sessionId;

    this.room.onStateChange((state) => {
      this.stateChangeCallbacks.forEach((cb) => cb(state));
    });

    this.room.onMessage('*', (type, data) => {
      const handler = this.messageHandlers.get(type);
      if (handler) handler(data);
    });

    this.room.onLeave(() => {
      this.handleDisconnect();
    });
  }

  send(action: string, data: unknown): void {
    if (this.room) {
      this.room.send(action, data);
    } else {
      this.pendingActions.push({ action, data });
    }
  }

  onStateChange(callback: (state: WorldState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  onMessage(type: string, callback: (data: unknown) => void): void {
    this.messageHandlers.set(type, callback);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getLatency(): number {
    return this.latency;
  }

  async measureLatency(): Promise<number> {
    const start = Date.now();
    return new Promise((resolve) => {
      this.room.send('ping', {});
      this.room.onMessage('pong', () => {
        this.latency = Date.now() - start;
        resolve(this.latency);
      });
    });
  }

  disconnect(): void {
    if (this.room) {
      this.room.leave();
    }
  }

  private handleDisconnect(): void {
    console.log('Disconnected from server');
  }

  reconnect(): void {
    setTimeout(() => {
      this.connect(this.client['serverUrl'], this.authToken);
    }, 3000);
  }
}
