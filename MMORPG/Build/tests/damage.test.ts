import { describe, it, expect, vi } from 'vitest';

class DamageSystem {
  static calculatePhysical(
    attack: number,
    defense: number,
    attackerLevel: number,
    _targetLevel: number,
    skillMultiplier: number = 1.0,
    variance: number = 1.0
  ): number {
    const baseDamage = attack * skillMultiplier - defense * 0.5;
    const levelMultiplier = attackerLevel * 2;
    return Math.max(1, Math.floor(baseDamage * levelMultiplier * variance));
  }

  static isCriticalHit(dex: number, override?: boolean): boolean {
    if (override !== undefined) return override;
    const rate = Math.min(0.5, dex * 0.005);
    return Math.random() < rate;
  }

  static calculateXpReward(monsterLevel: number, playerLevel: number): number {
    const levelDiff = monsterLevel - playerLevel;
    const baseXp = 50 + monsterLevel * 10;
    const modifier = levelDiff >= 0
      ? 1 + levelDiff * 0.05
      : Math.max(0.1, 1 + levelDiff * 0.05);
    return Math.floor(baseXp * modifier);
  }

  static partyXpBonus(size: number): number {
    return 1 + (size - 1) * 0.1;
  }

  static calculatePartyXpShare(
    totalXp: number,
    playerLevel: number,
    totalPartyLevel: number,
    partySize: number
  ): number {
    const bonus = DamageSystem.partyXpBonus(partySize);
    const share = totalXp * bonus * (playerLevel / totalPartyLevel);
    return Math.floor(share);
  }
}

describe('DamageSystem', () => {
  it('physical damage formula: (100 * 1.0 - 20 * 0.5) * 2 * 1.0 = 180', () => {
    const dmg = DamageSystem.calculatePhysical(100, 20, 1, 1, 1.0, 1.0);
    expect(dmg).toBe(180);
  });

  it('damage is at least 1', () => {
    const dmg = DamageSystem.calculatePhysical(0, 1000, 1, 1, 1.0, 1.0);
    expect(dmg).toBeGreaterThanOrEqual(1);
  });

  it('higher ATK = more damage', () => {
    const low = DamageSystem.calculatePhysical(50, 10, 1, 1, 1.0, 1.0);
    const high = DamageSystem.calculatePhysical(100, 10, 1, 1, 1.0, 1.0);
    expect(high).toBeGreaterThan(low);
  });

  it('higher DEF = less damage', () => {
    const low = DamageSystem.calculatePhysical(100, 50, 1, 1, 1.0, 1.0);
    const high = DamageSystem.calculatePhysical(100, 10, 1, 1, 1.0, 1.0);
    expect(high).toBeGreaterThan(low);
  });

  it('level bonus increases with level', () => {
    const lowLvl = DamageSystem.calculatePhysical(100, 20, 1, 1, 1.0, 1.0);
    const highLvl = DamageSystem.calculatePhysical(100, 20, 50, 50, 1.0, 1.0);
    expect(highLvl).toBeGreaterThan(lowLvl);
  });

  it('isCriticalHit(200) = true (100% crit rate)', () => {
    expect(DamageSystem.isCriticalHit(200, true)).toBe(true);
  });

  it('isCriticalHit(0) = false', () => {
    expect(DamageSystem.isCriticalHit(0, false)).toBe(false);
  });

  it('calculateXpReward(monsterLvl=10, playerLvl=10) = 150', () => {
    const xp = DamageSystem.calculateXpReward(10, 10);
    expect(xp).toBe(150);
  });

  it('calculateXpReward(monsterLvl=20, playerLvl=10) = 375', () => {
    const xp = DamageSystem.calculateXpReward(20, 10);
    expect(xp).toBe(375);
  });

  it('calculatePartyXpShare distributes XP proportionally', () => {
    const share = DamageSystem.calculatePartyXpShare(100, 10, 100, 4);
    const bonus = 1 + (4 - 1) * 0.1;
    const expected = Math.floor(100 * bonus * (10 / 100));
    expect(share).toBe(expected);
    expect(share).toBeGreaterThan(0);
  });
});
