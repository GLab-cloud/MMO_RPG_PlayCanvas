export class CombatComponent {
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  critRate: number;
  attackRange: number;
  lastAttackTime: number = 0;

  constructor(
    atk: number = 10,
    def: number = 5,
    matk: number = 10,
    mdef: number = 5,
    critRate: number = 0.05,
    attackRange: number = 3
  ) {
    this.atk = atk;
    this.def = def;
    this.matk = matk;
    this.mdef = mdef;
    this.critRate = critRate;
    this.attackRange = attackRange;
  }

  canAttack(cooldown: number): boolean {
    return Date.now() - this.lastAttackTime >= cooldown * 1000;
  }

  markAttacked(): void {
    this.lastAttackTime = Date.now();
  }

  isInRange(distance: number): boolean {
    return distance <= this.attackRange;
  }
}
