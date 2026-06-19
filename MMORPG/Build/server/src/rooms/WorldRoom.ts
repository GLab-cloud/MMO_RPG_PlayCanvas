import colyseus from 'colyseus';
const { Room } = colyseus;
import type { Client } from 'colyseus';
import { WorldState, PlayerState, MonsterState } from '../schema/WorldState.js';
import { MovementHandler } from '../handlers/MovementHandler.js';
import { CombatHandler } from '../handlers/CombatHandler.js';
import { InventoryHandler, Item } from '../handlers/InventoryHandler.js';
import { SkillHandler } from '../handlers/SkillHandler.js';
import { PartyHandler } from '../handlers/PartyHandler.js';
import { ChatHandler, ChatChannel } from '../handlers/ChatHandler.js';
import { LootHandler } from '../handlers/LootHandler.js';
import { QuestHandler } from '../handlers/QuestHandler.js';
import { ShopHandler } from '../handlers/ShopHandler.js';
import { MountHandler } from '../handlers/MountHandler.js';
import { TradeHandler } from '../handlers/TradeHandler.js';
import { GuildHandler } from '../handlers/GuildHandler.js';
import { AISystem } from '../systems/AISystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { EnvironmentSystem } from '../systems/EnvironmentSystem.js';
import { BuffSystem } from '../systems/BuffSystem.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { AntiCheat } from '../security/AntiCheat.js';
import { generateId } from '../utils/Helpers.js';
import { config } from '../config.js';
import { hpFromStats, mpFromStats } from '../utils/Formulas.js';

const MONSTER_TEMPLATES: Record<string, any> = {
  rat: { name: 'Rat', level: 1, hp: 30, maxHp: 30, attack: 5, defense: 2, magicAttack: 0, magicDefense: 1, speed: 2, aggroRange: 8, attackRange: 1.5, xpReward: 15 },
  wolf: { name: 'Wolf', level: 5, hp: 80, maxHp: 80, attack: 12, defense: 5, magicAttack: 0, magicDefense: 2, speed: 4, aggroRange: 12, attackRange: 1.5, xpReward: 40 },
  bear: { name: 'Bear', level: 10, hp: 200, maxHp: 200, attack: 20, defense: 10, magicAttack: 0, magicDefense: 5, speed: 2.5, aggroRange: 10, attackRange: 2, xpReward: 100 },
  goblin: { name: 'Goblin', level: 3, hp: 50, maxHp: 50, attack: 8, defense: 3, magicAttack: 2, magicDefense: 3, speed: 3, aggroRange: 10, attackRange: 1.5, xpReward: 25 },
  orc: { name: 'Orc', level: 8, hp: 150, maxHp: 150, attack: 16, defense: 8, magicAttack: 0, magicDefense: 4, speed: 3, aggroRange: 10, attackRange: 2, xpReward: 70 },
  troll: { name: 'Troll', level: 15, hp: 400, maxHp: 400, attack: 30, defense: 15, magicAttack: 0, magicDefense: 8, speed: 2, aggroRange: 12, attackRange: 2.5, xpReward: 180 },
  dragon_whelp: { name: 'Dragon Whelp', level: 20, hp: 500, maxHp: 500, attack: 40, defense: 20, magicAttack: 15, magicDefense: 20, speed: 3.5, aggroRange: 15, attackRange: 3, xpReward: 300 },
  skeleton: { name: 'Skeleton', level: 7, hp: 100, maxHp: 100, attack: 14, defense: 6, magicAttack: 0, magicDefense: 10, speed: 2.5, aggroRange: 10, attackRange: 1.5, xpReward: 55 },
  zombie: { name: 'Zombie', level: 6, hp: 120, maxHp: 120, attack: 10, defense: 7, magicAttack: 0, magicDefense: 3, speed: 1.5, aggroRange: 6, attackRange: 1.5, xpReward: 45 },
  ghost: { name: 'Ghost', level: 12, hp: 100, maxHp: 100, attack: 18, defense: 5, magicAttack: 20, magicDefense: 15, speed: 4, aggroRange: 14, attackRange: 3, xpReward: 130 },
};

export class WorldRoom extends Room<WorldState> {
  maxClients = config.maxPlayersPerWorld;

