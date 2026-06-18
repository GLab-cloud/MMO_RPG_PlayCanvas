export enum ClassType {
  Beginner = 'Beginner',
  Mercenary = 'Mercenary',
  Acrobat = 'Acrobat',
  Magician = 'Magician',
  Assist = 'Assist',
  Knight = 'Knight',
  Blade = 'Blade',
  Jester = 'Jester',
  Ranger = 'Ranger',
  Psykeeper = 'Psykeeper',
  Elementor = 'Elementor',
  Ringmaster = 'Ringmaster',
  Billposter = 'Billposter',
}

export enum ChatChannel {
  General = 'general',
  Party = 'party',
  Guild = 'guild',
  Whisper = 'whisper',
  World = 'world',
  Shout = 'shout',
}

export enum ItemType {
  Weapon = 'weapon',
  Helmet = 'helmet',
  Armor = 'armor',
  Gloves = 'gloves',
  Boots = 'boots',
  Cloak = 'cloak',
  Ring = 'ring',
  Necklace = 'necklace',
  Consumable = 'consumable',
  Material = 'material',
  Quest = 'quest',
  Cash = 'cash',
}

export enum EquipmentSlot {
  Weapon = 0,
  Helmet = 1,
  Armor = 2,
  Gloves = 3,
  Boots = 4,
  Cloak = 5,
  Ring1 = 6,
  Ring2 = 7,
  Necklace = 8,
}

export enum MonsterAIState {
  Idle = 'idle',
  Patrol = 'patrol',
  Chase = 'chase',
  Attack = 'attack',
  Flee = 'flee',
  Return = 'return',
}

export enum QuestType {
  Kill = 'kill',
  Collect = 'collect',
  Delivery = 'delivery',
  Escort = 'escort',
  Daily = 'daily',
  Chain = 'chain',
  Class = 'class',
}

export enum QuestStatus {
  Available = 'available',
  Active = 'active',
  Completed = 'completed',
  TurnedIn = 'turned_in',
}

export enum PartyLootMode {
  Free = 'free',
  Order = 'order',
  Random = 'random',
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ItemStack {
  id: string;
  templateId: number;
  slot: number;
  quantity: number;
  enchant: number;
  durability: number;
  bonusStr: number;
  bonusSta: number;
  bonusDex: number;
  bonusInt: number;
  isEquipped: boolean;
}

export interface CharacterStats {
  str: number;
  sta: number;
  dex: number;
  int: number;
  spr: number;
  statPoints: number;
}

export interface PlayerAction {
  sessionId: string;
  type: 'move' | 'attack' | 'skill' | 'emote' | 'interact';
  data: Record<string, unknown>;
  seq: number;
  timestamp: number;
}

export const INVENTORY_ROWS = 6;
export const INVENTORY_COLS = 9;
export const INVENTORY_SIZE = INVENTORY_ROWS * INVENTORY_COLS;
export const MAX_PARTY_SIZE = 6;
export const MAX_GUILD_MEMBERS = 20;
export const CHANNELS_PER_SERVER = 5;
export const MAX_CHANNEL_CAPACITY = 200;
