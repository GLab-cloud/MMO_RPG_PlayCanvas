import * as pc from 'playcanvas';

interface SceneConfig {
  terrainSize: number;
  playerSpawn: { x: number; y: number; z: number };
}

const BUILDINGS = [
  { name: 'entrance-gate', pos: [-180, 0, -180], size: [12, 6, 3], color: [0.5, 0.4, 0.3] },
  { name: 'outpost1', pos: [80, 0, -100], size: [8, 4, 6], color: [0.4, 0.3, 0.2] },
  { name: 'outpost2', pos: [-50, 0, 120], size: [7, 3.5, 5], color: [0.45, 0.35, 0.25] },
];

const NPCS = [
  { name: 'Guard NPC', type: 'guard', pos: [-175, 0, -180] },
];

const MONSTERS = [
  { type: 'Mong', level: [3, 5], pos: [-80, 0, -80], count: 10 },
  { type: 'Lawolf', level: [5, 8], pos: [50, 0, 0], count: 8 },
  { type: 'Giant Guard', level: [8, 10], pos: [100, 0, 100], count: 6 },
];

const TREE_COUNT = 50;
const TREE_COLORS = [
  [0.1, 0.5, 0.1],
  [0.15, 0.55, 0.08],
  [0.12, 0.45, 0.15],
  [0.08, 0.5, 0.12],
];

const GATHERING_NODES = [
  { type: 'ore', color: [0.6, 0.5, 0.4], pos: [-120, 0, -50], count: 5 },
  { type: 'herb', color: [0.2, 0.8, 0.2], pos: [-30, 0, 80], count: 5 },
];

export class SaintMorningScene {
  private app: pc.Application;
  private root: pc.Entity;
  private config: SceneConfig;

  constructor(app: pc.Application, root: pc.Entity, config: SceneConfig) {
    this.app = app;
    this.root = root;
    this.config = config;
  }

  build(): pc.Entity {
    this.createTerrain();
    this.createHills();
    this.createTrees();
    this.createBuildings();
    this.createNPCs();
    this.createMonsters();
    this.createGatheringNodes();
    this.createBorders();
    this.setupEnvironment();
    return this.root;
  }

  update(_dt: number): void {
    // Scene update logic (if needed)
  }

  private createTerrain(): void {
    const terrain = new pc.Entity('terrain');
    terrain.addComponent('render', {
      type: 'plane',
      material: this.createMaterial([0.25, 0.5, 0.12], [0.05, 0.05, 0.05]),
    });
    terrain.setLocalScale(400, 1, 400);
    terrain.setLocalPosition(0, -0.5, 0);
    this.root.addChild(terrain);
  }

  private createMaterial(diffuse: number[], specular: number[]): pc.Material {
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(diffuse[0], diffuse[1], diffuse[2]);
    mat.specular = new pc.Color(specular[0], specular[1], specular[2]);
    mat.metalness = 0;
    mat.update();
    return mat;
  }

  private createHills(): void {
    const hillPositions = [
      [-50, 0, -30], [60, 0, 40], [-80, 0, 80],
      [30, 0, -100], [120, 0, -40], [-100, 0, -120],
    ];
    for (let i = 0; i < hillPositions.length; i++) {
      const hill = new pc.Entity(`hill-${i}`);
      hill.addComponent('render', {
        type: 'sphere',
        material: this.createMaterial([0.2, 0.45, 0.1], [0, 0, 0]),
      });
      const [x, _, z] = hillPositions[i];
      hill.setLocalPosition(x, -0.2, z);
      hill.setLocalScale(12 + Math.random() * 8, 2 + Math.random() * 3, 12 + Math.random() * 8);
      this.root.addChild(hill);
    }
  }

  private createTrees(): void {
    for (let i = 0; i < TREE_COUNT; i++) {
      const tree = new pc.Entity(`tree-${i}`);
      const trunk = new pc.Entity(`tree-${i}-trunk`);
      trunk.addComponent('render', {
        type: 'cylinder',
        material: this.createMaterial([0.4, 0.25, 0.1], [0.05, 0.05, 0.05]),
      });
      trunk.setLocalScale(0.3, 2, 0.3);
      trunk.setLocalPosition(0, 1, 0);
      tree.addChild(trunk);

      const foliage = new pc.Entity(`tree-${i}-foliage`);
      const color = TREE_COLORS[Math.floor(Math.random() * TREE_COLORS.length)];
      foliage.addComponent('render', {
        type: 'cone',
        material: this.createMaterial(color, [0, 0, 0]),
      });
      foliage.setLocalScale(2 + Math.random(), 2 + Math.random(), 2 + Math.random());
      foliage.setLocalPosition(0, 3 + Math.random(), 0);
      tree.addChild(foliage);

      const x = (Math.random() - 0.5) * 350;
      const z = (Math.random() - 0.5) * 350;
      if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
      tree.setLocalPosition(x, 0, z);
      this.root.addChild(tree);
    }
  }

