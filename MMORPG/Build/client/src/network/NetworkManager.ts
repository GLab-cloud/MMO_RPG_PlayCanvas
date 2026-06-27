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
  onMatchStarting(matchId: string, difficulty?: string): void;
  onError(message: string): void;
  onLobbyConnected(): void;
  onWorldConnected(): void;
  onDisconnected(): void;
}

export interface CombatCallbacks {
  onDamageDealt(monsterId: string, damage: number, critical: boolean): void;
  onMonsterKilled(monsterId: string, xp: number): void;
  onPlayerDamage(attackerId: string, targetId: string, damage: number, critical: boolean): void;
  onPlayerKilled?(attackerId: string, targetId: string): void;
  onPlayerKilledByMonster?(attackerName: string): void;
  onScoreUpdate?(players: { id: string; name: string; kills: number; deaths: number; level: number }[]): void;
}

export class NetworkManager {
  onWeaponPickup: ((data: { templateId: string; name: string; attack: number; magicAttack: number; critRate: number; playerId: string }) => void) | null = null;

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
  private combatCallbacks: CombatCallbacks | null = null;
  private _localPlayerId: string = '';
  private onPlayerLeftCallback: ((id: string) => void) | null = null;
  onRespawnedCallback: ((x: number, z: number) => void) | null = null;

  constructor(pcApp: pc.Application, sceneManager: SceneManager) {
    this.pcApp = pcApp;
    this.sceneManager = sceneManager;
    this.stateSync = new StateSync(pcApp);
  }

  setCallbacks(cb: LobbyCallbacks): void {
    this.callbacks = cb;
  }

  setCombatCallbacks(cb: CombatCallbacks): void {
    this.combatCallbacks = cb;
  }

  setOnPlayerLeft(cb: (id: string) => void): void {
    this.onPlayerLeftCallback = cb;
  }

  get state(): ClientState {
    return this._state;
  }

  get localPlayerId(): string {
    return this._localPlayerId;
  }

