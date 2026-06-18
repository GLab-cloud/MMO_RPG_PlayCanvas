export interface PlayerState {
  id: string;
  sessionId: string;
  name: string;
  level: number;
  xp: number;
  class: string;
  strength: number;
  stamina: number;
  dexterity: number;
  intelligence: number;
  statPoints: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  x: number;
  z: number;
  rotation: number;
  speed: number;
  gold: number;
  mounted: boolean;
  mountId: string | null;
  partyId: string | null;
  guildId: string | null;
  connected: boolean;
}

export interface MonsterState {
  id: string;
  templateId: string;
  name: string;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  level: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  speed: number;
  aggroRange: number;
  attackRange: number;
  xpReward: number;
  state: string;
  targetId: string | null;
}

export interface WorldStateSchema {
  players: Map<string, PlayerState>;
  monsters: Map<string, MonsterState>;
  timeOfDay: number;
  weather: string;
}
