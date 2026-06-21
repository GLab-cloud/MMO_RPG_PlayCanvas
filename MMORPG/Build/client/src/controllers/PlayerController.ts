import * as pc from 'playcanvas';
import { NetworkManager } from '../network/NetworkManager';
import { InputController } from './InputController';
import { CameraController } from './CameraController';
import { MovementComponent } from '../components/MovementComponent';
import { CombatComponent } from '../components/CombatComponent';
import { MountEntity } from '../entities/MountEntity';
import { StateSync } from '../network/StateSync';
import { config } from '../config';

export class PlayerController {
  private app: pc.Application;
  private network: NetworkManager;
  private input: InputController;
  private camera: CameraController;
  private player: pc.Entity;
  private movement: MovementComponent;
  private combat: CombatComponent;
  private mount: MountEntity;
  private flyingTime: number = 0;
  private moveSpeed: number = 6;
  private sprintMultiplier: number = 1.6;
  private stateSync: StateSync;
  private onPanelToggle: ((panel: string) => void) | null = null;
  private attackAnimTime: number = 0;
  private isDead: boolean = false;
  private bodyParts: pc.Entity[] = [];

  constructor(app: pc.Application, network: NetworkManager, input: InputController, camera: CameraController) {
    this.app = app;
    this.network = network;
    this.input = input;
    this.camera = camera;
    this.movement = new MovementComponent(this.moveSpeed);
    this.combat = new CombatComponent();
    this.stateSync = network.getStateSync();

    this.player = new pc.Entity('local-player');

    this.mount = new MountEntity(app, 'player-broom', 'broom');
    this.player.addChild(this.mount.entity);
    this.mount.entity.setLocalPosition(0, -0.6, 0);
    this.mount.show();

    const legs = this.createPart('cylinder', [0.15, 0.35, 0.65], [0.2, 0.2, 0.2], [0.7, 0.8, 0.7], [0, 0.4, 0]);
    this.player.addChild(legs);
    this.bodyParts.push(legs);

    const body = this.createPart('cylinder', [0.25, 0.55, 0.85], [0.3, 0.3, 0.3], [0.75, 0.6, 0.75], [0, 1.0, 0]);
    this.player.addChild(body);
    this.bodyParts.push(body);

    const belt = this.createPart('cylinder', [0.6, 0.5, 0.3], [0.3, 0.3, 0.3], [0.7, 0.08, 0.7], [0, 1.35, 0]);
    this.player.addChild(belt);
    this.bodyParts.push(belt);

    const head = this.createPart('sphere', [0.95, 0.8, 0.7], [0.05, 0.05, 0.05], [0.35, 0.35, 0.35], [0, 1.6, 0]);
    this.player.addChild(head);
    this.bodyParts.push(head);

    const hair = this.createPart('sphere', [0.15, 0.1, 0.05], [0.05, 0.05, 0.05], [0.3, 0.12, 0.3], [0, 1.85, 0]);
    this.player.addChild(hair);
    this.bodyParts.push(hair);

    app.root.addChild(this.player);
    camera.follow(this.player);
  }

  private createPart(type: string, diffuse: number[], specular: number[], scale: number[], pos: number[]): pc.Entity {
    const e = new pc.Entity();
    e.addComponent('render', { type, material: this.createMaterial(diffuse, specular) });
    e.setLocalScale(scale[0], scale[1], scale[2]);
    e.setLocalPosition(pos[0], pos[1], pos[2]);
    return e;
  }

  private createMaterial(diffuse: number[], specular: number[]): pc.Material {
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(diffuse[0], diffuse[1], diffuse[2]);
    mat.specular = new pc.Color(specular[0], specular[1], specular[2]);
    mat.metalness = 0;
    mat.update();
    return mat;
  }

  setPanelToggleCallback(cb: (panel: string) => void): void {
    this.onPanelToggle = cb;
  }

  getPlayer(): pc.Entity {
    return this.player;
  }

