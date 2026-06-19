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

    this.sceneManager.registerScene('Flarine', {
      name: 'Flarine',
      terrainSize: 200,
      playerSpawn: { x: 0, y: 0, z: 0 },
      bounds: { min: -100, max: 100 },
      monsters: [],
      npcs: [],
    });

    this.setupNetworkCallbacks();
    this.ui.setInputController(this.inputController);
    this.ui.showLobby({
      onCreateMatch: (name, map, maxPlayers) => this.network.sendToLobby('create_match', { name, map, maxPlayers }),
      onJoinMatch: (matchId) => this.network.sendToLobby('join_match', { matchId }),
      onLeaveMatch: (matchId) => this.network.sendToLobby('leave_match', { matchId }),
      onStartMatch: (matchId) => this.network.sendToLobby('start_match', { matchId }),
      onExitGame: () => this.exitGame(),
    });

    this.pcApp.on('update', (dt: number) => {
      if (this.running) this.update(dt);
    });

    this.running = true;
  }

  private setupNetworkCallbacks(): void {
    this.network.setCallbacks({
      onMatchList: (matches) => this.ui.updateMatchList(matches),
      onMatchCreated: (matchId) => {
        console.log('Match created:', matchId);
        this.ui.setMyMatchId(matchId);
      },
      onMatchJoined: (matchId) => {
        console.log('Joined match:', matchId);
        this.ui.setMyMatchId(matchId);
      },
      onMatchStarting: (matchId) => this.onMatchStarting(matchId),
      onError: (message) => console.error('Network error:', message),
      onLobbyConnected: () => console.log('Lobby connected'),
      onWorldConnected: () => console.log('World connected'),
      onDisconnected: () => console.log('Disconnected'),
    });
  }

  private async onMatchStarting(matchId: string): Promise<void> {
    this.ui.showWorld();
    this.playerController = new PlayerController(this.pcApp, this.network, this.inputController, this.cameraController);
    await this.sceneManager.loadScene('Flarine');
    await this.network.joinWorldRoom(matchId);
  }

  private exitGame(): void {
    this.network.disconnect();
  }

  connectToServer(_token: string): void {
    this.network.connectToLobby(config.serverUrl);
  }

  update(dt: number): void {
    this.inputController.resetDeltas();

    if (this.network.state === 'world' && this.playerController) {
      this.playerController.update(dt);
      this.cameraController.update(dt);
      this.network.update(dt);
      this.sceneManager.update(dt);
    }
  }
}
