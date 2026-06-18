import { describe, it, expect, beforeEach } from 'vitest';

class LevelSystem {
  level: number;
  experience: number;
  private xpTable: number[];

  constructor() {
    this.level = 1;
    this.experience = 0;
    this.xpTable = [];
    for (let i = 0; i <= 120; i++) {
      this.xpTable[i] = Math.floor(Math.pow(i, 3) * 10 + 50);
    }
  }

  xpForLevel(level: number): number {
    return this.xpTable[level] || 0;
  }

  addExperience(amount: number): number {
    this.experience += amount;
    let levelsGained = 0;
    while (this.level < 120 && this.experience >= this.xpTable[this.level]) {
      this.experience -= this.xpTable[this.level];
      this.level++;
      levelsGained++;
    }
    if (this.level >= 120) {
      this.experience = Math.min(this.experience, this.xpTable[120] || 0);
    }
    return levelsGained;
  }

  static calculateStatPoints(level: number): number {
    if (level <= 1) return 5;
    const base = level * 5;
    const bonus = Math.floor(level / 5) * 3;
    return base + bonus;
  }

  getLevelProgress(): number {
    if (this.level >= 120) return 1;
    return this.experience / this.xpTable[this.level];
  }
}

describe('LevelSystem', () => {
  let ls: LevelSystem;

  beforeEach(() => {
    ls = new LevelSystem();
  });

  it('addExperience adds XP correctly', () => {
    expect(ls.experience).toBe(0);
    ls.addExperience(50);
    expect(ls.experience).toBe(50);
    expect(ls.level).toBe(1);
  });

  it('addExperience triggers level up when XP threshold crossed', () => {
    const gained = ls.addExperience(60);
    expect(ls.level).toBe(2);
    expect(gained).toBe(1);
    expect(ls.experience).toBe(0);
  });

  it('level does not exceed 120', () => {
    ls.addExperience(9_999_999_999);
    expect(ls.level).toBe(120);
  });

  it('calculateStatPoints gives 5 per level + 3 every 5 levels', () => {
    expect(LevelSystem.calculateStatPoints(1)).toBe(5);
    expect(LevelSystem.calculateStatPoints(5)).toBe(28);
    expect(LevelSystem.calculateStatPoints(10)).toBe(56);
  });

  it('getLevelProgress returns correct ratio', () => {
    expect(ls.getLevelProgress()).toBe(0);
    ls.addExperience(30);
    expect(ls.getLevelProgress()).toBeCloseTo(30 / 60);
  });

  it('multiple level ups in one XP grant work', () => {
    const needed = ls.xpForLevel(1) + ls.xpForLevel(2) + ls.xpForLevel(3);
    const gained = ls.addExperience(needed);
    expect(gained).toBe(3);
    expect(ls.level).toBe(4);
  });
});
