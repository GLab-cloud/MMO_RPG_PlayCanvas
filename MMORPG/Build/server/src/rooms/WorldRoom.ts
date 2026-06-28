import colyseus from 'colyseus';
const { Room } = colyseus;
import type { Client } from 'colyseus';
import { WorldState, PlayerState, MonsterState, WeaponState } from '../schema/WorldState.js';
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
import { MonsterState as MonsterAIState } from '../systems/AISystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { EnvironmentSystem } from '../systems/EnvironmentSystem.js';
import { BuffSystem } from '../systems/BuffSystem.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { AntiCheat } from '../security/AntiCheat.js';
import { generateId } from '../utils/Helpers.js';
import { config } from '../config.js';
import { hpFromStats, mpFromStats } from '../utils/Formulas.js';

type DifficultyKey = 'easy' | 'medium' | 'hard' | 'hardest';

const DIFFICULTY_MULTIPLIERS: Record<DifficultyKey, { hp: number; attack: number; speed: number; aggroRange: number; fleeThreshold: number; level: number; xpReward: number; defense: number; magicAttack: number; magicDefense: number }> = {
  easy: { hp: 1, attack: 0.5, speed: 1, aggroRange: 1, fleeThreshold: 0.1, level: 1, xpReward: 1, defense: 1, magicAttack: 0.5, magicDefense: 1 },
  medium: { hp: 1.5, attack: 0.65, speed: 1.1, aggroRange: 1.1, fleeThreshold: 0.15, level: 1.2, xpReward: 1.5, defense: 1.2, magicAttack: 0.65, magicDefense: 1.2 },
  hard: { hp: 2.5, attack: 0.9, speed: 1.2, aggroRange: 1.3, fleeThreshold: 0.2, level: 1.5, xpReward: 2.5, defense: 1.5, magicAttack: 0.9, magicDefense: 1.5 },
  hardest: { hp: 4, attack: 1.25, speed: 1.4, aggroRange: 1.5, fleeThreshold: 0, level: 2, xpReward: 4, defense: 2, magicAttack: 1.25, magicDefense: 2 },
};

function applyDifficulty(base: Record<string, any>, difficulty: DifficultyKey): Record<string, any> {
  const mult = DIFFICULTY_MULTIPLIERS[difficulty] ?? DIFFICULTY_MULTIPLIERS.easy;
  return {
    ...base,
    difficulty,
    hp: Math.floor(base.hp * mult.hp),
    maxHp: Math.floor(base.maxHp * mult.hp),
    attack: Math.floor(base.attack * mult.attack),
    speed: base.speed * mult.speed,
    aggroRange: base.aggroRange * mult.aggroRange,
    fleeThreshold: mult.fleeThreshold,
    level: Math.max(1, Math.floor(base.level * mult.level)),
    xpReward: Math.floor(base.xpReward * mult.xpReward),
    defense: Math.floor(base.defense * mult.defense),
    magicAttack: Math.floor(base.magicAttack * mult.magicAttack),
    magicDefense: Math.floor(base.magicDefense * mult.magicDefense),
  };
}