  private movementHandler!: MovementHandler;
  private combatHandler!: CombatHandler;
  private inventoryHandler!: InventoryHandler;
  private skillHandler!: SkillHandler;
  private partyHandler!: PartyHandler;
  private chatHandler!: ChatHandler;
  private lootHandler!: LootHandler;
  private questHandler!: QuestHandler;
  private shopHandler!: ShopHandler;
  private mountHandler!: MountHandler;
  private tradeHandler!: TradeHandler;
  private guildHandler!: GuildHandler;
  private aiSystem!: AISystem;
  private spawnSystem!: SpawnSystem;
  private environmentSystem!: EnvironmentSystem;
  private buffSystem!: BuffSystem;
  private levelSystem!: LevelSystem;
  private antiCheat!: AntiCheat;

  private gameLoop!: ReturnType<typeof setInterval>;
  private deltaTime: number = 0;
  private lastTick: number = Date.now();
  private tickRate: number = 50;

  private playerInventories: Map<string, Item[]> = new Map();
  private playerMounts: Map<string, string | null> = new Map();
  private activeTrades: Map<string, string> = new Map();

  onCreate(_options: any): void {
    this.setState(new WorldState());

    this.antiCheat = new AntiCheat();
    this.movementHandler = new MovementHandler(this.antiCheat);
    this.combatHandler = new CombatHandler();
    this.inventoryHandler = new InventoryHandler();
    this.skillHandler = new SkillHandler();
    this.partyHandler = new PartyHandler();
    this.chatHandler = new ChatHandler();
    this.lootHandler = new LootHandler();
    this.questHandler = new QuestHandler();
    this.shopHandler = new ShopHandler();
    this.mountHandler = new MountHandler();
    this.tradeHandler = new TradeHandler();
    this.guildHandler = new GuildHandler();
    this.aiSystem = new AISystem();
    this.spawnSystem = new SpawnSystem();
    this.environmentSystem = new EnvironmentSystem();
    this.buffSystem = new BuffSystem();
    this.levelSystem = new LevelSystem();

    this.spawnSystem.initialize(50);
    this.initializeMonsters();

    this.registerMessageHandlers();
    this.startGameLoop();
  }

  private initializeMonsters(): void {
    for (const point of this.spawnSystem.spawnPoints.values()) {
      this.spawnMonster(point.monsterTemplateId, point.x, point.z);
    }
  }

  private spawnMonster(templateId: string, x: number, z: number): string {
    const template = MONSTER_TEMPLATES[templateId];
    if (!template) return '';
    const id = generateId();
    const monster = new MonsterState();
    monster.id = id;
    monster.templateId = templateId;
    monster.name = template.name || 'Unknown';
    monster.x = x;
    monster.z = z;
    monster.hp = template.hp || 50;
    monster.maxHp = template.maxHp || 50;
    monster.level = template.level || 1;
    monster.attack = template.attack || 5;
    monster.defense = template.defense || 2;
    monster.magicAttack = template.magicAttack || 0;
    monster.magicDefense = template.magicDefense || 1;
    monster.speed = template.speed || 2;
    monster.aggroRange = template.aggroRange || 8;
    monster.attackRange = template.attackRange || 1.5;
    monster.xpReward = template.xpReward || 15;
    this.state.monsters.set(id, monster);
    return id;
  }

