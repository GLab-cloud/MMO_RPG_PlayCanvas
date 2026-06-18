export class HealthComponent {
  current: number;
  max: number;
  regenRate: number;

  constructor(max: number, regenRate: number = 0) {
    this.current = max;
    this.max = max;
    this.regenRate = regenRate;
  }

  takeDamage(amount: number): void {
    this.current = Math.max(0, this.current - amount);
  }

  heal(amount: number): void {
    this.current = Math.min(this.max, this.current + amount);
  }

  tick(dt: number): void {
    if (this.current > 0 && this.current < this.max) {
      this.heal(this.regenRate * dt);
    }
  }

  getRatio(): number {
    return this.max > 0 ? this.current / this.max : 0;
  }
}
