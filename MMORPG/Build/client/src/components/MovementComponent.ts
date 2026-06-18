import { Vec3 } from 'playcanvas';

export class MovementComponent {
  speed: number;
  velocity: Vec3;
  isFlying: boolean;
  altitude: number;
  private target: Vec3 | null = null;

  constructor(speed: number = 5) {
    this.speed = speed;
    this.velocity = new Vec3(0, 0, 0);
    this.isFlying = false;
    this.altitude = 0;
  }

  moveTo(target: Vec3): void {
    this.target = target.clone();
  }

  setVelocity(vx: number, vy: number, vz: number): void {
    this.velocity.set(vx, vy, vz);
  }

  stop(): void {
    this.velocity.set(0, 0, 0);
    this.target = null;
  }

  setFlight(enabled: boolean, altitude: number): void {
    this.isFlying = enabled;
    this.altitude = altitude;
  }

  update(dt: number): Vec3 {
    if (this.target) {
      const dx = this.target.x - 0;
      const dz = this.target.z - 0;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.1) {
        const moveX = (dx / dist) * this.speed * dt;
        const moveZ = (dz / dist) * this.speed * dt;
        return new Vec3(moveX, 0, moveZ);
      } else {
        this.target = null;
      }
    }
    return new Vec3(this.velocity.x * dt, this.velocity.y * dt, this.velocity.z * dt);
  }
}
