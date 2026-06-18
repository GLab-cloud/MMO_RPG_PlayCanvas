import { clamp } from '../utils/MathHelpers.js';

export class MovementComponent {
  speed: number;
  velocity: { x: number; y: number; z: number };
  isFlying: boolean;
  altitude: number;
  maxAltitude: number;

  constructor(speed: number = 5) {
    this.speed = speed;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.isFlying = false;
    this.altitude = 0;
    this.maxAltitude = 20;
  }

  moveTo(target: { x: number; z: number }, dt: number): void {
    const dx = target.x - this.velocity.x;
    const dz = target.z - this.velocity.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.1) return;
    const factor = this.speed * dt / dist;
    this.velocity.x += dx * factor;
    this.velocity.z += dz * factor;
  }

  stop(): void {
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.velocity.z = 0;
  }

  setFlight(enabled: boolean, altitude: number): void {
    this.isFlying = enabled;
    this.altitude = enabled ? clamp(altitude, 0, this.maxAltitude) : 0;
  }

  getAltitude(): number {
    return this.isFlying ? this.altitude : 0;
  }
}