  getStateSync(): StateSync {
    return this.stateSync;
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

  async joinWorldRoom(matchId: string, difficulty?: string): Promise<void> {
    if (this.lobbyRoom) {
      this.lobbyRoom.leave();
      this.lobbyRoom = null;
    }

    try {
      this.worldRoom = await this.client.joinOrCreate('world', { matchId, difficulty: difficulty || 'easy' });
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

  sendAttack(targetId: string, skillId?: string): void {
    this.sendToWorld('player:action', {
      type: skillId ? 'skill' : 'attack',
      targetId,
      skillId,
    });
  }

  sendPlayerAttack(targetId: string, x?: number, z?: number): void {
    this.sendToWorld('player:pvp_attack', { targetId, x, z });
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

    this.lobbyRoom.onMessage('match_starting', (data: { matchId: string; difficulty?: string }) => {
      this.callbacks?.onMatchStarting(data.matchId, data.difficulty);
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

    this.worldRoom.onStateChange((state) => {
      const monsters = Array.from((state as any).monsters?.values() || []).map((m: any) => ({
        id: m.id, name: m.name, x: m.x, z: m.z, hp: m.hp, maxHp: m.maxHp, level: m.level, state: m.state,
      }));
      this.stateSync.syncMonsterState(monsters);

      for (const p of (state as any).players?.values() || []) {
        this.stateSync.onPlayerHPUpdate?.(p.id, p.hp, p.maxHp);
        if (this.stateSync.onPlayerXPUpdate) {
          const xpNext = Math.floor(100 * Math.pow(p.level, 1.5) + 50 * p.level);
          this.stateSync.onPlayerXPUpdate(p.id, p.xp, xpNext);
        }
      }
    });

    this.worldRoom.onMessage('world:joined', (data: { playerId: string; sessionId: string; x: number; z: number }) => {
      this._localPlayerId = data.playerId;
      this.stateSync.setLocalPlayerId(data.playerId);
      console.log(`Spawned at (${data.x}, ${data.z}) with localPlayerId=${data.playerId}`);
    });

    this.worldRoom.onMessage('world:state', (data: { players: any[]; monsters: any[] }) => {
      this.stateSync.handleInitialState(data);
    });

    this.worldRoom.onMessage('player:joined', (data: { id: string; name: string; x: number; z: number }) => {
      this.stateSync.addPlayer(data.id, data);
    });

    this.worldRoom.onMessage('player:renamed', (data: { id: string; name: string }) => {
      this.stateSync.onPlayerRenamed?.(data.id, data.name);
    });

    this.worldRoom.onMessage('player:respawned', (data: { x: number; z: number }) => {
      this.onRespawnedCallback?.(data.x, data.z);
    });

    this.worldRoom.onMessage('player:left', (data: { id: string; name: string }) => {
      this.stateSync.removeEntity(data.id);
      this.onPlayerLeftCallback?.(data.id);
    });

    this.worldRoom.onMessage('player:moved', (data: { id: string; x: number; z: number; rotation: number }) => {
      this.stateSync.updatePosition(data.id, data.x, data.z, data.rotation);
    });

    this.worldRoom.onMessage('combat:damage', (data: { monsterId: string; playerId: string; damage: number; critical: boolean; hp: number; maxHp: number }) => {
      this.stateSync.flashEntity(data.monsterId);
      this.stateSync.onMonsterHPUpdate?.(data.monsterId, data.hp, data.maxHp);
      this.combatCallbacks?.onDamageDealt(data.monsterId, data.damage, data.critical);
    });

    this.worldRoom.onMessage('combat:kill', (data: { monsterId: string; playerId: string; xp: number }) => {
      this.stateSync.removeEntity(data.monsterId, false);
      if (data.playerId === this.stateSync.localPlayerId) {
        setTimeout(() => this.combatCallbacks?.onMonsterKilled(data.monsterId, data.xp), 400);
      }
    });

    this.worldRoom.onMessage('combat:player_damage', (data: { targetId: string; attackerId: string; damage: number; critical: boolean; hp: number; maxHp: number }) => {
      this.combatCallbacks?.onPlayerDamage(data.attackerId, data.targetId, data.damage, data.critical);
      this.stateSync.onPlayerHPUpdate?.(data.targetId, data.hp, data.maxHp);
    });

    this.worldRoom.onMessage('pvp:damage', (data: { targetId: string; attackerId: string; damage: number; critical: boolean; hp: number; maxHp: number }) => {
      this.combatCallbacks?.onPlayerDamage(data.attackerId, data.targetId, data.damage, data.critical);
      this.stateSync.onPlayerHPUpdate?.(data.targetId, data.hp, data.maxHp);
    });

    this.worldRoom.onMessage('monster:kill', (data: { targetId: string; attackerId: string; attackerName: string }) => {
      if (data.targetId === this.stateSync.localPlayerId) {
        this.combatCallbacks?.onPlayerKilledByMonster?.(data.attackerName);
      }
    });

    this.worldRoom.onMessage('pvp:kill', (data: { targetId: string; attackerId: string }) => {
      if (data.attackerId === this.stateSync.localPlayerId) {
        this.combatCallbacks?.onPlayerKilled?.(data.attackerId, data.targetId);
      }
    });

    this.worldRoom.onMessage('score:update', (data: { players: { id: string; name: string; kills: number; deaths: number; level: number }[] }) => {
      this.combatCallbacks?.onScoreUpdate?.(data.players);
    });

    this.worldRoom.onMessage('loot:spawned', (data: { id: string; x: number; z: number }) => {
      console.log('Loot spawned:', data);
    });

    this.worldRoom.onMessage('loot:despawned', (data: { lootId: string }) => {
      console.log('Loot despawned:', data);
    });

    this.worldRoom.onMessage('monster:spawned', (data: any) => {
      this.stateSync.addMonster(data.id, data);
    });

    this.worldRoom.onMessage('monster:despawned', (data: { id: string }) => {
      this.stateSync.removeEntity(data.id, false);
    });

    this.worldRoom.onMessage('weapon:spawned', (data: any) => {
      this.stateSync.addWeapon(data.id, data);
    });

    this.worldRoom.onMessage('weapon:picked_up', (data: { weaponId: string; playerId: string; templateId: string; name: string; attack: number; magicAttack: number; critRate: number }) => {
      this.stateSync.removeEntity(data.weaponId, false);
      this.onWeaponPickup?.({ templateId: data.templateId, name: data.name, attack: data.attack, magicAttack: data.magicAttack, critRate: data.critRate, playerId: data.playerId });
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
