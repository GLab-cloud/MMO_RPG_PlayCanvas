import { Application, Entity } from 'playcanvas';
import { FlarineScene } from './FlarineScene';
import { SaintMorningScene } from './SaintMorningScene';

interface SceneConfig {
  name: string;
  terrainSize: number;
  playerSpawn: { x: number; y: number; z: number };
  bounds: { min: number; max: number };
  monsters: MonsterSpawn[];
  npcs: NPCSpawn[];
}

interface Scene {
  update(dt: number): void;
}

interface MonsterSpawn {
  type: string;
  level: number;
  position: { x: number; y: number; z: number };
  count: number;
}

interface NPCSpawn {
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
}

export class SceneManager {
  private app: Application;
  private currentRoot: Entity | null = null;
  private currentScene: { update(dt: number): void } | null = null;
  private scenes: Map<string, SceneConfig> = new Map();
  private activeEntities: Entity[] = [];

  constructor(app: Application) {
    this.app = app;
  }

  registerScene(name: string, config: SceneConfig): void {
    this.scenes.set(name, config);
  }

  async loadScene(name: string): Promise<void> {
    this.unloadScene();

    const config = this.scenes.get(name);
    if (!config) {
      console.error(`Scene ${name} not registered`);
      return;
    }

    const sceneRoot = new Entity(`scene-${name}`);
    this.app.root.addChild(sceneRoot);

    switch (name) {
      case 'Flarine': {
        const scene = new FlarineScene(this.app, sceneRoot, config);
        scene.build();
        this.currentRoot = sceneRoot;
        this.currentScene = scene;
        break;
      }
      case 'SaintMorning': {
        const scene = new SaintMorningScene(this.app, sceneRoot, config);
        scene.build();
        this.currentRoot = sceneRoot;
        this.currentScene = scene;
        break;
      }
      default:
        console.warn(`Unknown scene: ${name}`);
    }
  }

  unloadScene(): void {
    if (this.currentRoot) {
      this.currentRoot.destroy();
      this.currentRoot = null;
    }
    this.currentScene = null;
    this.activeEntities = [];
  }

  getCurrentScene(): string | null {
    return this.currentRoot?.name ?? null;
  }

  update(dt: number): void {
    if (this.currentScene) {
      this.currentScene.update(dt);
    }
  }
}
