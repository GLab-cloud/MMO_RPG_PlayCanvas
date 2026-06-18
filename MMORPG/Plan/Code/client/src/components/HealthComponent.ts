export class HealthComponent {
  current: number;
  max: number;
  regenRate: number;

  constructor(max: number, regenRate: number = 0) {
    this.current = max;
    this.max = max;
    this.regenRate = regenRate;
  }

  takeDamage(amount: number): number {
    const actualDamage = Math.min(this.current, amount);
    this.current -= actualDamage;
    return actualDamage;
  }

  heal(amount: number): void {
    this.current = Math.min(this.max, this.current + amount);
  }

  tick(dt: number): void {
    if (this.regenRate > 0 && this.current < this.max) {
      this.current = Math.min(this.max, this.current + this.regenRate * dt);
    }
  }

  isAlive(): boolean {
    return this.current > 0;
  }

  getRatio(): number {
    return this.max > 0 ? this.current / this.max : 0;
  }

  reset(): void {
    this.current = this.max;
  }
}
