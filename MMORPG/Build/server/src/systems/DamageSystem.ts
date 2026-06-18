import { critRate } from '../utils/Formulas.js';

export function calculatePhysical(
  attack: number,
  defense: number,
  attackerLevel: number,
  _targetLevel: number,
  skillMultiplier: number = 1.0
): number {
  const baseDamage = attack * skillMultiplier - defense * 0.5;
  const levelBonus = attackerLevel * 2;
  const raw = baseDamage + levelBonus;
  const variance = 0.9 + Math.random() * 0.2;
  return Math.max(1, Math.floor(raw * variance));
}

export function calculateMagical(
  magicAttack: number,
  magicDefense: number,
  attackerLevel: number,
  _targetLevel: number,
  skillMultiplier: number = 1.0
): number {
  const baseDamage = magicAttack * skillMultiplier - magicDefense * 0.3;
  const levelBonus = attackerLevel * 1.5;
  const raw = baseDamage + levelBonus;
  const variance = 0.85 + Math.random() * 0.3;
  return Math.max(1, Math.floor(raw * variance));
}

export function isCriticalHit(dexterity: number): boolean {
  return Math.random() < critRate(dexterity);
}

export function calculateXpReward(monsterLevel: number, playerLevel: number): number {
  const levelDiff = monsterLevel - playerLevel;
  const baseXp = monsterLevel * 25;
  const modifier = levelDiff >= 0 ? 1 + levelDiff * 0.1 : Math.max(0.1, 1 + levelDiff * 0.05);
  return Math.floor(baseXp * modifier);
}
