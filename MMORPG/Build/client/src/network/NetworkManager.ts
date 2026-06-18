import { Client, Room } from 'colyseus.js';
import * as pc from 'playcanvas';
import { SceneManager } from '../scenes/SceneManager';
import { StateSync } from './StateSync';

export class NetworkManager {
  private client!: Client;
  private room: Room | null = null;
  private pcApp: pc.Application;
  private sceneManager: SceneManager;
  private stateSync: StateSync;
  private latency: number = 0;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private serverUrl: string = '';

  constructor(pcApp: pc.Application, sceneManager: SceneManager) {
    this.pcApp = pcApp;
    this.sceneManager = sceneManager;
    this.stateSync = new StateSync(pcApp);
  }

  async connect(serverUrl: string): Promise<void> {
    this.client = new Client(serverUrl);
    this.serverUrl = serverUrl;

    try {
      this.room = await this.client.joinOrCreate('world');
      this.setupHandlers();
      this.reconnectAttempts = 0;
      console.log('Connected to server');
    } catch (err) {
      console.error('Connection failed:', err);
      this.scheduleReconnect(serverUrl);
    }
  }

  private setupHandlers(): void {
    if (!this.room) return;

    this.room.onStateChange((state) => {
      this.stateSync.handleStateChange(state);
    });

    this.room.onLeave(() => {
      console.log('Disconnected from server');
      this.scheduleReconnect(this.serverUrl);
    });

    this.room.onError((err) => {
      console.error('Room error:', err);
    });

    setInterval(() => this.measureLatency(), 5000);
  }

  private async measureLatency(): Promise<void> {
    if (!this.room) return;
    const start = Date.now();
    try {
      await this.room.send('ping');
      this.latency = Date.now() - start;
    } catch {
      this.latency = -1;
    }
  }

  private scheduleReconnect(serverUrl: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    setTimeout(() => this.connect(serverUrl), delay);
  }

  sendMessage(type: string, data: unknown): void {
    if (this.room) {
      this.room.send(type, data);
    }
  }

  getLatency(): number {
    return this.latency;
  }

  getSessionId(): string | null {
    return this.room?.sessionId ?? null;
  }

  update(dt: number): void {
    this.stateSync.update(dt);
  }

  disconnect(): void {
    this.room?.leave();
    this.room = null;
  }
}