const BASE_MONSTER_TEMPLATES: Record<string, any> = {
  rat: { name: 'Rat', level: 1, hp: 30, maxHp: 30, attack: 5, defense: 2, magicAttack: 0, magicDefense: 1, speed: 2.5, aggroRange: 30, attackRange: 0.8, xpReward: 15 },
  wolf: { name: 'Wolf', level: 5, hp: 80, maxHp: 80, attack: 12, defense: 5, magicAttack: 0, magicDefense: 2, speed: 2.5, aggroRange: 40, attackRange: 0.8, xpReward: 40 },
  bear: { name: 'Bear', level: 10, hp: 200, maxHp: 200, attack: 20, defense: 10, magicAttack: 0, magicDefense: 5, speed: 2.5, aggroRange: 25, attackRange: 0.9, xpReward: 100 },
  goblin: { name: 'Goblin', level: 3, hp: 50, maxHp: 50, attack: 8, defense: 3, magicAttack: 2, magicDefense: 3, speed: 2.5, aggroRange: 30, attackRange: 0.8, xpReward: 25 },
  orc: { name: 'Orc', level: 8, hp: 150, maxHp: 150, attack: 16, defense: 8, magicAttack: 0, magicDefense: 4, speed: 2.5, aggroRange: 28, attackRange: 0.9, xpReward: 70 },
  troll: { name: 'Troll', level: 15, hp: 400, maxHp: 400, attack: 30, defense: 15, magicAttack: 0, magicDefense: 8, speed: 2.5, aggroRange: 22, attackRange: 1.0, xpReward: 180 },
  dragon_whelp: { name: 'Dragon Whelp', level: 20, hp: 500, maxHp: 500, attack: 13, defense: 20, magicAttack: 15, magicDefense: 20, speed: 2.5, aggroRange: 35, attackRange: 1.2, xpReward: 300 },
  skeleton: { name: 'Skeleton', level: 7, hp: 100, maxHp: 100, attack: 14, defense: 6, magicAttack: 0, magicDefense: 10, speed: 2.5, aggroRange: 28, attackRange: 0.8, xpReward: 55 },
  zombie: { name: 'Zombie', level: 6, hp: 120, maxHp: 120, attack: 10, defense: 7, magicAttack: 0, magicDefense: 3, speed: 2.5, aggroRange: 25, attackRange: 0.8, xpReward: 45 },
  ghost: { name: 'Ghost', level: 12, hp: 100, maxHp: 100, attack: 18, defense: 5, magicAttack: 20, magicDefense: 15, speed: 2.5, aggroRange: 35, attackRange: 1.0, xpReward: 130 },
};

