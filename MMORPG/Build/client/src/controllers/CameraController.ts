import * as pc from 'playcanvas';
import { InputController } from './InputController';
import { config } from '../config';

export class CameraController {
  private app: pc.Application;
  private input: InputController;
  private camera: pc.Entity;
  private distance: number;
  private height: number;
  private yaw: number = 0;
  private pitch: number = 45;
  private target: pc.Entity | null = null;

  constructor(app: pc.Application, input: InputController) {
    this.app = app;
    this.input = input;
    this.distance = config.camera.defaultDistance;
    this.height = config.camera.defaultHeight;

    this.camera = new pc.Entity('camera');
    this.camera.addComponent('camera', {
      clearColor: new pc.Color(0.4, 0.7, 0.95),
      farClip: 500,
      nearClip: 0.1,
    });
    app.root.addChild(this.camera);
  }

  follow(target: pc.Entity): void {
    this.target = target;
  }

  setDistance(dist: number): void {
    this.distance = Math.max(config.camera.minDistance, Math.min(config.camera.maxDistance, dist));
  }

  zoom(delta: number): void {
    this.setDistance(this.distance + delta * config.camera.zoomSpeed);
  }

  rotate(deltaX: number, deltaY: number): void {
    this.yaw -= deltaX * config.camera.sensitivity;
    this.pitch = Math.max(-config.camera.pitchLimit, Math.min(config.camera.pitchLimit, this.pitch + deltaY * config.camera.sensitivity));
  }

  getForward(): pc.Vec3 {
    const rad = this.yaw * Math.PI / 180;
    return new pc.Vec3(-Math.sin(rad), 0, -Math.cos(rad));
  }

  getRight(): pc.Vec3 {
    const rad = this.yaw * Math.PI / 180;
    return new pc.Vec3(Math.cos(rad), 0, -Math.sin(rad));
  }

  getCamera(): pc.Entity {
    return this.camera;
  }

  getYaw(): number {
    return this.yaw;
  }

  update(dt: number): void {
    if (this.input.scrollDelta !== 0) {
      this.zoom(-this.input.scrollDelta);
    }

    if (this.input.mouseDeltaX !== 0 || this.input.mouseDeltaY !== 0) {
      this.rotate(this.input.mouseDeltaX, this.input.mouseDeltaY);
    }

    if (!this.target) return;

    const targetPos = this.target.getLocalPosition();
    const pitchRad = this.pitch * Math.PI / 180;
    const yawRad = this.yaw * Math.PI / 180;

    const offsetX = this.distance * Math.cos(pitchRad) * Math.sin(yawRad);
    const offsetY = this.distance * Math.sin(pitchRad) + this.height;
    const offsetZ = this.distance * Math.cos(pitchRad) * Math.cos(yawRad);

    this.camera.setLocalPosition(
      targetPos.x + offsetX,
      targetPos.y + offsetY,
      targetPos.z + offsetZ
    );
    this.camera.lookAt(targetPos.x, targetPos.y + 1, targetPos.z);
  }
}
