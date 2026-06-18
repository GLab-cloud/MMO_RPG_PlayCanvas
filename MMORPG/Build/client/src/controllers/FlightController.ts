export class FlightController {
  isFlying: boolean = false;
  altitude: number = 0;
  private maxAltitude: number = 20;
  private minAltitude: number = 2;
  private altitudeSpeed: number = 3;
  private stamina: number = 100;
  private maxStamina: number = 100;
  private staminaDrainRate: number = 10;
  private staminaRegenRate: number = 15;

  toggleFlight(): boolean {
    this.isFlying = !this.isFlying;
    if (!this.isFlying) {
      this.altitude = 0;
    } else {
      this.altitude = this.minAltitude;
    }
    return this.isFlying;
  }

  adjustAltitude(delta: number): void {
    if (!this.isFlying) return;
    this.altitude = Math.max(this.minAltitude, Math.min(this.maxAltitude, this.altitude + delta * this.altitudeSpeed));
  }

  update(dt: number): void {
    if (this.isFlying) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * dt);
      if (this.stamina <= 0) {
        this.toggleFlight();
      }
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * dt);
    }
  }

  getStaminaRatio(): number {
    return this.stamina / this.maxStamina;
  }
}
