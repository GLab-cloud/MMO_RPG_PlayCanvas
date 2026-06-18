import { calculatePhysical, calculateMagical, isCriticalHit, calculateXpReward } from '../systems/DamageSystem.js';
import { distance } from '../utils/Helpers.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { generateId } from '../utils/Helpers.js';

export class CombatHandler {
  private levelSystem: LevelSystem = new LevelSystem();

  handleAttack(
    player: { id: string; x: number; z: number; level: number; attack: number; magicAttack: number; defense: number; dexterity: number },
    targetMonster: { id: string; x: number; z: number; hp: number; maxHp: number; defense: number; magicDefense: number; level: number },
    monsters: Map<string, any>,
    lootSpawns: Map<string, any>
  ): { monsterId: string; damage: number; critical: boolean; killed: boolean; xpReward?: number } {
    const dist = distance(player.x, player.z, targetMonster.x, targetMonster.z);
    if (dist > 5) {
      return { monsterId: targetMonster.id, damage: 0, critical: false, killed: false };
    }
    const critical = isCriticalHit(player.dexterity);
    const critMult = critical ? 2.0 : 1.0;
    const physicalDmg = calculatePhysical(player.attack, targetMonster.defense, player.level, targetMonster.level, 1.0) * critMult;
    const magicalDmg = calculateMagical(player.magicAttack, targetMonster.magicDefense, player.level, targetMonster.level, 0.3);
    const totalDamage = Math.floor(physicalDmg + magicalDmg);
    targetMonster.hp -= totalDamage;
    if (targetMonster.hp <= 0) {
      targetMonster.hp = 0;
      const xpReward = calculateXpReward(targetMonster.level, player.level);
      const leveledData = this.levelSystem.addXp(player.level, 0, xpReward);
      monsters.delete(targetMonster.id);
      const lootId = generateId();
      lootSpawns.set(lootId, {
        id: lootId,
        x: targetMonster.x,
        z: targetMonster.z,
        items: [{ id: generateId(), name: 'Gold', quantity: Math.floor(Math.random() * 50 + 10) }],
        despawnTimer: 30,
      });
      return { monsterId: targetMonster.id, damage: totalDamage, critical, killed: true, xpReward };
    }
    return { monsterId: targetMonster.id, damage: totalDamage, critical, killed: false };
  }
}