  private createBuildings(): void {
    for (const b of BUILDINGS) {
      const entity = new pc.Entity(b.name);
      entity.addComponent('render', {
        type: 'box',
        material: this.createMaterial(b.color, [0.1, 0.1, 0.1]),
      });
      entity.setLocalPosition(b.pos[0], b.pos[1] + b.size[1] / 2, b.pos[2]);
      entity.setLocalScale(b.size[0], b.size[1], b.size[2]);
      this.root.addChild(entity);

      const roof = new pc.Entity(`${b.name}-roof`);
      roof.addComponent('render', {
        type: 'cone',
        material: this.createMaterial([0.3, 0.15, 0.05], [0.05, 0.05, 0.05]),
      });
      roof.setLocalPosition(b.pos[0], b.pos[1] + b.size[1] + 0.5, b.pos[2]);
      roof.setLocalScale(b.size[0] * 0.8, 1, b.size[2] * 0.8);
      this.root.addChild(roof);
    }
  }

  private createNPCs(): void {
    for (const npc of NPCS) {
      const entity = new pc.Entity(npc.name);
      const body = new pc.Entity(`${npc.name}-body`);
      body.addComponent('render', {
        type: 'cylinder',
        material: this.createMaterial([0.2, 0.4, 0.6], [0.1, 0.1, 0.1]),
      });
      body.setLocalScale(0.8, 1.5, 0.8);
      body.setLocalPosition(0, 0.75, 0);
      entity.addChild(body);

      const head = new pc.Entity(`${npc.name}-head`);
      head.addComponent('render', {
        type: 'sphere',
        material: this.createMaterial([0.9, 0.8, 0.7], [0.1, 0.1, 0.1]),
      });
      head.setLocalScale(0.4, 0.4, 0.4);
      head.setLocalPosition(0, 1.6, 0);
      entity.addChild(head);

      entity.setLocalPosition(npc.pos[0], npc.pos[1], npc.pos[2]);
      this.root.addChild(entity);
    }
  }

  private createMonsters(): void {
    const monsterColors: Record<string, number[]> = {
      'Mong': [0.8, 0.4, 0.2],
      'Lawolf': [0.3, 0.3, 0.7],
      'Giant Guard': [0.7, 0.2, 0.2],
    };
    const monsterSizes: Record<string, number[]> = {
      'Mong': [0.7, 0.7, 0.7],
      'Lawolf': [0.9, 0.9, 0.9],
      'Giant Guard': [1.2, 1.2, 1.2],
    };

    for (const zone of MONSTERS) {
      for (let i = 0; i < zone.count; i++) {
        const entity = new pc.Entity(`monster-${zone.type}-${i}`);
        const color = monsterColors[zone.type] || [0.5, 0.5, 0.5];
        const size = monsterSizes[zone.type] || [0.8, 0.8, 0.8];
        entity.addComponent('render', {
          type: 'box',
          material: this.createMaterial(color, [0.1, 0.1, 0.1]),
        });
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetZ = (Math.random() - 0.5) * 30;
        entity.setLocalPosition(zone.pos[0] + offsetX, size[1] / 2, zone.pos[1] + offsetZ);
        entity.setLocalScale(size[0], size[1], size[2]);
        this.root.addChild(entity);
      }
    }
  }

  private createGatheringNodes(): void {
    for (const zone of GATHERING_NODES) {
      for (let i = 0; i < zone.count; i++) {
        const entity = new pc.Entity(`gathering-${zone.type}-${i}`);
        entity.addComponent('render', {
          type: 'sphere',
          material: this.createMaterial(zone.color, [0.2, 0.2, 0.2]),
        });
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetZ = (Math.random() - 0.5) * 20;
        entity.setLocalPosition(zone.pos[0] + offsetX, 0.3, zone.pos[1] + offsetZ);
        entity.setLocalScale(0.4, 0.4, 0.4);
        this.root.addChild(entity);
      }
    }
  }

  private createBorders(): void {
    const borderSize = 200;
    const borderHeight = 3;
    for (let i = 0; i < 4; i++) {
      const wall = new pc.Entity(`wall-${i}`);
      wall.addComponent('render', {
        type: 'box',
        material: this.createMaterial([0.4, 0.35, 0.3], [0.05, 0.05, 0.05]),
      });
      const angle = (i * Math.PI) / 2;
      const x = Math.cos(angle) * borderSize;
      const z = Math.sin(angle) * borderSize;
      wall.setLocalPosition(x, borderHeight / 2, z);
      if (i % 2 === 0) {
        wall.setLocalScale(2, borderHeight, 400);
      } else {
        wall.setLocalScale(400, borderHeight, 2);
      }
      this.root.addChild(wall);
    }
  }

  private setupEnvironment(): void {
    this.app.scene.ambientLight = new pc.Color(0.4, 0.45, 0.5);
    this.app.scene.fog = 'linear';
    this.app.scene.fogColor = new pc.Color(0.65, 0.7, 0.75);
    this.app.scene.fogStart = 80;
    this.app.scene.fogEnd = 200;
  }
}