  private registerMessageHandlers(): void {
    this.onMessage('ping', (client: any) => {
      client.send('pong', { t: Date.now() });
    });

    this.onMessage('player:move', (client, data: { x: number; z: number; rotation: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (!this.antiCheat.checkRateLimit(client.sessionId, 'move', 20)) return;
      const result = this.movementHandler.handleMove(player, data);
      if (!result.valid) {
        client.send('player:move_rejected', { reason: (result as any).reason });
        this.antiCheat.logSuspicious(client.sessionId, (result as any).reason);
        return;
      }
      this.broadcast('player:moved', { id: player.id, x: player.x, z: player.z, rotation: player.rotation }, { except: client });
    });

    this.onMessage('player:action', (client, data: { type: string; targetId?: string; skillId?: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (data.type === 'attack' && data.targetId) {
        const monster = this.state.monsters.get(data.targetId);
        if (!monster) {
          client.send('combat:error', { error: 'Target not found' });
          return;
        }
        const result = this.combatHandler.handleAttack(player, monster, this.state.monsters, this.lootHandler.getLootSpawns());
        if (result.killed && result.xpReward) {
          const leveledUp = this.levelSystem.addXp(player.level, player.xp, result.xpReward);
          player.xp = leveledUp.newXp;
          if (leveledUp.leveledUp) {
            player.level = leveledUp.newLevel;
            player.statPoints += leveledUp.statPointsGained;
            player.maxHp = hpFromStats(player.stamina, player.level);
            player.maxMp = mpFromStats(player.intelligence, player.level);
            player.hp = player.maxHp;
            player.mp = player.maxMp;
            this.broadcast('player:leveled_up', { id: player.id, name: player.name, newLevel: player.level });
          }
          this.broadcast('combat:kill', { monsterId: monster.id, playerId: player.id, xp: result.xpReward });
          const lootSpawns = this.lootHandler.getLootSpawns();
          for (const loot of lootSpawns.values()) {
            this.broadcast('loot:spawned', { id: loot.id, x: loot.x, z: loot.z });
          }
        } else {
          this.broadcast('combat:damage', { monsterId: monster.id, playerId: player.id, damage: result.damage, critical: result.critical });
        }
      } else if (data.type === 'skill' && data.skillId && data.targetId) {
        const skillResult = this.skillHandler.useSkill(player, data.skillId);
        if (!skillResult.success) {
          client.send('skill:error', { error: skillResult.error });
          return;
        }
        const monster = this.state.monsters.get(data.targetId);
        if (monster && skillResult.skill) {
          const dmg = Math.floor((player.attack * skillResult.skill.multiplier) - monster.defense * 0.5);
          monster.hp -= Math.max(1, dmg);
          if (monster.hp <= 0) {
            this.state.monsters.delete(monster.id);
            this.broadcast('combat:kill', { monsterId: monster.id, playerId: player.id, xp: monster.xpReward });
          } else {
            this.broadcast('combat:damage', { monsterId: monster.id, playerId: player.id, damage: dmg, critical: false });
          }
        }
        this.broadcast('skill:used', { playerId: player.id, skillId: data.skillId });
      }
    });

    this.onMessage('player:chat', (client, data: { message: string; channel: string; target?: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const result = this.chatHandler.handleChat(client.sessionId, player.name, { ...data, channel: data.channel as ChatChannel });
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
        }
      }
    });

    this.onMessage('player:emote', (client, data: { emote: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      this.broadcast('player:emoted', { id: player.id, emote: data.emote });
    });

    this.onMessage('inventory:move', (client, data: { fromSlot: number; toSlot: number }) => {
      const items = this.playerInventories.get(client.sessionId) || [];
      const result = this.inventoryHandler.handleMove(data, items);
      this.playerInventories.set(client.sessionId, result);
      client.send('inventory:updated', { items: result });
    });

    this.onMessage('inventory:use', (client, data: { slot: number }) => {
      const items = this.playerInventories.get(client.sessionId) || [];
      const result = this.inventoryHandler.handleUse(data, items);
      this.playerInventories.set(client.sessionId, result.updatedItems);
      client.send('inventory:updated', { items: result.updatedItems });
      if (result.effect) {
        client.send('inventory:effect', { effect: result.effect });
      }
    });

    this.onMessage('inventory:equip', (client, data: { slot: number }) => {
      const items = this.playerInventories.get(client.sessionId) || [];
      const result = this.inventoryHandler.handleEquip(data, items);
      this.playerInventories.set(client.sessionId, result);
      client.send('inventory:updated', { items: result });
    });

    this.onMessage('inventory:drop', (client, data: { slot: number }) => {
      const items = this.playerInventories.get(client.sessionId) || [];
      const result = this.inventoryHandler.handleDrop(data, items);
      this.playerInventories.set(client.sessionId, result.updatedItems);
      client.send('inventory:updated', { items: result.updatedItems });
    });

    this.onMessage('inventory:pickup', (client, data: { lootId: string; slot: number }) => {
      const items = this.playerInventories.get(client.sessionId) || [];
      const result = this.inventoryHandler.handlePickup(data, this.lootHandler.getLootSpawns(), items);
      this.playerInventories.set(client.sessionId, result.updatedItems);
      client.send('inventory:updated', { items: result.updatedItems });
      if (result.lootRemoved) {
        this.broadcast('loot:despawned', { lootId: data.lootId });
      }
    });

    this.onMessage('party:invite', (client, data: { targetId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const targetPlayer = this.state.players.get(data.targetId);
      if (!targetPlayer) { client.send('party:error', { error: 'Player not found' }); return; }
      const result = this.partyHandler.handleInvite(client.sessionId, player.name, data.targetId);
      if (!result.success) { client.send('party:error', { error: result.error }); return; }
      this.broadcast('party:invited', { fromId: client.sessionId, fromName: player.name, partyId: result.partyId }, { except: client });
    });

    this.onMessage('party:accept', (client, data: { partyId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const result = this.partyHandler.handleAccept(client.sessionId, player.name, data.partyId);
      if (!result.success) { client.send('party:error', { error: result.error }); return; }
      const party = this.partyHandler.getParty(client.sessionId);
      this.broadcast('party:updated', { partyId: data.partyId, members: party?.members || [] });
    });

    this.onMessage('party:leave', (client) => {
      const result = this.partyHandler.handleLeave(client.sessionId);
      if (!result.success) { client.send('party:error', { error: result.error }); return; }
      const player = this.state.players.get(client.sessionId);
      if (player) player.partyId = '';
      if (result.disbanded) {
        this.broadcast('party:disbanded', {});
      }
    });

    this.onMessage('party:kick', (client, data: { targetId: string }) => {
      const result = this.partyHandler.handleKick(client.sessionId, data.targetId);
      if (!result.success) { client.send('party:error', { error: result.error }); return; }
      const kickedPlayer = this.state.players.get(data.targetId);
      if (kickedPlayer) kickedPlayer.partyId = '';
      const party = this.partyHandler.getParty(client.sessionId);
      this.broadcast('party:updated', { partyId: party?.id, members: party?.members || [] });
    });

    this.onMessage('trade:request', (client, data: { targetId: string }) => {
      const result = this.tradeHandler.handleRequest(client.sessionId, data.targetId);
      if (!result.success) { client.send('trade:error', { error: result.error }); return; }
      this.broadcast('trade:requested', { fromId: client.sessionId, tradeId: result.tradeId });
    });

    this.onMessage('trade:accept', (client, data: { tradeId: string }) => {
      const result = this.tradeHandler.handleAccept(data.tradeId, client.sessionId);
      if (!result.success) { client.send('trade:error', { error: result.error }); return; }
      this.broadcast('trade:accepted', { tradeId: data.tradeId });
    });

    this.onMessage('trade:addItem', (client, data: { tradeId: string; item: { id: string; name: string; quantity: number } }) => {
      const result = this.tradeHandler.handleAddItem(data.tradeId, client.sessionId, data.item);
      if (!result.success) { client.send('trade:error', { error: result.error }); return; }
      this.broadcast('trade:item_added', { tradeId: data.tradeId });
    });

    this.onMessage('trade:confirm', (client, data: { tradeId: string }) => {
      const result = this.tradeHandler.handleConfirm(data.tradeId, client.sessionId);
      if (!result.success) { client.send('trade:error', { error: result.error }); return; }
      if (result.completed) {
        this.broadcast('trade:completed', { tradeId: data.tradeId });
      } else {
        this.broadcast('trade:confirmed', { tradeId: data.tradeId, playerId: client.sessionId });
      }
    });

    this.onMessage('guild:create', (client, data: { name: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const result = this.guildHandler.handleCreate(client.sessionId, player.name, data.name);
      if (!result.success) { client.send('guild:error', { error: result.error }); return; }
      player.guildId = result.guildId || '';
      client.send('guild:created', { guildId: result.guildId, name: data.name });
    });

    this.onMessage('guild:invite', (client, data: { targetId: string }) => {
      const result = this.guildHandler.handleInvite(client.sessionId, data.targetId);
      if (!result.success) { client.send('guild:error', { error: result.error }); return; }
      this.broadcast('guild:invited', { fromId: client.sessionId, toId: data.targetId });
    });

    this.onMessage('guild:accept', (client, data: { guildId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const result = this.guildHandler.handleAccept(client.sessionId, player.name, data.guildId);
      if (!result.success) { client.send('guild:error', { error: result.error }); return; }
      player.guildId = data.guildId;
      client.send('guild:joined', { guildId: data.guildId });
    });

    this.onMessage('guild:leave', (client) => {
      const player = this.state.players.get(client.sessionId);
      const result = this.guildHandler.handleLeave(client.sessionId);
      if (!result.success) { client.send('guild:error', { error: result.error }); return; }
      if (player) player.guildId = '';
      client.send('guild:left', {});
    });

    this.onMessage('quest:accept', (client, data: { questId: string }) => {
      const result = this.questHandler.handleAccept(client.sessionId, data.questId);
      if (!result.success) { client.send('quest:error', { error: result.error }); return; }
      client.send('quest:accepted', { quest: result.quest });
    });

    this.onMessage('quest:progress', (client, data: { questId: string; objectiveType: string; targetId: string }) => {
      const result = this.questHandler.handleProgress(client.sessionId, data.questId, data.objectiveType, data.targetId);
      if (!result.success) { client.send('quest:error', { error: result.error }); return; }
      client.send('quest:updated', { quest: result.updated });
    });

    this.onMessage('quest:complete', (client, data: { questId: string }) => {
      const result = this.questHandler.handleComplete(client.sessionId, data.questId);
      if (!result.success) { client.send('quest:error', { error: result.error }); return; }
      client.send('quest:completed', { questId: data.questId, rewards: result.rewards });
    });

    this.onMessage('quest:turnIn', (client, data: { questId: string }) => {
      const result = this.questHandler.handleTurnIn(client.sessionId, data.questId);
      if (!result.success) { client.send('quest:error', { error: result.error }); return; }
      client.send('quest:turned_in', { questId: data.questId, rewards: result.rewards });
    });

    this.onMessage('shop:open', (client, data: { shopId: string }) => {
      const result = this.shopHandler.handleOpen(data.shopId);
      if (!result.success) { client.send('shop:error', { error: result.error }); return; }
      client.send('shop:opened', { shop: result.shop });
    });

    this.onMessage('shop:buy', (client, data: { shopId: string; itemId: string; quantity: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const result = this.shopHandler.handleBuy(player.gold, data.shopId, data.itemId, data.quantity);
      if (!result.success) { client.send('shop:error', { error: result.error }); return; }
      player.gold -= result.totalCost!;
      client.send('shop:bought', { item: result.item, totalCost: result.totalCost, remainingGold: player.gold });
    });

    this.onMessage('shop:sell', (client, data: { itemPrice: number; quantity: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const result = this.shopHandler.handleSell(data.itemPrice, data.quantity);
      player.gold += result.goldEarned;
      client.send('shop:sold', { goldEarned: result.goldEarned, totalGold: player.gold });
    });

    this.onMessage('mount:mount', (client, data: { mountId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const result = this.mountHandler.handleMount(this.playerMounts.get(client.sessionId) || null, data.mountId);
      if (!result.success) { client.send('mount:error', { error: result.error }); return; }
      this.playerMounts.set(client.sessionId, data.mountId);
      player.mounted = true;
      player.mountId = data.mountId;
      player.speed = result.mount!.speed;
      client.send('mount:mounted', { mount: result.mount });
      this.broadcast('player:mounted', { id: player.id, mountId: data.mountId });
    });

    this.onMessage('mount:dismount', (client) => {
      const player = this.state.players.get(client.sessionId);
      const result = this.mountHandler.handleDismount(this.playerMounts.get(client.sessionId) || null);
      if (!result.success) { client.send('mount:error', { error: result.error }); return; }
      this.playerMounts.set(client.sessionId, null);
      if (player) {
        player.mounted = false;
        player.mountId = '';
        player.speed = 5;
      }
      client.send('mount:dismounted', {});
      if (player) this.broadcast('player:dismounted', { id: player.id });
    });

    this.onMessage('mount:altitude', (client, data: { altitude: number }) => {
      const result = this.mountHandler.handleAltitude(this.playerMounts.get(client.sessionId) || null, data.altitude);
      if (!result.success) { client.send('mount:error', { error: result.error }); return; }
      this.broadcast('mount:altitude_changed', { playerId: client.sessionId, altitude: data.altitude });
    });
  }

  private startGameLoop(): void {
    this.lastTick = Date.now();
    this.gameLoop = setInterval(() => {
      const now = Date.now();
      this.deltaTime = (now - this.lastTick) / 1000;
      this.lastTick = now;
      this.tick(this.deltaTime);
    }, this.tickRate);
  }

  private tick(dt: number): void {
    const env = this.environmentSystem.update(dt);
    this.state.timeOfDay = env.timeOfDay;
    this.state.weather = env.weather;

    const aiMonsters = new Map<string, any>();
    for (const [id, m] of this.state.monsters) {
      aiMonsters.set(id, {
        id: m.id,
        x: m.x,
        z: m.z,
        level: m.level,
        hp: m.hp,
        maxHp: m.maxHp,
        aggroRange: m.aggroRange,
        attackRange: m.attackRange,
        moveSpeed: m.speed,
        state: m.state,
        targetId: m.targetId,
        patrolPoint: { x: m.x + (Math.random() - 0.5) * 10, z: m.z + (Math.random() - 0.5) * 10 },
      });
    }
    const aiPlayers = new Map<string, any>();
    for (const [id, p] of this.state.players) {
      aiPlayers.set(id, { id: p.id, x: p.x, z: p.z, level: p.level });
    }
    this.aiSystem.update(aiMonsters, aiPlayers, dt);
    for (const [id, aiM] of aiMonsters) {
      const monster = this.state.monsters.get(id);
      if (monster) {
        monster.x = aiM.x;
        monster.z = aiM.z;
        monster.state = aiM.state;
        monster.targetId = aiM.targetId || '';
      }
    }

    this.spawnSystem.update(dt, this.state.monsters, (templateId, x, z) => this.spawnMonster(templateId, x, z));

    const despawnedLoot = this.lootHandler.update(dt);
    for (const lootId of despawnedLoot) {
      this.broadcast('loot:despawned', { lootId });
    }

    for (const [sessionId] of this.state.players) {
      this.buffSystem.tick(sessionId, dt);
    }
  }

  private spawnCounter: number = 0;

  onJoin(client: Client, _options?: any, _auth?: any): void {
    const player = new PlayerState();
    player.id = generateId();
    player.sessionId = client.sessionId;
    player.name = `Player_${client.sessionId.slice(0, 4)}`;

    this.spawnCounter++;
    const angle = (this.spawnCounter / 10) * Math.PI * 2;
    const radius = 5 + (this.spawnCounter % 5) * 3;
    player.x = Math.cos(angle) * radius;
    player.z = Math.sin(angle) * radius;

    this.state.players.set(client.sessionId, player);
    this.playerInventories.set(client.sessionId, []);
    this.playerMounts.set(client.sessionId, null);

    client.send('world:joined', {
      playerId: player.id,
      sessionId: client.sessionId,
      x: player.x,
      z: player.z,
    });
    this.broadcast('player:joined', { id: player.id, name: player.name, x: player.x, z: player.z }, { except: client });
    client.send('world:state', {
      players: Array.from(this.state.players.values()).map((p: PlayerState) => ({ id: p.id, name: p.name, x: p.x, z: p.z, level: p.level })),
      monsters: Array.from(this.state.monsters.values()).map((m: MonsterState) => ({ id: m.id, name: m.name, x: m.x, z: m.z, hp: m.hp, maxHp: m.maxHp, level: m.level })),
      timeOfDay: this.state.timeOfDay,
      weather: this.state.weather,
    });
  }

  onLeave(client: Client): void {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      this.broadcast('player:left', { id: player.id, name: player.name });
    }
    this.state.players.delete(client.sessionId);
    this.playerInventories.delete(client.sessionId);
    this.playerMounts.delete(client.sessionId);
  }

  onDispose(): void {
    clearInterval(this.gameLoop);
  }
}
