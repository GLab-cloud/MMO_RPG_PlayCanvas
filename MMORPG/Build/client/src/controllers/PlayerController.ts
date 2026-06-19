import * as pc from 'playcanvas';
import { NetworkManager } from '../network/NetworkManager';
import { InputController } from './InputController';
import { CameraController } from './CameraController';
import { MovementComponent } from '../components/MovementComponent';
import { CombatComponent } from '../components/CombatComponent';
import { MountEntity } from '../entities/MountEntity';

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

  constructor(app: pc.Application, network: NetworkManager, input: InputController, camera: CameraController) {
    this.app = app;
    this.network = network;
    this.input = input;
    this.camera = camera;
    this.movement = new MovementComponent(this.moveSpeed);
    this.combat = new CombatComponent();

    this.player = new pc.Entity('local-player');

    this.mount = new MountEntity(app, 'player-broom', 'broom');
    this.player.addChild(this.mount.entity);
    this.mount.entity.setLocalPosition(0, -0.6, 0);
    this.mount.show();

    const legs = new pc.Entity('local-player-legs');
    legs.addComponent('render', {
      type: 'cylinder',
      material: this.createArmorMaterial([0.15, 0.35, 0.65], [0.2, 0.2, 0.2]),
    });
    legs.setLocalScale(0.7, 0.8, 0.7);
    legs.setLocalPosition(0, 0.4, 0);
    this.player.addChild(legs);

    const body = new pc.Entity('local-player-body');
    body.addComponent('render', {
      type: 'cylinder',
      material: this.createArmorMaterial([0.25, 0.55, 0.85], [0.3, 0.3, 0.3]),
    });
    body.setLocalScale(0.75, 0.6, 0.75);
    body.setLocalPosition(0, 1.0, 0);
    this.player.addChild(body);

    const belt = new pc.Entity('local-player-belt');
    belt.addComponent('render', {
      type: 'cylinder',
      material: this.createArmorMaterial([0.6, 0.5, 0.3], [0.3, 0.3, 0.3]),
    });
    belt.setLocalScale(0.7, 0.08, 0.7);
    belt.setLocalPosition(0, 1.35, 0);
    this.player.addChild(belt);

    const head = new pc.Entity('local-player-head');
    head.addComponent('render', {
      type: 'sphere',
      material: this.createArmorMaterial([0.95, 0.8, 0.7], [0.05, 0.05, 0.05]),
    });
    head.setLocalScale(0.35, 0.35, 0.35);
    head.setLocalPosition(0, 1.6, 0);
    this.player.addChild(head);

    const hair = new pc.Entity('local-player-hair');
    hair.addComponent('render', {
      type: 'sphere',
      material: this.createArmorMaterial([0.15, 0.1, 0.05], [0.05, 0.05, 0.05]),
    });
    hair.setLocalScale(0.3, 0.12, 0.3);
    hair.setLocalPosition(0, 1.85, 0);
    this.player.addChild(hair);

    app.root.addChild(this.player);
    camera.follow(this.player);
  }

  private createArmorMaterial(diffuse: number[], specular: number[]): pc.Material {
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(diffuse[0], diffuse[1], diffuse[2]);
    mat.specular = new pc.Color(specular[0], specular[1], specular[2]);
    mat.metalness = 0;
    mat.update();
    return mat;
  }

  update(dt: number): void {
    this.flyingTime += dt;
    const pos = this.player.getLocalPosition();

    pos.y = 2 + Math.sin(this.flyingTime * 1.5) * 0.15;

    const forward = this.camera.getForward();
    const right = this.camera.getRight();
    const velocity = new pc.Vec3(0, 0, 0);

    if (this.input.forward) {
      velocity.x += forward.x;
      velocity.z += forward.z;
    }
    if (this.input.backward) {
      velocity.x -= forward.x;
      velocity.z -= forward.z;
    }
    if (this.input.left) {
      velocity.x -= right.x;
      velocity.z -= right.z;
    }
    if (this.input.right) {
      velocity.x += right.x;
      velocity.z += right.z;
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

      this.network.sendToWorld('move', {
        x: pos.x, y: pos.y, z: pos.z,
        rotation: targetAngle,
      });
    }

    this.player.setLocalPosition(pos);
    this.mount.update(dt);
    this.combat.tick(dt);
  }

  getPlayer(): pc.Entity {
    return this.player;
  }
}
