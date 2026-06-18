import { INVENTORY_SIZE, MAX_PARTY_SIZE } from './types.js';

export { INVENTORY_SIZE, MAX_PARTY_SIZE };

export const MAX_PLAYER_LEVEL = 120;
export const MAX_ENCHANT_LEVEL = 15;

export const XP_TABLE: number[] = [];
for (let i = 0; i <= MAX_PLAYER_LEVEL; i++) {
  XP_TABLE[i] = Math.floor(Math.pow(i, 3) * 10 + 50);
}
