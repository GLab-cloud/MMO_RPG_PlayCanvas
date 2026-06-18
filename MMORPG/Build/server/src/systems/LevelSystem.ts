import { xpForLevel } from '../utils/Formulas.js';

export interface LevelData {
  level: number;
  xp: number;
  statPoints: number;
}

export class LevelSystem {
  addXp(currentLevel: number, currentXp: number, xpGained: number): { leveledUp: boolean; newLevel: number; newXp: number; statPointsGained: number } {
    let newXp = currentXp + xpGained;
    let newLevel = currentLevel;
    let statPointsGained = 0;
    let leveledUp = false;

    while (newXp >= xpForLevel(newLevel)) {
      newXp -= xpForLevel(newLevel);
      newLevel++;
      statPointsGained += 3;
      leveledUp = true;
    }

    return { leveledUp, newLevel, newXp, statPointsGained };
  }

  xpForLevel(level: number): number {
    return xpForLevel(level);
  }
}
