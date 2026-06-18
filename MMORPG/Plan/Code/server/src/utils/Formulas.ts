export class Formulas {
  static xpForLevel(level: number): number {
    return Math.floor(Math.pow(level, 3) * 10 + 50);
  }

  static totalXpForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.xpForLevel(i);
    }
    return total;
  }

  static hpFromStamina(baseHp: number, sta: number, hpPerSta: number): number {
    return baseHp + sta * hpPerSta;
  }

  static mpFromSpririt(baseMp: number, spr: number, mpPerSpr: number): number {
    return baseMp + spr * mpPerSpr;
  }

  static physicalAtk(str: number, weaponAtk: number): number {
    return str * 2 + weaponAtk;
  }

  static magicalAtk(int: number, weaponMatk: number): number {
    return int * 2 + weaponMatk;
  }

  static physicalDef(sta: number, armorDef: number): number {
    return sta * 1.5 + armorDef;
  }

  static criticalRate(dex: number): number {
    return Math.min(0.5, dex * 0.005);
  }

  static accuracy(dex: number): number {
    return dex * 2 + 50;
  }

  static evasion(dex: number): number {
    return dex * 1.5 + 10;
  }

  static partyXpBonus(partySize: number): number {
    return 1 + (partySize - 1) * 0.1;
  }

  static dropRateMultiplier(partySize: number): number {
    return 1 + (partySize - 1) * 0.05;
  }

  static mountSpeed(baseSpeed: number, mountSpeedMultiplier: number): number {
    return baseSpeed * mountSpeedMultiplier;
  }

  static enchantSuccessRate(currentLevel: number): number {
    const rates = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.08, 0.05, 0.03, 0.01];
    return rates[Math.min(currentLevel, rates.length - 1)] || 0.01;
  }

  static enchantStatBonus(level: number): number {
    return level * 2;
  }
}
