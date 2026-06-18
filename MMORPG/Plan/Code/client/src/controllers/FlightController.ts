import { CameraController } from './CameraController.js';

export class FlightController {
  private cameraController: CameraController;
  private isFlying: boolean = false;
  private altitude: number = 0;
  private maxAltitude: number = 20;
  private altitudeSpeed: number = 5;
  private stamina: number = 100;
  private maxStamina: number = 100;

  constructor(cameraController: CameraController) {
    this.cameraController = cameraController;
  }

  toggleFlight(): void {
    this.isFlying = !this.isFlying;
    if (this.isFlying) {
      this.altitude = 5;
    } else {
      this.altitude = 0;
    }
  }

  setFlying(flying: boolean): void {
    this.isFlying = flying;
  }

  isCurrentlyFlying(): boolean {
    return this.isFlying;
  }

  getAltitude(): number {
    return this.altitude;
  }

  adjustAltitude(direction: number): void {
    if (!this.isFlying) return;
    this.altitude = Math.max(0, Math.min(this.maxAltitude, this.altitude + direction * this.altitudeSpeed * 0.016));
  }

  getStamina(): number {
    return this.stamina;
  }

  getStaminaRatio(): number {
    return this.stamina / this.maxStamina;
  }

  update(dt: number): void {
    if (this.isFlying) {
      this.stamina = Math.max(0, this.stamina - dt * 2);
      if (this.stamina <= 0) {
        this.toggleFlight();
      }
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 5);
    }
  }
}
