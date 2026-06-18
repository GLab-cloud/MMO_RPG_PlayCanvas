import { Application } from 'playcanvas';
import { NetworkManager } from './network/NetworkManager.js';
import { UIManager } from './ui/UIManager.js';
import { PlayerController } from './controllers/PlayerController.js';
import { CameraController } from './controllers/CameraController.js';
import { InputController } from './controllers/InputController.js';
import { AnimationController } from './controllers/AnimationController.js';
import { FlightController } from './controllers/FlightController.js';
import { AudioSystem } from './systems/AudioSystem.js';
import { config } from './config.js';

class GameClient {
  private app!: Application;
  private networkManager!: NetworkManager;
  private uiManager!: UIManager;
  private playerController!: PlayerController;
  private cameraController!: CameraController;
  private inputController!: InputController;
  private animationController!: AnimationController;
  private flightController!: FlightController;
  private audioSystem!: AudioSystem;
  private entities: Map<string, pc.Entity> = new Map();

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new Application(canvas, {});
    await this.app.init();

    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this.app.start();

    this.networkManager = new NetworkManager();
    this.uiManager = new UIManager(this.app);
    this.cameraController = new CameraController(this.app);
    this.inputController = new InputController(this.app);
    this.animationController = new AnimationController();
    this.flightController = new FlightController(this.cameraController);
    this.audioSystem = new AudioSystem(this.app);
    this.playerController = new PlayerController(
      this.app,
      this.cameraController,
      this.inputController,
      this.networkManager
    );
  }

  async connectToServer(token: string): Promise<void> {
    await this.networkManager.connect(config.serverUrl, token);
    this.networkManager.onStateChange((state) => this.onWorldStateUpdate(state));
    this.networkManager.onMessage('chat:message', (data) => this.uiManager.showChatMessage(data));
    this.networkManager.onMessage('combat:damage', (data) => this.onDamageReceived(data));
    this.networkManager.onMessage('player:joined', (data) => this.onPlayerJoined(data));
    this.networkManager.onMessage('player:left', (data) => this.onPlayerLeft(data));

    this.audioSystem.playMusic('bgm_main');
  }

  private onWorldStateUpdate(state: Record<string, unknown>): void {
    const players = state.players as Map<string, { id: string; name: string; x: number; y: number; z: number }>;
    for (const [id, playerData] of players) {
      if (id === this.networkManager.getSessionId()) continue;
      this.updatePlayerEntity(id, playerData);
    }
  }

  private updatePlayerEntity(id: string, data: { name: string; x: number; y: number; z: number }): void {
    let entity = this.entities.get(id);
    if (!entity) {
      entity = new pc.Entity(`RemotePlayer_${id}`);
      entity.addComponent('render', { type: 'capsule' });
      entity.setLocalScale(0.6, 1.8, 0.6);
      this.app.root.addChild(entity);
      this.entities.set(id, entity);
    }
    entity.setPosition(data.x, data.y, data.z);
  }

  private onDamageReceived(data: { sourceId: string; targetId: string; damage: number }): void {
    this.uiManager.showDamageNumber(data.targetId, data.damage);
    this.audioSystem.playSound('sfx_hit');
  }

  private onPlayerJoined(data: { sessionId: string; name: string }): void {
    this.uiManager.showSystemMessage(`${data.name} has joined the world`);
  }

  private onPlayerLeft(data: { sessionId: string }): void {
    const entity = this.entities.get(data.sessionId);
    if (entity) {
      entity.destroy();
      this.entities.delete(data.sessionId);
    }
  }

  update(dt: number): void {
    this.playerController.update(dt);
    this.cameraController.update(dt);
    this.flightController.update(dt);
    this.animationController.update(dt);

    this.uiManager.update(dt);
  }
}

export { GameClient };
