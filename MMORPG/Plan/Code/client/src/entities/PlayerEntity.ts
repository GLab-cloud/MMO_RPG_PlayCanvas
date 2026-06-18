import { NetworkManager } from '../network/NetworkManager.js';

export class PlayerEntity {
  private entity: pc.Entity;
  private name: string;
  private health: number;
  private maxHealth: number;
  private networkManager: NetworkManager;

  constructor(
    app: pc.Application,
    name: string,
    networkManager: NetworkManager
  ) {
    this.name = name;
    this.health = 100;
    this.maxHealth = 100;
    this.networkManager = networkManager;

    this.entity = new pc.Entity(`Player_${name}`);
    this.entity.addComponent('render', { type: 'capsule' });
    this.entity.setLocalScale(0.6, 1.8, 0.6);
    app.root.addChild(this.entity);
  }

  setPosition(x: number, y: number, z: number): void {
    this.entity.setPosition(x, y, z);
  }

  getPosition(): pc.Vec3 {
    return this.entity.getPosition();
  }

  setRotation(yaw: number): void {
    this.entity.setLocalEulerAngles(0, yaw, 0);
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getEntity(): pc.Entity {
    return this.entity;
  }

  getName(): string {
    return this.name;
  }

  destroy(): void {
    this.entity.destroy();
  }
}
