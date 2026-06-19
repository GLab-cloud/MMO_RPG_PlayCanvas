import { Client, Room } from 'colyseus.js';
import * as pc from 'playcanvas';
import { SceneManager } from '../scenes/SceneManager';
import { StateSync } from './StateSync';

export type ClientState = 'disconnected' | 'lobby' | 'world';

export interface MatchInfo {
  id: string;
  name: string;
  map: string;
  maxPlayers: number;
  playerCount: number;
  players: { sessionId: string; name: string; isHost: boolean }[];
  status: 'waiting' | 'in_progress';
}

export interface LobbyCallbacks {
  onMatchList(matches: MatchInfo[]): void;
  onMatchCreated(matchId: string): void;
  onMatchJoined(matchId: string): void;
  onMatchStarting(matchId: string): void;
  onError(message: string): void;
  onLobbyConnected(): void;
  onWorldConnected(): void;
  onDisconnected(): void;
}

export class NetworkManager {
  private client!: Client;
  private lobbyRoom: Room | null = null;
  private worldRoom: Room | null = null;
  private pcApp: pc.Application;
  private sceneManager: SceneManager;
  private stateSync: StateSync;
  private latency: number = 0;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private serverUrl: string = '';
  private _state: ClientState = 'disconnected';
  private callbacks: LobbyCallbacks | null = null;

  constructor(pcApp: pc.Application, sceneManager: SceneManager) {
    this.pcApp = pcApp;
    this.sceneManager = sceneManager;
    this.stateSync = new StateSync(pcApp);
  }

  setCallbacks(cb: LobbyCallbacks): void {
    this.callbacks = cb;
  }

  get state(): ClientState {
    return this._state;
  }

  async connectToLobby(serverUrl: string): Promise<void> {
    if (this.lobbyRoom) return;
    this.serverUrl = serverUrl;
    this.client = new Client(serverUrl);

    try {
      this.lobbyRoom = await this.client.joinOrCreate('lobby');
      this.setupLobbyHandlers();
      this._state = 'lobby';
      this.reconnectAttempts = 0;
      console.log('Connected to lobby');
      this.callbacks?.onLobbyConnected();
    } catch (err) {
      console.error('Lobby connection failed:', err);
      this.scheduleReconnect();
    }
  }

  async joinWorldRoom(matchId: string): Promise<void> {
    if (this.lobbyRoom) {
      this.lobbyRoom.leave();
      this.lobbyRoom = null;
    }

    try {
      // Use joinOrCreate to automatically create world room instance on first join
      this.worldRoom = await this.client.joinOrCreate('world', { matchId });
      this.setupWorldHandlers();
      this._state = 'world';
      this.reconnectAttempts = 0;
      console.log('Joined world room for match:', matchId);
      this.callbacks?.onWorldConnected();
    } catch (err) {
      console.error('Join world failed:', err);
    }
  }

  leaveToLobby(): void {
    if (this.worldRoom) {
      this.worldRoom.leave();
      this.worldRoom = null;
    }
    this._state = 'disconnected';
    this.connectToLobby(this.serverUrl);
  }

  disconnect(): void {
    this.lobbyRoom?.leave();
    this.worldRoom?.leave();
    this.lobbyRoom = null;
    this.worldRoom = null;
    this._state = 'disconnected';
    this.callbacks?.onDisconnected();
  }

  sendToLobby(type: string, data: unknown): void {
    if (this.lobbyRoom) {
      this.lobbyRoom.send(type, data);
    }
  }

  sendToWorld(type: string, data: unknown): void {
    if (this.worldRoom) {
      this.worldRoom.send(type, data);
    }
  }

  private setupLobbyHandlers(): void {
    if (!this.lobbyRoom) return;

    this.lobbyRoom.onMessage('match_list', (data: { matches: MatchInfo[] }) => {
      this.callbacks?.onMatchList(data.matches);
    });

    this.lobbyRoom.onMessage('match_created', (data: { matchId: string }) => {
      this.callbacks?.onMatchCreated(data.matchId);
    });

    this.lobbyRoom.onMessage('match_joined', (data: { matchId: string }) => {
      this.callbacks?.onMatchJoined(data.matchId);
    });

    this.lobbyRoom.onMessage('match_starting', (data: { matchId: string }) => {
      this.callbacks?.onMatchStarting(data.matchId);
    });

    this.lobbyRoom.onMessage('error', (data: { message: string }) => {
      console.error('Lobby error:', data.message);
      this.callbacks?.onError(data.message);
    });

    this.lobbyRoom.onLeave(() => {
      console.log('Left lobby');
      if (this._state === 'lobby') {
        this._state = 'disconnected';
        this.lobbyRoom = null;
        this.callbacks?.onDisconnected();
      }
    });
  }

  private setupWorldHandlers(): void {
    if (!this.worldRoom) return;

    this.stateSync.setLocalSessionId(this.worldRoom.sessionId);

    this.worldRoom.onStateChange((state) => {
      this.stateSync.handleStateChange(state);
    });

    this.worldRoom.onMessage('ping', () => {
      // handled automatically
    });

    this.worldRoom.onMessage('pong', () => {
      // latency response - handled by send callback
    });

    this.worldRoom.onMessage('world:joined', (data: { playerId: string; sessionId: string; x: number; z: number }) => {
      console.log(`Spawned at (${data.x}, ${data.z})`);
    });

    this.worldRoom.onMessage('player:joined', (data: { id: string; name: string; x: number; z: number }) => {
      console.log(`Player joined: ${data.name} (${data.id}) at (${data.x}, ${data.z})`);
    });

    this.worldRoom.onMessage('player:left', (data: { id: string; name: string }) => {
      console.log(`Player left: ${data.name} (${data.id})`);
    });

    this.worldRoom.onLeave(() => {
      console.log('Left world room');
      if (this._state === 'world') {
        this._state = 'disconnected';
        this.worldRoom = null;
      }
    });

    this.worldRoom.onError((err) => {
      console.error('World room error:', err);
    });

    setInterval(() => this.measureLatency(), 5000);
  }

  private measureLatency(): void {
    if (!this.worldRoom) return;
    const start = Date.now();
    let resolved = false;
    const unreg = this.worldRoom.onMessage('pong', () => {
      if (!resolved) {
        resolved = true;
        this.latency = Date.now() - start;
        unreg();
      }
    });
    this.worldRoom.send('ping');
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        this.latency = -1;
        unreg();
      }
    }, 5000);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    setTimeout(() => this.connectToLobby(this.serverUrl), delay);
  }

  getLatency(): number {
    return this.latency;
  }

  getSessionId(): string | null {
    return this.worldRoom?.sessionId ?? this.lobbyRoom?.sessionId ?? null;
  }

  update(dt: number): void {
    this.stateSync.update(dt);
  }
}
