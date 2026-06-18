export class DamageSystem {
  calculatePhysical(
    atk: number,
    def: number,
    attackerLevel: number,
    skillMultiplier: number
  ): number {
    const baseDamage = (atk * skillMultiplier - def * 0.5);
    const levelBonus = 1 + (attackerLevel - 1) * 0.02;
    const variance = 0.9 + Math.random() * 0.2;
    const raw = baseDamage * levelBonus * variance;
    return Math.max(1, Math.floor(raw));
  }

  calculateMagical(
    matk: number,
    mdef: number,
    attackerLevel: number,
    skillMultiplier: number
  ): number {
    const baseDamage = (matk * skillMultiplier - mdef * 0.5);
    const levelBonus = 1 + (attackerLevel - 1) * 0.02;
    const variance = 0.9 + Math.random() * 0.2;
    const raw = baseDamage * levelBonus * variance;
    return Math.max(1, Math.floor(raw));
  }

  isCriticalHit(dex: number): boolean {
    const critRate = dex * 0.005;
    return Math.random() < critRate;
  }

  calculateXpReward(monsterLevel: number, playerLevel: number): number {
    const baseXp = monsterLevel * 10 + 50;
    const levelDiff = monsterLevel - playerLevel;
    let modifier = 1;
    if (levelDiff > 5) modifier = 1.5;
    else if (levelDiff < -5) modifier = Math.max(0.1, 1 + levelDiff * 0.1);
    return Math.floor(baseXp * modifier);
  }

  calculatePartyXpShare(
    totalXp: number,
    playerLevel: number,
    totalLevels: number,
    partySize: number
  ): number {
    const share = totalXp * (playerLevel * playerLevel) / (totalLevels * totalLevels);
    const partyBonus = 1 + (partySize - 1) * 0.1;
    return Math.floor(share * partyBonus);
  }

  calculateLevelProgress(currentLevel: number): number {
    return Math.floor(Math.pow(currentLevel, 3) * 10 + 50);
  }
}
