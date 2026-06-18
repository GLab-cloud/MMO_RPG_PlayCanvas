export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5) + 50 * level);
}

export function hpFromStats(stamina: number, level: number): number {
  return 50 + stamina * 10 + level * 5;
}

export function mpFromStats(intelligence: number, level: number): number {
  return 20 + intelligence * 8 + level * 3;
}

export function attackFromStats(strength: number, level: number): number {
  return strength * 2 + level;
}

export function defenseFromStats(stamina: number, level: number): number {
  return stamina * 1.5 + Math.floor(level / 2);
}

export function magicAttackFromStats(intelligence: number, level: number): number {
  return intelligence * 2.5 + level;
}

export function enchantSuccessRate(enchantLevel: number): number {
  if (enchantLevel <= 3) return 1.0;
  if (enchantLevel <= 6) return 0.7;
  if (enchantLevel <= 9) return 0.4;
  if (enchantLevel <= 12) return 0.2;
  return 0.05;
}

export function partyXpBonus(partySize: number): number {
  if (partySize <= 1) return 1.0;
  if (partySize === 2) return 1.2;
  if (partySize === 3) return 1.4;
  if (partySize === 4) return 1.6;
  return 1.8;
}

export function critRate(dexterity: number): number {
  return Math.min(0.5, dexterity * 0.002);
}
