import { Room, Client } from 'colyseus';
import { Schema, MapSchema, type } from '@colyseus/schema';
import { Logger } from '../utils/Logger.js';
import { config } from '../config.js';
import { MovementHandler } from '../handlers/MovementHandler.js';
import { CombatHandler } from '../handlers/CombatHandler.js';
import { InventoryHandler } from '../handlers/InventoryHandler.js';
import { SkillHandler } from '../handlers/SkillHandler.js';
import { PartyHandler } from '../handlers/PartyHandler.js';
import { ChatHandler } from '../handlers/ChatHandler.js';
import { LootHandler } from '../handlers/LootHandler.js';
import { QuestHandler } from '../handlers/QuestHandler.js';
import { ShopHandler } from '../handlers/ShopHandler.js';
import { MountHandler } from '../handlers/MountHandler.js';
import { GuildHandler } from '../handlers/GuildHandler.js';
import { TradeHandler } from '../handlers/TradeHandler.js';
import { AISystem } from '../systems/AISystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { EnvironmentSystem } from '../systems/EnvironmentSystem.js';
import { AntiCheat } from '../security/AntiCheat.js';

class PlayerState extends Schema {
  @type('string') id!: string;
  @type('string') name!: string;
  @type('int8') level!: number;
  @type('float32') x!: number;
  @type('float32') y!: number;
  @type('float32') z!: number;
  @type('float32') rotation!: number;
  @type('int16') hp!: number;
  @type('int16') maxHp!: number;
  @type('int16') mp!: number;
  @type('int16') maxMp!: number;
  @type('string') class!: string;
  @type('string') mount!: string;
  @type('boolean') flying!: boolean;
  @type('int8') altitude!: number;
}

class MonsterState extends Schema {
  @type('string') id!: string;
  @type('int16') templateId!: number;
  @type('float32') x!: number;
  @type('float32') y!: number;
  @type('float32') z!: number;
  @type('float32') rotation!: number;
  @type('int16') hp!: number;
  @type('int16') maxHp!: number;
  @type('string') aiState!: string;
  @type('string') targetId!: string;
}

class WorldStateSchema extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: MonsterState }) monsters = new MapSchema<MonsterState>();
  @type('float32') time!: number;
  @type('string') weather!: string;
  @type('int16') playerCount!: number;
}

export class WorldRoom extends Room<WorldStateSchema> {
  private tickInterval!: ReturnType<typeof setInterval>;
  private handlers: Record<string, unknown> = {};
  private aiSystem!: AISystem;
  private spawnSystem!: SpawnSystem;
  private environmentSystem!: EnvironmentSystem;
  private antiCheat!: AntiCheat;
  private accumulatedTime = 0;

  onCreate(options: Record<string, unknown>): void {
    this.setState(new WorldStateSchema());

    this.handlers = {
      movement: new MovementHandler(this),
      combat: new CombatHandler(this),
      inventory: new InventoryHandler(this),
      skill: new SkillHandler(this),
      party: new PartyHandler(this),
      chat: new ChatHandler(this),
      loot: new LootHandler(this),
      quest: new QuestHandler(this),
      shop: new ShopHandler(this),
      mount: new MountHandler(this),
      guild: new GuildHandler(this),
      trade: new TradeHandler(this),
    };

    this.aiSystem = new AISystem(this);
    this.spawnSystem = new SpawnSystem(this);
    this.environmentSystem = new EnvironmentSystem(this);
    this.antiCheat = new AntiCheat();

    this.registerMessageHandlers();
    this.startTickLoop();

    this.clock.start();
    Logger.info(`World room created: ${this.roomId}`);
  }

  private registerMessageHandlers(): void {
    this.onMessage('player:move', (client, data) =>
      (this.handlers.movement as MovementHandler).handle(client, data));

    this.onMessage('player:action', (client, data) =>
      (this.handlers.combat as CombatHandler).handle(client, data));

    this.onMessage('inventory:move', (client, data) =>
      (this.handlers.inventory as InventoryHandler).handleMove(client, data));

    this.onMessage('inventory:use', (client, data) =>
      (this.handlers.inventory as InventoryHandler).handleUse(client, data));

    this.onMessage('inventory:equip', (client, data) =>
      (this.handlers.inventory as InventoryHandler).handleEquip(client, data));

    this.onMessage('player:chat', (client, data) =>
      (this.handlers.chat as ChatHandler).handle(client, data));

    this.onMessage('player:emote', (client, data) =>
      this.broadcast('player:emote', { sessionId: client.sessionId, emoteId: data.emoteId }));

    this.onMessage('party:invite', (client, data) =>
      (this.handlers.party as PartyHandler).handleInvite(client, data));

    this.onMessage('party:accept', (client, data) =>
      (this.handlers.party as PartyHandler).handleAccept(client, data));

    this.onMessage('party:leave', (client, _data) =>
      (this.handlers.party as PartyHandler).handleLeave(client));

    this.onMessage('party:kick', (client, data) =>
      (this.handlers.party as PartyHandler).handleKick(client, data));

    this.onMessage('trade:request', (client, data) =>
      (this.handlers.trade as TradeHandler).handleRequest(client, data));

    this.onMessage('trade:accept', (client, data) =>
      (this.handlers.trade as TradeHandler).handleAccept(client, data));

    this.onMessage('trade:addItem', (client, data) =>
      (this.handlers.trade as TradeHandler).handleAddItem(client, data));

    this.onMessage('trade:confirm', (client, data) =>
      (this.handlers.trade as TradeHandler).handleConfirm(client, data));
  }

  private startTickLoop(): void {
    const interval = 1000 / config.tickRate;
    this.tickInterval = setInterval(() => this.tick(), interval);
  }

  private tick(): void {
    const dt = 1 / config.tickRate;
    this.accumulatedTime += dt;

    (this.handlers.combat as CombatHandler).update(dt);
    this.aiSystem.update(dt);
    this.spawnSystem.update(dt);
    this.environmentSystem.update(dt);

    const playerStates = this.state.players;
    let count = 0;
    for (const _ of playerStates.keys()) count++;
    this.state.playerCount = count;
  }

  onJoin(client: Client, options: Record<string, unknown>): void {
    const playerState = new PlayerState();
    playerState.id = client.sessionId;
    playerState.name = (options.name as string) || 'Player';
    playerState.level = (options.level as number) || 1;
    playerState.x = (options.x as number) || 0;
    playerState.y = (options.y as number) || 0;
    playerState.z = (options.z as number) || 0;
    playerState.rotation = 0;
    playerState.hp = (options.hp as number) || 100;
    playerState.maxHp = playerState.hp;
    playerState.mp = (options.mp as number) || 50;
    playerState.maxMp = playerState.mp;
    playerState.class = (options.class as string) || 'Beginner';
    playerState.mount = '';
    playerState.flying = false;
    playerState.altitude = 0;

    this.state.players.set(client.sessionId, playerState);
    Logger.info(`Player joined: ${playerState.name} (${client.sessionId})`);

    this.broadcast('player:joined', {
      sessionId: client.sessionId,
      name: playerState.name,
    });
  }

  onLeave(client: Client): void {
    this.state.players.delete(client.sessionId);
    (this.handlers.party as PartyHandler).handleDisconnect(client);
    Logger.info(`Player left: ${client.sessionId}`);

    this.broadcast('player:left', { sessionId: client.sessionId });
  }

  onDispose(): void {
    clearInterval(this.tickInterval);
    Logger.info(`World room disposed: ${this.roomId}`);
  }
}
