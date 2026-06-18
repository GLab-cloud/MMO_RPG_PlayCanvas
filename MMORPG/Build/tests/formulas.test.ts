import { describe, it, expect } from 'vitest';

class Formulas {
  static xpForLevel(level: number): number {
    return Math.floor(Math.pow(level, 3) * 10 + 50);
  }

  static totalXpForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += Formulas.xpForLevel(i);
    }
    return total;
  }

  static hpFromStamina(base: number, sta: number, hpPerSta: number): number {
    return base + sta * hpPerSta;
  }

  static physicalAtk(str: number, weaponAtk: number): number {
    return str * 2 + weaponAtk;
  }

  static criticalRate(dex: number): number {
    return Math.min(0.5, dex * 0.005);
  }

  static partyXpBonus(size: number): number {
    return 1 + (size - 1) * 0.1;
  }

  static enchantSuccessRate(level: number): number {
    return Math.max(0.01, 1.0 - level * 0.1);
  }
}

describe('Formulas', () => {
  it('xpForLevel(1) = 60', () => {
    expect(Formulas.xpForLevel(1)).toBe(60);
  });

  it('xpForLevel(15) = 33800', () => {
    expect(Formulas.xpForLevel(15)).toBe(33800);
  });

  it('totalXpForLevel(1) = 0', () => {
    expect(Formulas.totalXpForLevel(1)).toBe(0);
  });

  it('totalXpForLevel(16) sums correctly', () => {
    const total = Formulas.totalXpForLevel(16);
    const manual = Formulas.xpForLevel(1) + Formulas.xpForLevel(2) +
      Formulas.xpForLevel(3) + Formulas.xpForLevel(4) + Formulas.xpForLevel(5) +
      Formulas.xpForLevel(6) + Formulas.xpForLevel(7) + Formulas.xpForLevel(8) +
      Formulas.xpForLevel(9) + Formulas.xpForLevel(10) + Formulas.xpForLevel(11) +
      Formulas.xpForLevel(12) + Formulas.xpForLevel(13) + Formulas.xpForLevel(14) +
      Formulas.xpForLevel(15);
    expect(total).toBe(manual);
    expect(total).toBeGreaterThan(0);
  });

  it('hpFromStamina(100, 10, 50) = 600', () => {
    expect(Formulas.hpFromStamina(100, 10, 50)).toBe(600);
  });

  it('physicalAtk(10, 20) = 40', () => {
    expect(Formulas.physicalAtk(10, 20)).toBe(40);
  });

  it('criticalRate(100) = 0.5', () => {
    expect(Formulas.criticalRate(100)).toBe(0.5);
  });

  it('criticalRate(20) = 0.1', () => {
    expect(Formulas.criticalRate(20)).toBe(0.1);
  });

  it('partyXpBonus(1) = 1', () => {
    expect(Formulas.partyXpBonus(1)).toBe(1);
  });

  it('partyXpBonus(6) = 1.5', () => {
    expect(Formulas.partyXpBonus(6)).toBe(1.5);
  });

  it('enchantSuccessRate(0) = 1', () => {
    expect(Formulas.enchantSuccessRate(0)).toBe(1);
  });

  it('enchantSuccessRate(5) = 0.5', () => {
    expect(Formulas.enchantSuccessRate(5)).toBe(0.5);
  });

  it('enchantSuccessRate(15) = 0.01', () => {
    expect(Formulas.enchantSuccessRate(15)).toBe(0.01);
  });
});
