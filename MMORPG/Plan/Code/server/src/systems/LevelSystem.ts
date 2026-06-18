import { Formulas } from '../utils/Formulas.js';
import { Logger } from '../utils/Logger.js';

export class LevelSystem {
  addExperience(
    currentXp: bigint,
    currentLevel: number,
    amount: number
  ): { newXp: bigint; newLevel: number; leveledUp: boolean } {
    const newXp = currentXp + BigInt(amount);
    let newLevel = currentLevel;
    let leveledUp = false;

    while (newLevel < 120 && newXp >= BigInt(Formulas.totalXpForLevel(newLevel + 1))) {
      newLevel++;
      leveledUp = true;
      Logger.info(`Player leveled up to ${newLevel}`);
    }

    return { newXp, newLevel, leveledUp };
  }

  getXpForLevel(level: number): number {
    return Formulas.xpForLevel(level);
  }

  getTotalXpForLevel(level: number): number {
    return Formulas.totalXpForLevel(level);
  }

  calculateStatPoints(currentLevel: number, newLevel: number): number {
    let points = 0;
    for (let i = currentLevel + 1; i <= newLevel; i++) {
      points += 5;
      if (i % 5 === 0) points += 3;
    }
    return points;
  }

  getLevelProgress(xp: bigint, level: number): { current: bigint; required: number; ratio: number } {
    const required = this.getXpForLevel(level + 1);
    const current = xp - BigInt(this.getTotalXpForLevel(level));
    const ratio = required > 0 ? Number(current) / required : 0;
    return { current, required, ratio: Math.min(1, Math.max(0, ratio)) };
  }
}
