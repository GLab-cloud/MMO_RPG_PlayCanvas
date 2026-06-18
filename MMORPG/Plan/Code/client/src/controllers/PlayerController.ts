import { InputController } from './InputController.js';
import { CameraController } from './CameraController.js';
import { NetworkManager } from '../network/NetworkManager.js';

export class PlayerController {
  private app: pc.Application;
  private cameraController: CameraController;
  private inputController: InputController;
  private networkManager: NetworkManager;
  private velocity: pc.Vec3 = new pc.Vec3();
  private moveDir: pc.Vec3 = new pc.Vec3();
  private isSprinting = false;
  private isJumping = false;

  constructor(
    app: pc.Application,
    cameraController: CameraController,
    inputController: InputController,
    networkManager: NetworkManager
  ) {
    this.app = app;
    this.cameraController = cameraController;
    this.inputController = inputController;
    this.networkManager = networkManager;
  }

  update(dt: number): void {
    this.handleMovement(dt);
    this.handleActions();
  }

  private handleMovement(dt: number): void {
    const input = this.inputController.getInput();
    this.isSprinting = input.sprint;

    this.moveDir.set(0, 0, 0);

    if (input.forward) this.moveDir.add(this.cameraController.getForward());
    if (input.backward) this.moveDir.sub(this.cameraController.getForward());
    if (input.left) this.moveDir.sub(this.cameraController.getRight());
    if (input.right) this.moveDir.add(this.cameraController.getRight());

    this.moveDir.y = 0;
    if (this.moveDir.length() > 0) {
      this.moveDir.normalize();
      const speed = this.isSprinting ? 14 : 8;
      this.moveDir.scale(speed * dt);

      const pos = this.moveDir.clone();
      this.networkManager.send('player:move', {
        x: pos.x, y: pos.y, z: pos.z,
        rotation: this.cameraController.getYaw(),
      });
    }

    this.cameraController.update(dt);
  }

  private handleActions(): void {
    const input = this.inputController.getInput();

    if (input.attack) {
      this.networkManager.send('player:action', {
        type: 'attack',
        targetId: input.targetId,
      });
    }

    if (input.interact) {
      this.networkManager.send('player:action', {
        type: 'interact',
        targetId: input.targetId,
      });
    }

    for (let i = 0; i <= 9; i++) {
      const skillKey = `skill${i}` as keyof typeof input;
      if (input[skillKey]) {
        this.networkManager.send('player:action', {
          type: 'skill',
          skillId: `skill_${i}`,
          targetId: input.targetId,
        });
      }
    }

    if (input.mount) {
      this.networkManager.send('player:action', { type: 'mount' });
    }

    if (input.inventory) {
      this.networkManager.send('inventory:open', {});
    }
  }
}
