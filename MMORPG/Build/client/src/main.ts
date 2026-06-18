import * as pc from 'playcanvas';
import { App } from './app';
import { NetworkManager } from './network/NetworkManager';
import { UIManager } from './ui/UIManager';
import { SceneManager } from './scenes/SceneManager';
import { PlayerController } from './controllers/PlayerController';
import { CameraController } from './controllers/CameraController';
import { InputController } from './controllers/InputController';
import { config } from './config';

export class GameClient {
  app!: App;
  pcApp!: pc.Application;
  network!: NetworkManager;
  ui!: UIManager;
  sceneManager!: SceneManager;
  playerController!: PlayerController;
  cameraController!: CameraController;
  inputController!: InputController;
  running: boolean = false;

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new App();
    this.app.canvas = canvas;

    this.pcApp = new pc.Application(canvas, {});
    this.app.pcApp = this.pcApp;

    this.inputController = new InputController();
    this.cameraController = new CameraController(this.pcApp, this.inputController);
    this.sceneManager = new SceneManager(this.pcApp);
    this.network = new NetworkManager(this.pcApp, this.sceneManager);
    this.ui = new UIManager(this.pcApp);
    this.playerController = new PlayerController(this.pcApp, this.network, this.inputController, this.cameraController);

    await this.app.init();

    this.inputController.attach();
    this.ui.init();

    this.sceneManager.registerScene('Flarine', {
      name: 'Flarine',
      terrainSize: 200,
      playerSpawn: { x: 0, y: 0, z: 0 },
      bounds: { min: -100, max: 100 },
      monsters: [],
      npcs: [],
    });
    await this.sceneManager.loadScene('Flarine');

    this.pcApp.on('update', (dt: number) => {
      if (this.running) this.update(dt);
    });

    this.running = true;
  }

  connectToServer(_token: string): void {
    this.network.connect(config.serverUrl);
  }

  update(dt: number): void {
    this.inputController.resetDeltas();
    this.playerController.update(dt);
    this.cameraController.update(dt);
    this.network.update(dt);
    this.sceneManager.update(dt);
  }
}
