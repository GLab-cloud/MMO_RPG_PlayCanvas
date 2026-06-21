export class CombatComponent {
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  critRate: number;
  attackRange: number;
  private cooldowns: Map<string, number> = new Map();

  constructor() {
    this.atk = 10;
    this.def = 5;
    this.matk = 8;
    this.mdef = 4;
    this.critRate = 0.05;
    this.attackRange = 4;
  }

  canAttack(abilityId?: string): boolean {
    const key = abilityId || 'basic';
    const cd = this.cooldowns.get(key);
    return !cd || cd <= 0;
  }

  attack(abilityId?: string): number {
    const key = abilityId || 'basic';
    if (!this.canAttack(key)) return 0;

    let damage = this.atk + Math.random() * 5;
    if (Math.random() < this.critRate) damage *= 2;

    this.cooldowns.set(key, abilityId ? 1.0 : 0.5);
    return Math.floor(damage);
  }

  tick(dt: number): void {
    for (const [key, time] of this.cooldowns) {
      const newTime = time - dt;
      if (newTime <= 0) {
        this.cooldowns.delete(key);
      } else {
        this.cooldowns.set(key, newTime);
      }
    }
  }
}
