import { ClassType } from './types.js';

export const SERVER_TICK_RATE = 20;
export const SERVER_TICK_INTERVAL = 1000 / SERVER_TICK_RATE;

export const MOVE_SPEED_BASE = 5;
export const MOVE_SPEED_SPRINT = 8;
export const FLIGHT_SPEED_BOOST = 1.5;
export const CAMERA_DISTANCE_DEFAULT = 5;
export const CAMERA_HEIGHT_DEFAULT = 2;
export const CAMERA_SENSITIVITY = 0.15;

export const MAX_PLAYER_LEVEL = 120;
export const MAX_ENCHANT_LEVEL = 15;
export const MAX_DURABILITY = 100;
export const INVENTORY_MAX_WEIGHT = 50000;

export const XP_TABLE: number[] = [];
for (let i = 0; i <= MAX_PLAYER_LEVEL; i++) {
  XP_TABLE[i] = Math.floor(Math.pow(i, 3) * 10 + 50);
}

export const STAT_GROWTH: Record<ClassType, Record<string, number>> = {
  [ClassType.Beginner]: { str: 1, sta: 1, dex: 1, int: 1, spr: 1, hpPerSta: 50, mpPerSpr: 30 },
  [ClassType.Mercenary]: { str: 3, sta: 2, dex: 1, int: 0, spr: 0, hpPerSta: 60, mpPerSpr: 20 },
  [ClassType.Acrobat]: { str: 1, sta: 1, dex: 3, int: 0, spr: 1, hpPerSta: 45, mpPerSpr: 25 },
  [ClassType.Magician]: { str: 0, sta: 1, dex: 1, int: 3, spr: 1, hpPerSta: 40, mpPerSpr: 40 },
  [ClassType.Assist]: { str: 1, sta: 2, dex: 0, int: 1, spr: 2, hpPerSta: 55, mpPerSpr: 35 },
  [ClassType.Knight]: { str: 2, sta: 4, dex: 1, int: 0, spr: 0, hpPerSta: 70, mpPerSpr: 15 },
  [ClassType.Blade]: { str: 4, sta: 1, dex: 2, int: 0, spr: 0, hpPerSta: 55, mpPerSpr: 15 },
  [ClassType.Jester]: { str: 1, sta: 1, dex: 4, int: 0, spr: 1, hpPerSta: 40, mpPerSpr: 20 },
  [ClassType.Ranger]: { str: 2, sta: 1, dex: 3, int: 0, spr: 1, hpPerSta: 45, mpPerSpr: 20 },
  [ClassType.Psykeeper]: { str: 0, sta: 1, dex: 1, int: 4, spr: 1, hpPerSta: 35, mpPerSpr: 45 },
  [ClassType.Elementor]: { str: 0, sta: 1, dex: 1, int: 4, spr: 1, hpPerSta: 35, mpPerSpr: 45 },
  [ClassType.Ringmaster]: { str: 1, sta: 2, dex: 0, int: 1, spr: 3, hpPerSta: 50, mpPerSpr: 40 },
  [ClassType.Billposter]: { str: 2, sta: 2, dex: 1, int: 0, spr: 2, hpPerSta: 55, mpPerSpr: 30 },
};

export const CLASS_CHANGE_REQUIREMENTS: Record<ClassType, { level: number; questId: string }> = {
  [ClassType.Beginner]: { level: 1, questId: '' },
  [ClassType.Mercenary]: { level: 15, questId: 'class_merc_01' },
  [ClassType.Acrobat]: { level: 15, questId: 'class_acro_01' },
  [ClassType.Magician]: { level: 15, questId: 'class_mage_01' },
  [ClassType.Assist]: { level: 15, questId: 'class_assist_01' },
  [ClassType.Knight]: { level: 60, questId: 'class_knight_01' },
  [ClassType.Blade]: { level: 60, questId: 'class_blade_01' },
  [ClassType.Jester]: { level: 60, questId: 'class_jester_01' },
  [ClassType.Ranger]: { level: 60, questId: 'class_ranger_01' },
  [ClassType.Psykeeper]: { level: 60, questId: 'class_psy_01' },
  [ClassType.Elementor]: { level: 60, questId: 'class_elem_01' },
  [ClassType.Ringmaster]: { level: 60, questId: 'class_ring_01' },
  [ClassType.Billposter]: { level: 60, questId: 'class_bill_01' },
};

export const CHAT_COOLDOWNS: Record<string, number> = {
  general: 0,
  party: 0,
  guild: 0,
  whisper: 0,
  world: 3000,
  shout: 10000,
};

export const RATE_LIMITS: Record<string, { maxPerSecond: number; banThreshold?: number }> = {
  login: { maxPerSecond: 0.083, banThreshold: 0.33 },
  chat: { maxPerSecond: 5, banThreshold: 30 },
  attack: { maxPerSecond: 10, banThreshold: 30 },
  pickup: { maxPerSecond: 5 },
  trade: { maxPerSecond: 0.05 },
  party: { maxPerSecond: 0.083 },
};