const WEAPON_TEMPLATES: Record<string, any> = {
  sword: { name: 'Iron Sword', attack: 5, type: 'melee' },
  gun: { name: 'Pistol', attack: 6, type: 'ranged' },
  axe: { name: 'Battle Axe', attack: 7, type: 'melee' },
  staff: { name: 'Wooden Staff', magicAttack: 5, type: 'magic' },
  dagger: { name: 'Iron Dagger', attack: 4, critRate: 0.03, type: 'melee' },
  wand: { name: 'Magic Wand', magicAttack: 8, critRate: 0.02, type: 'magic' },
  orb: { name: 'Crystal Orb', magicAttack: 12, critRate: 0.05, type: 'magic' },
  tome: { name: 'Arcane Tome', magicAttack: 15, type: 'magic' },
  magic_staff: { name: 'Enchanted Staff', magicAttack: 20, type: 'magic' },
  crystal_sword: { name: 'Crystal Sword', attack: 8, magicAttack: 5, type: 'magic' },
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

  private difficulty: DifficultyKey = 'easy';
  private gameLoop!: ReturnType<typeof setInterval>;
  private deltaTime: number = 0;
  private lastTick: number = Date.now();
  private tickRate: number = 50;

  private playerInventories: Map<string, Item[]> = new Map();
  private playerMounts: Map<string, string | null> = new Map();
  private activeTrades: Map<string, string> = new Map();

  private spawnedWeapons: Map<string, { id: string; templateId: string; picked: boolean }> = new Map();
  private playerWeapons: Map<string, Set<string>> = new Map();

  private applyWeaponStats(player: PlayerState, templateId: string, remove: boolean = false): void {
    const template = WEAPON_TEMPLATES[templateId];
    if (!template) return;
    const sign = remove ? -1 : 1;
    if (template.attack) player.attack += template.attack * sign;
    if (template.magicAttack) player.magicAttack += template.magicAttack * sign;
    if (template.critRate) player.dexterity += Math.round(template.critRate * 100) * sign;
  }

  private triggerMonsterAggro(player: PlayerState): void {
    let nearest: { id: string; dist: number } | null = null;
    for (const [, m] of this.state.monsters) {
      if (m.hp <= 0) continue;
      if (m.state !== 'idle' || m.targetId) continue;
      const dx = player.x - m.x;
      const dz = player.z - m.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= m.aggroRange && (!nearest || dist < nearest.dist)) {
        nearest = { id: m.id, dist };
      }
    }
    if (nearest) {
      const monster = this.state.monsters.get(nearest.id);
      if (monster) {
        monster.state = MonsterAIState.Chase;
        monster.targetId = player.id;
        console.log(`TRIGGER aggro monster=${monster.name}(${nearest.id}) at dist=${nearest.dist.toFixed(2)} from player=${player.name}(${player.id}) at (${player.x.toFixed(2)},${player.z.toFixed(2)})`);
      }
    } else {
      console.log(`TRIGGER aggro FAILED - no idle monster within aggroRange of player=${player.name}(${player.id})`);
    }
  }

  onCreate(options: any): void {
    this.setState(new WorldState());
    this.difficulty = options.difficulty || 'easy';

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
    this.spawnInitialWeapons();

    this.registerMessageHandlers();
    this.startGameLoop();
  }

  private initializeMonsters(): void {
    for (const point of this.spawnSystem.spawnPoints.values()) {
      this.spawnMonster(point.monsterTemplateId, point.x, point.z);
    }
  }

  private spawnMonster(templateId: string, x: number, z: number): string {
    const base = BASE_MONSTER_TEMPLATES[templateId];
    if (!base) return '';
    const template = applyDifficulty(base, this.difficulty);
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
    monster.fleeThreshold = template.fleeThreshold ?? 0.1;
    monster.spawnX = x;
    monster.spawnZ = z;
    this.state.monsters.set(id, monster);
    this.broadcast('monster:spawned', { id, templateId, name: monster.name, x, z, hp: monster.hp, maxHp: monster.maxHp, level: monster.level });
    return id;
  }

  private spawnInitialWeapons(): void {
    const templates = Object.keys(WEAPON_TEMPLATES);
    for (const sessionId of this.state.players.keys()) {
      const player = this.state.players.get(sessionId);
      if (!player) continue;
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 3 + Math.random() * 5;
        const templateId = templates[Math.floor(Math.random() * templates.length)];
        if (templateId) this.spawnWeapon(templateId, player.x + Math.cos(angle) * dist, player.z + Math.sin(angle) * dist);
      }
    }
  }

  private spawnWeapon(templateId: string, x: number, z: number): string {
    const template = WEAPON_TEMPLATES[templateId];
    if (!template) return '';
    const id = generateId();
    const weapon = new WeaponState();
    weapon.id = id;
    weapon.templateId = templateId;
    weapon.name = template.name;
    weapon.x = x;
    weapon.z = z;
    this.state.weapons.set(id, weapon);
    this.spawnedWeapons.set(id, { id, templateId, picked: false });
    this.broadcast('weapon:spawned', { id, templateId, name: weapon.name, x: weapon.x, z: weapon.z });
    return id;
  }

  private registerMessageHandlers(): void {
    this.onMessage('player:set_name', (client, data: { name: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.name = data.name.slice(0, 16);
        this.broadcast('player:renamed', { id: player.id, name: player.name });
      }
    });

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

    this.onMessage('player:pvp_attack', (client, data: { targetId: string; x?: number; z?: number }) => {
      const attacker = this.state.players.get(client.sessionId);
      if (!attacker) return;
      if (!attacker.equippedWeapon) {
        client.send('combat:error', { error: 'No weapon equipped' });
        return;
      }
      if (data.x !== undefined && data.z !== undefined) {
        attacker.x = data.x; attacker.z = data.z;
      }
      const target = this.getPlayerByPlayerId(data.targetId);
      if (!target) {
        client.send('combat:error', { error: 'Target player not found' });
        return;
      }
      const dist = Math.sqrt(Math.pow(attacker.x - target.x, 2) + Math.pow(attacker.z - target.z, 2));
      if (dist > 6) return;
      const result = this.combatHandler.handlePvPAttack(attacker, target);
      if (result.killed) {
        attacker.kills++;
        target.deaths++;
        const leveledUp = this.levelSystem.addXp(attacker.level, attacker.xp, 20);
        attacker.xp = leveledUp.newXp;
        if (leveledUp.leveledUp) {
          attacker.level = leveledUp.newLevel;
          attacker.statPoints += leveledUp.statPointsGained;
        }
        this.broadcast('pvp:kill', { targetId: data.targetId, attackerId: attacker.id });
        this.broadcast('pvp:damage', { targetId: data.targetId, attackerId: attacker.id, damage: result.damage, critical: result.critical, hp: target.hp, maxHp: target.maxHp });
        this.broadcast('score:update', { players: Array.from(this.state.players.values()).map((p: PlayerState) => ({ id: p.id, name: p.name, kills: p.kills, deaths: p.deaths, level: p.level })) });
      } else {
        this.broadcast('pvp:damage', { targetId: data.targetId, attackerId: attacker.id, damage: result.damage, critical: result.critical, hp: target.hp, maxHp: target.maxHp });
      }
    });

    this.onMessage('player:respawn', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.hp = player.maxHp;
        this.recentlyRespawned.set(player.id, Date.now());
        if (player.equippedWeapon) {
          this.applyWeaponStats(player, player.equippedWeapon, true);
          player.equippedWeapon = '';
        }
        for (const [, m] of this.state.monsters) {
          if (m.targetId === player.id) {
            m.state = MonsterAIState.Idle;
            m.targetId = '';
          }
        }
        player.x = 0;
        player.z = 0;
        this.broadcast('player:moved', { id: player.id, x: 0, z: 0, rotation: 0 });
        client.send('player:respawned', { x: 0, z: 0 });
      }
    });

    this.onMessage('player:action', (client, data: { type: string; targetId?: string; skillId?: string; x?: number; z?: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (data.x !== undefined && data.z !== undefined) {
        player.x = data.x; player.z = data.z;
      }
      if (data.type === 'attack' && data.targetId) {
        if (!player.equippedWeapon) {
          client.send('combat:error', { error: 'No weapon equipped' });
          return;
        }
        const monster = this.state.monsters.get(data.targetId);
        if (!monster) {
          client.send('combat:error', { error: 'Target not found' });
          return;
        }
        const weaponTemplate = WEAPON_TEMPLATES[player.equippedWeapon];
        const weaponType = weaponTemplate?.type || 'melee';
        const result = this.combatHandler.handleAttack(player, monster, this.state.monsters, this.lootHandler.getLootSpawns(), weaponType);
        if (!result.killed && monster.hp > 0) {
          if (monster.hp < monster.maxHp * 0.2) {
            monster.state = MonsterAIState.Flee;
          } else if (monster.state !== MonsterAIState.Chase && monster.state !== MonsterAIState.Attack) {
            monster.state = MonsterAIState.Chase;
            monster.targetId = player.id;
          }
        }
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
          this.broadcast('combat:damage', { monsterId: monster.id, playerId: player.id, damage: result.damage, critical: result.critical, hp: monster.hp, maxHp: monster.maxHp });
          this.broadcast('combat:kill', { monsterId: monster.id, playerId: player.id, xp: result.xpReward });
          this.broadcast('monster:despawned', { id: monster.id, x: monster.x, z: monster.z });
          const loot = this.spawnMonsterLoot(monster.x, monster.z, monster.templateId, monster.level);
          if (loot) this.broadcast('loot:spawned', { id: loot.id, x: loot.x, z: loot.z, items: loot.items });
        } else {
          this.broadcast('combat:damage', { monsterId: monster.id, playerId: player.id, damage: result.damage, critical: result.critical, hp: monster.hp, maxHp: monster.maxHp });
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
            this.broadcast('combat:damage', { monsterId: monster.id, playerId: player.id, damage: dmg, critical: false, hp: 0, maxHp: monster.maxHp });
            this.broadcast('combat:kill', { monsterId: monster.id, playerId: player.id, xp: monster.xpReward });
            this.broadcast('monster:despawned', { id: monster.id, x: monster.x, z: monster.z });
            const loot = this.spawnMonsterLoot(monster.x, monster.z, monster.templateId, monster.level);
            if (loot) this.broadcast('loot:spawned', { id: loot.id, x: loot.x, z: loot.z, items: loot.items });
          } else {
            this.broadcast('combat:damage', { monsterId: monster.id, playerId: player.id, damage: dmg, critical: false, hp: monster.hp, maxHp: monster.maxHp });
          }
        }
        this.broadcast('skill:used', { playerId: player.id, skillId: data.skillId });
      } else if (data.type === 'pickup_weapon' && data.targetId) {
        const weapon = this.state.weapons.get(data.targetId);
        if (!weapon) {
          client.send('weapon:error', { error: 'Weapon not found' });
          return;
        }
        const dx = player.x - weapon.x;
        const dz = player.z - weapon.z;
        if (Math.sqrt(dx * dx + dz * dz) > 2.5) {
          client.send('weapon:error', { error: 'Too far' });
          return;
        }
        this.state.weapons.delete(data.targetId);
        this.spawnedWeapons.delete(data.targetId);
        const template = WEAPON_TEMPLATES[weapon.templateId];
        if (template) {
          const collected = this.playerWeapons.get(client.sessionId);
          if (collected) collected.add(weapon.templateId);
          if (player.equippedWeapon) {
            this.applyWeaponStats(player, player.equippedWeapon, true);
          }
          player.equippedWeapon = weapon.templateId;
          this.applyWeaponStats(player, weapon.templateId);
          this.triggerMonsterAggro(player);
        }
        this.broadcast('weapon:picked_up', {
          weaponId: data.targetId, playerId: player.id, templateId: weapon.templateId, name: weapon.name,
          attack: template?.attack || 0, magicAttack: template?.magicAttack || 0, critRate: template?.critRate || 0,
        });
      }
    });

    this.onMessage('player:equip_weapon', (client, data: { templateId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const collected = this.playerWeapons.get(client.sessionId);
      if (!collected || !collected.has(data.templateId)) {
        client.send('weapon:error', { error: 'Weapon not collected' });
        return;
      }
      if (player.equippedWeapon === data.templateId) return;
      if (player.equippedWeapon) {
        this.applyWeaponStats(player, player.equippedWeapon, true);
      }
      player.equippedWeapon = data.templateId;
      this.applyWeaponStats(player, data.templateId);
      this.triggerMonsterAggro(player);
      client.send('weapon:equipped', { templateId: data.templateId });
      this.broadcast('player:weapon_changed', { playerId: player.id, templateId: data.templateId });
    });

    this.onMessage('player:set_difficulty', (client, data: { difficulty: string }) => {
      const valid = ['easy', 'medium', 'hard', 'hardest'];
      if (valid.includes(data.difficulty)) {
        this.difficulty = data.difficulty as DifficultyKey;
        client.send('difficulty:changed', { difficulty: this.difficulty });
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

    this.onMessage('inventory:use', (client, data: { slot: number }) => {
      const items = this.playerInventories.get(client.sessionId) || [];
      const idx = items.findIndex(i => i.slot === data.slot && i.type === 'consumable');
      if (idx < 0) return;
      const item = items[idx]!;
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      let used = false;
      if (item.name === 'Health Potion') {
        const heal = 30;
        player.hp = Math.min(player.maxHp, player.hp + heal);
        client.send('combat:heal', { amount: heal, hp: player.hp, maxHp: player.maxHp });
        used = true;
      } else if (item.name === 'Mana Potion') {
        const restore = 20;
        player.mp = Math.min(player.maxMp, player.mp + restore);
        client.send('combat:mp_restore', { amount: restore, mp: player.mp, maxMp: player.maxMp });
        used = true;
      }
      if (used) {
        const result = this.inventoryHandler.handleUse(data, items);
        this.playerInventories.set(client.sessionId, result.updatedItems);
        client.send('inventory:updated', { items: result.updatedItems });
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

  private _tickCount = 0;

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
    this._tickCount++;
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
        attack: m.attack,
        state: m.state,
        targetId: m.targetId,
        fleeThreshold: (m as any).fleeThreshold ?? 0.1,
        patrolPoint: { x: m.spawnX, z: m.spawnZ },
      });
    }
    const aiPlayers = new Map<string, any>();
    for (const [, p] of this.state.players) {
      aiPlayers.set(p.id, { id: p.id, x: p.x, z: p.z, level: p.level, equippedWeapon: p.equippedWeapon, hp: p.hp });
    }

    if (this._tickCount % 20 === 0) {
      let idle = 0, chase = 0, attack = 0, flee = 0;
      for (const [, m] of aiMonsters) {
        if (m.state === 'idle') idle++;
        else if (m.state === 'chase') chase++;
        else if (m.state === 'attack') attack++;
        else if (m.state === 'flee') flee++;
      }
      let playerInfo = '';
      for (const [, p] of aiPlayers) {
        playerInfo += ` [${p.id.slice(0,6)} at (${p.x.toFixed(1)},${p.z.toFixed(1)}) wep=${p.equippedWeapon || 'none'}]`;
      }
      console.log(`TICK ${this._tickCount} monsters: idle=${idle} chase=${chase} attack=${attack} flee=${flee} players=${aiPlayers.size}${playerInfo}`);
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

    for (const [id, aiM] of aiMonsters) {
      if (aiM.state === MonsterAIState.Chase || aiM.state === MonsterAIState.Attack) {
        this.broadcast('monster:moved', { id: aiM.id, x: aiM.x, z: aiM.z });
      }
    }

    for (const [id, aiM] of aiMonsters) {
      if (aiM.state !== MonsterAIState.Attack || !aiM.targetId) continue;
      if (!this.monsterAttackCooldown(id, dt)) continue;
      const targetPlayer = this.getPlayerByPlayerId(aiM.targetId);
      if (!targetPlayer || targetPlayer.hp <= 0) continue;
      const dx = aiM.x - targetPlayer.x;
      const dz = aiM.z - targetPlayer.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 10) {
        const monster = this.state.monsters.get(id);
        console.log(`DIST=${dist.toFixed(2)} attackRange=${aiM.attackRange} m_state=${aiM.state} m_id=${id} m_name=${monster?.name || '?'} m_x=${aiM.x.toFixed(2)} m_z=${aiM.z.toFixed(2)} p_x=${targetPlayer.x.toFixed(2)} p_z=${targetPlayer.z.toFixed(2)} p_hp=${targetPlayer.hp} p_id=${aiM.targetId}`);
      }
      if (dist > (aiM.attackRange || 1.5)) continue;
      if (this.recentlyRespawned.has(targetPlayer.id) && Date.now() - this.recentlyRespawned.get(targetPlayer.id)! < 200) continue;
      const baseAtk = (aiM.attack || aiM.level * 2) * 0.5;
      const rawDamage = baseAtk + Math.random() * 3 - targetPlayer.defense * 0.3;
      const damage = Math.max(1, Math.floor(rawDamage));
      targetPlayer.hp -= damage;
      const monsterRef = this.state.monsters.get(id);
      console.log(`DAMAGE monster=${monsterRef?.name || '?'}(${id.slice(0,6)}) dist=${dist.toFixed(2)} range=${aiM.attackRange} dmg=${damage} player_hp=${targetPlayer.hp} player_at=(${targetPlayer.x.toFixed(2)},${targetPlayer.z.toFixed(2)}) monster_at=(${aiM.x.toFixed(2)},${aiM.z.toFixed(2)})`);
      this.broadcast('combat:player_damage', { targetId: aiM.targetId, attackerId: id, damage, critical: false, hp: targetPlayer.hp, maxHp: targetPlayer.maxHp, x: aiM.x, z: aiM.z });
        if (targetPlayer.hp <= 0) {
          this.monsterAttackTimers.set(id, 3.0);
          const monster = this.state.monsters.get(id);
          if (monster) {
            monster.state = MonsterAIState.Idle;
            monster.targetId = '';
          }
          for (const [, m] of this.state.monsters) {
            if (m.targetId === aiM.targetId) {
              m.state = MonsterAIState.Idle;
              m.targetId = '';
            }
          }
          this.broadcast('monster:kill', { targetId: aiM.targetId, attackerId: id, attackerName: monster?.name || 'Monster' });
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

  private getPlayerByPlayerId(playerId: string): PlayerState | undefined {
    for (const [, p] of this.state.players) {
      if (p.id === playerId) return p;
    }
    return undefined;
  }

  private monsterAttackTimers: Map<string, number> = new Map();
  private recentlyRespawned: Map<string, number> = new Map();
  private monsterAttackCooldown(id: string, dt: number): boolean {
    if (!this.monsterAttackTimers.has(id)) {
      this.monsterAttackTimers.set(id, 2.0 / 3);
      return false;
    }
    const timer = this.monsterAttackTimers.get(id) || 0;
    const newTimer = timer - dt;
    if (newTimer <= 0) {
      this.monsterAttackTimers.set(id, 2.0 / 3);
      return true;
    }
    this.monsterAttackTimers.set(id, newTimer);
    return false;
  }

  private spawnMonsterLoot(x: number, z: number, templateId: string, level: number): { id: string; x: number; z: number; items: { id: string; name: string; quantity: number; type?: string }[] } | null {
    const rawItems: { name: string; quantity: number; type?: string; templateId?: string }[] = [];
    const goldAmount = Math.floor(5 + Math.random() * 20 + level * 2);
    rawItems.push({ name: 'Gold', quantity: goldAmount, type: 'gold' });
    if (Math.random() < 0.35) {
      rawItems.push({ name: 'Health Potion', quantity: 1, type: 'health_potion' });
    }
    if (Math.random() < 0.25) {
      rawItems.push({ name: 'Mana Potion', quantity: 1, type: 'mana_potion' });
    }
    if (Math.random() < 0.08) {
      const templates = Object.keys(WEAPON_TEMPLATES);
      const tid = templates[Math.floor(Math.random() * templates.length)];
      if (tid) {
        rawItems.push({ name: WEAPON_TEMPLATES[tid].name, quantity: 1, type: 'weapon', templateId: tid });
      }
    }
    if (rawItems.length === 0) return null;
    const loot = this.lootHandler.spawnLoot(x, z, rawItems as any);
    return { id: loot.id, x: loot.x, z: loot.z, items: loot.items };
  }

  private spawnCounter: number = 0;

  onJoin(client: Client, _options?: any, _auth?: any): void {
    const player = new PlayerState();
    player.id = generateId();
    player.sessionId = client.sessionId;
    player.name = `Player_${client.sessionId.slice(0, 4)}`;
    player.kills = 0;
    player.deaths = 0;

    this.spawnCounter++;
    const spread = 2.0;
    const angle = ((this.spawnCounter - 1) / 4) * Math.PI * 2;
    player.x = Math.cos(angle) * spread;
    player.z = Math.sin(angle) * spread;

    this.state.players.set(client.sessionId, player);
    this.playerInventories.set(client.sessionId, []);
    this.playerMounts.set(client.sessionId, null);
    this.playerWeapons.set(client.sessionId, new Set());
    this.playerWeapons.set(client.sessionId, new Set());

    const monsterTemplates = Object.keys(BASE_MONSTER_TEMPLATES);
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * 24;
      const tid = monsterTemplates[Math.floor(Math.random() * monsterTemplates.length)];
      if (tid) this.spawnMonster(tid, player.x + Math.cos(angle) * dist, player.z + Math.sin(angle) * dist);
    }

    const templates = Object.keys(WEAPON_TEMPLATES);
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 9 + Math.random() * 15;
      const templateId = templates[Math.floor(Math.random() * templates.length)];
      if (templateId) this.spawnWeapon(templateId, player.x + Math.cos(angle) * dist, player.z + Math.sin(angle) * dist);
    }

    client.send('world:joined', {
      playerId: player.id,
      sessionId: client.sessionId,
      x: player.x,
      z: player.z,
    });
    this.broadcast('player:joined', { id: player.id, name: player.name, x: player.x, z: player.z }, { except: client });
    client.send('world:state', {
      players: Array.from(this.state.players.values()).map((p: PlayerState) => ({ id: p.id, name: p.name, x: p.x, z: p.z, level: p.level, rotation: p.rotation })),
      monsters: Array.from(this.state.monsters.values()).map((m: MonsterState) => ({ id: m.id, templateId: m.templateId, name: m.name, x: m.x, z: m.z, hp: m.hp, maxHp: m.maxHp, level: m.level })),
      weapons: Array.from(this.state.weapons.values()).map((w: WeaponState) => ({ id: w.id, templateId: w.templateId, name: w.name, x: w.x, z: w.z })),
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
    this.playerWeapons.delete(client.sessionId);
  }

  onDispose(): void {
    clearInterval(this.gameLoop);
  }
}
