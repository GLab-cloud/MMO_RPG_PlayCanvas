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

export interface Buff {
  id: string;
  name: string;
  statBoosts: Partial<Record<string, number>>;
  duration: number;
  remaining: number;
  stackable: boolean;
}

export interface PlayerAction {
  sessionId: string;
  type: 'move' | 'attack' | 'skill' | 'emote' | 'interact';
  data: Record<string, unknown>;
  seq: number;
  timestamp: number;
}
