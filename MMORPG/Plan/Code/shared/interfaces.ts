import { ClassType, ChatChannel, EquipmentSlot, ItemType, QuestType, QuestStatus, Vec3, PartyLootMode } from './types.js';

export interface Account {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin: Date;
  isBanned: boolean;
  isAdmin: boolean;
}

export interface Character {
  id: string;
  accountId: string;
  name: string;
  class: ClassType;
  level: number;
  experience: bigint;
  str: number;
  sta: number;
  dex: number;
  int: number;
  spr: number;
  statPoints: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: bigint;
  mapId: string;
  position: Vec3;
  rotation: number;
  createdAt: Date;
  lastSaved: Date;
  playtimeSeconds: number;
}

export interface ItemTemplate {
  id: number;
  name: string;
  type: ItemType;
  subtype: string;
  level: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  baseStats: Partial<Record<string, number>>;
  description: string;
  stackable: boolean;
  maxStack: number;
  buyPrice: number;
  sellPrice: number;
  requiredClass: ClassType | null;
}

export interface LootTable {
  tableId: number;
  drops: LootTableEntry[];
}

export interface LootTableEntry {
  itemTemplateId: number;
  probability: number;
  minLevel: number;
  maxLevel: number;
  quantityMin: number;
  quantityMax: number;
}

export interface Skill {
  id: string;
  name: string;
  class: ClassType;
  level: number;
  type: 'single' | 'aoe' | 'buff' | 'heal';
  multiplier: number;
  cooldown: number;
  manaCost: number;
  range: number;
  radius: number;
  duration: number;
  description: string;
  icon: string;
}

export interface Quest {
  id: string;
  name: string;
  type: QuestType;
  levelRequirement: number;
  classRequirement: ClassType | null;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  description: string;
  dialogueStart: string;
  dialogueComplete: string;
  nextQuestId: string | null;
}

export interface QuestObjective {
  type: 'kill' | 'collect' | 'talk' | 'escort';
  targetId: string;
  targetName: string;
  requiredCount: number;
  currentCount: number;
  mapId: string;
}

export interface QuestReward {
  type: 'xp' | 'gold' | 'item' | 'title';
  id?: string;
  quantity?: number;
}

export interface MonsterTemplate {
  id: number;
  name: string;
  level: number;
  hp: number;
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  speed: number;
  detectionRange: number;
  attackRange: number;
  respawnTime: number;
  lootTableId: number;
  xpReward: number;
  goldReward: number;
  modelName: string;
  scale: number;
}

export interface Party {
  id: string;
  leaderId: string;
  members: PartyMember[];
  maxSize: number;
  lootMode: PartyLootMode;
  shareLevelRange: number;
}

export interface PartyMember {
  sessionId: string;
  characterId: string;
  name: string;
  level: number;
  class: ClassType;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  mapId: string;
  online: boolean;
}

export interface Guild {
  id: string;
  name: string;
  leaderId: string;
  level: number;
  experience: bigint;
  memberCount: number;
  maxMembers: number;
  createdAt: Date;
  members: GuildMember[];
}

export interface GuildMember {
  characterId: string;
  name: string;
  rank: 'master' | 'officer' | 'member';
  contribution: number;
  joinedAt: Date;
}

export interface ChatMessage {
  id: string;
  channel: ChatChannel;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  recipientId?: string;
}

export interface TradeRequest {
  id: string;
  requesterId: string;
  targetId: string;
  status: 'pending' | 'accepted' | 'confirmed' | 'cancelled';
  requesterItems: TradeItem[];
  targetItems: TradeItem[];
  requesterGold: bigint;
  targetGold: bigint;
  requesterConfirmed: boolean;
  targetConfirmed: boolean;
  expiresAt: number;
}

export interface TradeItem {
  slot: number;
  quantity: number;
}

export interface Mount {
  id: string;
  templateId: number;
  name: string;
  speed: number;
  altitudeTiers: number[];
  levelRequirement: number;
  acquireMethod: string;
}

export interface LeaderboardEntry {
  rank: number;
  characterId: string;
  name: string;
  level: number;
  className: string;
  guildName: string | null;
  value: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'exploration' | 'social' | 'economy' | 'quest';
  requirement: Record<string, number>;
  rewardTitle: string | null;
  rewardItemId: number | null;
}

export interface WorldState {
  players: Map<string, PlayerState>;
  monsters: Map<string, MonsterState>;
  time: number;
  weather: string;
  playerCount: number;
}

export interface PlayerState {
  id: string;
  name: string;
  level: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  class: string;
  mount: string;
  flying: boolean;
  altitude: number;
}

export interface MonsterState {
  id: string;
  templateId: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
  hp: number;
  maxHp: number;
  aiState: string;
  targetId: string;
}