  getNearestTarget(attackRange: number): string | null {
    const pos = this.player.getLocalPosition();
    let nearest: string | null = null;
    let nearestDist = attackRange;

    const players = this.stateSync.getAllPlayerPositions();
    for (const p of players) {
      const dx = p.x - pos.x;
      const dz = p.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = p.id;
      }
    }
    return nearest;
  }

  doAttack(): void {
    if (this.isDead) return;
    if (!this.combat.canAttack()) return;

    const targetId = this.getNearestTarget(this.combat.attackRange);
    if (targetId) {
      this.network.sendPlayerAttack(targetId);
      this.combat.attack();
      this.attackAnimTime = 0.3;
    }
  }

  die(): void {
    this.isDead = true;
    this.player.setLocalEulerAngles(90, this.player.getLocalEulerAngles().y, 0);
  }

  respawn(): void {
    this.isDead = false;
    this.player.setLocalEulerAngles(0, this.player.getLocalEulerAngles().y, 0);
    this.player.setLocalPosition(0, 2, 0);
  }

  update(dt: number): void {
    if (this.isDead) {
      this.mount.update(dt);
      this.combat.tick(dt);
      return;
    }

    this.flyingTime += dt;
    const pos = this.player.getLocalPosition();
    pos.y = 2 + Math.sin(this.flyingTime * 1.5) * 0.15;

    const forward = this.camera.getForward();
    const right = this.camera.getRight();
    const velocity = new pc.Vec3(0, 0, 0);

    if (this.input.forward) {
      velocity.x += forward.x; velocity.z += forward.z;
    }
    if (this.input.backward) {
      velocity.x -= forward.x; velocity.z -= forward.z;
    }
    if (this.input.left) {
      velocity.x -= right.x; velocity.z -= right.z;
    }
    if (this.input.right) {
      velocity.x += right.x; velocity.z += right.z;
    }

    if (velocity.length() > 0) {
      velocity.normalize();
      const speed = this.input.sprint ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed;
      velocity.mulScalar(speed * dt);
      pos.x += velocity.x;
      pos.z += velocity.z;
      this.player.setLocalPosition(pos);
      const targetAngle = Math.atan2(velocity.x, velocity.z) * 180 / Math.PI;
      this.player.setLocalEulerAngles(0, targetAngle, 0);
      this.network.sendToWorld('player:move', { x: pos.x, z: pos.z, rotation: targetAngle });
    }

    if (this.input.inventory) { this.input.keys.delete('KeyI'); this.onPanelToggle?.('inventory'); }
    if (this.input.character) { this.input.keys.delete('KeyC'); this.onPanelToggle?.('character'); }
    if (this.input.skills) { this.input.keys.delete('KeyK'); this.onPanelToggle?.('skills'); }
    if (this.input.quests) { this.input.keys.delete('KeyL'); this.onPanelToggle?.('quests'); }
    if (this.input.party) { this.input.keys.delete('KeyP'); this.onPanelToggle?.('leaderboard'); }
    if (this.input.mount) { this.input.keys.delete('KeyR'); this.network.sendToWorld('mount:mount', { mountId: 'broom' }); }
    if (this.input.jump) { this.input.keys.delete('Space'); pos.y = 3.5; }

    this.player.setLocalPosition(pos);
    this.mount.update(dt);
    this.combat.tick(dt);

    if (this.attackAnimTime > 0) {
      this.attackAnimTime -= dt;
      const scale = 1 + Math.sin(this.attackAnimTime * 30) * 0.08;
      for (let i = 1; i < this.bodyParts.length; i++) {
        this.bodyParts[i].setLocalScale(
          0.75 * scale, 0.6 * scale, 0.75 * scale
        );
      }
    }

    if (this.input.wasAttackClicked()) {
      this.doAttack();
    }

    for (let i = 0; i < 10; i++) {
      if (this.input.isSkillSlot(i)) {
        this.input.keys.delete(config.controls.skillBar[i]);
        this.doAttack();
        break;
      }
    }
  }
}
