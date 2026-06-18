import { config } from '../config.js';

export class CameraController {
  private app: pc.Application;
  private camera: pc.Entity;
  private target: pc.Entity | null = null;
  private distance: number;
  private pitch: number = -15;
  private yaw: number = 0;
  private height: number;
  private sensitivity: number;
  private colliderRadius: number;

  constructor(app: pc.Application) {
    this.app = app;
    this.distance = config.camera.defaultDistance;
    this.height = config.camera.defaultHeight;
    this.sensitivity = config.camera.sensitivity;
    this.colliderRadius = config.camera.collisionRadius;

    this.camera = new pc.Entity('Camera');
    this.camera.addComponent('camera', {
      clearColor: new pc.Color(0.45, 0.6, 0.85),
      farClip: 500,
      nearClip: 0.1,
    });
    app.root.addChild(this.camera);
  }

  setTarget(entity: pc.Entity): void {
    this.target = entity;
  }

  setDistance(d: number): void {
    this.distance = Math.max(config.camera.minDistance, Math.min(config.camera.maxDistance, d));
  }

  zoom(delta: number): void {
    this.setDistance(this.distance + delta * config.camera.zoomSpeed);
  }

  rotate(pitchDelta: number, yawDelta: number): void {
    this.pitch -= pitchDelta * this.sensitivity;
    this.yaw -= yawDelta * this.sensitivity;
    this.pitch = Math.max(-config.camera.pitchLimit, Math.min(config.camera.pitchLimit, this.pitch));
  }

  getForward(): pc.Vec3 {
    const forward = this.camera.forward.clone();
    forward.y = 0;
    forward.normalize();
    return forward;
  }

  getRight(): pc.Vec3 {
    const right = this.camera.right.clone();
    right.y = 0;
    right.normalize();
    return right;
  }

  getYaw(): number {
    return this.yaw;
  }

  getCamera(): pc.Entity {
    return this.camera;
  }

  update(dt: number): void {
    if (!this.target) return;

    const targetPos = this.target.getPosition();
    const q = new pc.Quat();
    q.setFromEulerAngles(this.pitch, this.yaw, 0);
    const offset = q.transformVector(new pc.Vec3(0, 0, -this.distance));
    offset.y += this.height;

    const desiredPos = targetPos.clone().add(offset);

    this.handleCollision(targetPos, desiredPos);

    this.camera.setPosition(desiredPos);
    this.camera.lookAt(targetPos);
  }

  private handleCollision(from: pc.Vec3, to: pc.Vec3): void {
    const dir = to.clone().sub(from);
    const dist = dir.length();
    dir.normalize();
    dir.scale(Math.max(dist, 1));
  }
}
