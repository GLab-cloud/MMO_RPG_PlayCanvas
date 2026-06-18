import * as pc from 'playcanvas';

interface SceneConfig {
  terrainSize: number;
  playerSpawn: { x: number; y: number; z: number };
}

const BUILDINGS = [
  { name: 'house1', pos: [20, 0, 15], size: [8, 4, 6], wall: [0.75, 0.55, 0.35], roof: [0.55, 0.2, 0.1] },
  { name: 'house2', pos: [-15, 0, 20], size: [6, 3.5, 5], wall: [0.65, 0.45, 0.25], roof: [0.5, 0.15, 0.05] },
  { name: 'house3', pos: [10, 0, -18], size: [7, 3.5, 6], wall: [0.7, 0.5, 0.3], roof: [0.6, 0.25, 0.1] },
  { name: 'weapon-shop', pos: [25, 0, -10], size: [6, 4, 5], wall: [0.55, 0.25, 0.25], roof: [0.7, 0.15, 0.1] },
  { name: 'armor-shop', pos: [-22, 0, -12], size: [6, 4, 5], wall: [0.2, 0.35, 0.65], roof: [0.3, 0.2, 0.5] },
  { name: 'magic-shop', pos: [30, 0, 8], size: [5, 4, 5], wall: [0.35, 0.2, 0.55], roof: [0.5, 0.2, 0.6] },
  { name: 'storage', pos: [-28, 0, 10], size: [5, 3.5, 5], wall: [0.5, 0.5, 0.5], roof: [0.4, 0.2, 0.1] },
  { name: 'quest-building', pos: [5, 0, 22], size: [7, 4, 6], wall: [0.75, 0.7, 0.25], roof: [0.6, 0.4, 0.1] },
  { name: 'skill-master', pos: [18, 0, -22], size: [5, 3.5, 5], wall: [0.2, 0.55, 0.35], roof: [0.15, 0.4, 0.2] },
  { name: 'bank', pos: [-30, 0, -15], size: [6, 4, 6], wall: [0.7, 0.65, 0.15], roof: [0.55, 0.4, 0.1] },
];

const NPCS = [
  { name: 'Weapon Merchant', type: 'shop', color: [0.2, 0.6, 0.8], pos: [25, 0, -6] },
  { name: 'Armor Merchant', type: 'shop', color: [0.2, 0.3, 0.7], pos: [-22, 0, -8] },
  { name: 'Magic Merchant', type: 'shop', color: [0.4, 0.2, 0.6], pos: [30, 0, 12] },
  { name: 'Storage Keeper', type: 'storage', color: [0.5, 0.5, 0.5], pos: [-28, 0, 14] },
  { name: 'Quest Guide', type: 'quest', color: [0.8, 0.7, 0.2], pos: [5, 0, 26] },
  { name: 'Skill Master', type: 'skill', color: [0.2, 0.7, 0.4], pos: [18, 0, -18] },
  { name: 'Class Master', type: 'class', color: [0.7, 0.3, 0.6], pos: [-5, 0, -25] },
  { name: 'Transport NPC', type: 'transport', color: [0.4, 0.3, 0.7], pos: [35, 0, -5] },
  { name: 'Banker', type: 'bank', color: [0.7, 0.6, 0.1], pos: [-30, 0, -11] },
];

const MONSTER_ZONES = [
  { type: 'pukepuke', color: [0.55, 0.2, 0.7], level: [1, 3], pos: [-60, 0, 60], count: 8 },
  { type: 'pukepuke', color: [0.65, 0.15, 0.6], level: [1, 3], pos: [60, 0, -60], count: 8 },
];

const PATHS = [
  { pos: [0, 0, 0], scale: [4, 0.05, 80] },
  { pos: [0, 0, 0], scale: [80, 0.05, 4] },
  { pos: [25, 0, -8], scale: [3, 0.05, 16] },
  { pos: [-22, 0, -10], scale: [3, 0.05, 16] },
  { pos: [33, 0, 10], scale: [3, 0.05, 12] },
  { pos: [-28, 0, 12], scale: [3, 0.05, 12] },
];

const LAMP_POSTS = [
  [-12, 0, -10], [12, 0, -10], [-12, 0, 10], [12, 0, 10],
  [0, 0, -20], [0, 0, 20], [25, 0, 2], [-22, 0, -2],
  [20, 0, -18], [-15, 0, 22],
];

export class FlarineScene {
  private app: pc.Application;
  private root: pc.Entity;
  private config: SceneConfig;
  private npcEntities: { entity: pc.Entity; baseY: number; phase: number }[] = [];
  private monsterEntities: { entity: pc.Entity; baseY: number; phase: number }[] = [];
  private time: number = 0;

  constructor(app: pc.Application, root: pc.Entity, config: SceneConfig) {
    this.app = app;
    this.root = root;
    this.config = config;
  }

  build(): pc.Entity {
    this.createTerrain();
    this.createPaths();
    this.createBuildings();
    this.createLampPosts();
    this.createNPCs();
    this.createMonsters();
    this.setupEnvironment();
    return this.root;
  }

  update(dt: number): void {
    this.time += dt;
    for (const npc of this.npcEntities) {
      const pos = npc.entity.getLocalPosition();
      pos.y = npc.baseY + 0.15 + Math.sin(this.time * 1.2 + npc.phase) * 0.12;
      npc.entity.setLocalPosition(pos);
    }
    for (const mon of this.monsterEntities) {
      const pos = mon.entity.getLocalPosition();
      pos.y = mon.baseY + 0.3 + Math.sin(this.time * 1.8 + mon.phase) * 0.2;
      mon.entity.setLocalPosition(pos);
    }
  }

  private createTerrain(): void {
    const terrain = new pc.Entity('terrain');
    terrain.addComponent('render', {
      type: 'plane',
      material: this.createMaterial([0.22, 0.6, 0.12], [0.02, 0.02, 0.02]),
    });
    terrain.setLocalScale(200, 1, 200);
    terrain.setLocalPosition(0, -0.5, 0);
    this.root.addChild(terrain);
  }

  private createPaths(): void {
    for (let i = 0; i < PATHS.length; i++) {
      const path = new pc.Entity(`path-${i}`);
      path.addComponent('render', {
        type: 'plane',
        material: this.createMaterial(
          i === 0 || i === 1 ? [0.55, 0.5, 0.45] : [0.5, 0.45, 0.4],
          [0, 0, 0]
        ),
      });
      const p = PATHS[i];
      path.setLocalPosition(p.pos[0], -0.45, p.pos[2]);
      path.setLocalScale(p.scale[0], p.scale[1], p.scale[2]);
      this.root.addChild(path);
    }
  }

  private createBuildings(): void {
    for (const b of BUILDINGS) {
      const entity = new pc.Entity(b.name);
      entity.addComponent('render', {
        type: 'box',
        material: this.createMaterial(b.wall, [0.05, 0.05, 0.05]),
      });
      entity.setLocalPosition(b.pos[0], b.pos[1] + b.size[1] / 2, b.pos[2]);
      entity.setLocalScale(b.size[0], b.size[1], b.size[2]);
      this.root.addChild(entity);

      const roof = new pc.Entity(`${b.name}-roof`);
      roof.addComponent('render', {
        type: 'cone',
        material: this.createMaterial(b.roof, [0.02, 0.02, 0.02]),
      });
      roof.setLocalPosition(b.pos[0], b.pos[1] + b.size[1] + 0.5, b.pos[2]);
      roof.setLocalScale(b.size[0] * 0.9, 1.2, b.size[2] * 0.9);
      this.root.addChild(roof);

      const windowW = new pc.Entity(`${b.name}-window`);
      windowW.addComponent('render', {
        type: 'box',
        material: this.createMaterial([0.85, 0.85, 0.7], [0.3, 0.3, 0.2]),
      });
      windowW.setLocalPosition(
        b.pos[0] + b.size[0] / 2 + 0.05,
        b.pos[1] + b.size[1] * 0.6,
        b.pos[2]
      );
      windowW.setLocalScale(0.1, b.size[1] * 0.5, b.size[2] * 0.4);
      this.root.addChild(windowW);
    }
  }

  private createLampPosts(): void {
    for (let i = 0; i < LAMP_POSTS.length; i++) {
      const [x, _, z] = LAMP_POSTS[i];
      const pole = new pc.Entity(`lamp-pole-${i}`);
      pole.addComponent('render', {
        type: 'cylinder',
        material: this.createMaterial([0.25, 0.25, 0.25], [0.3, 0.3, 0.3]),
      });
      pole.setLocalPosition(x, 1.5, z);
      pole.setLocalScale(0.15, 3, 0.15);
      this.root.addChild(pole);

      const glow = new pc.Entity(`lamp-glow-${i}`);
      glow.addComponent('render', {
        type: 'sphere',
        material: this.createMaterial([1, 0.9, 0.6], [0, 0, 0]),
      });
      glow.setLocalPosition(x, 3.2, z);
      glow.setLocalScale(0.3, 0.3, 0.3);
      this.root.addChild(glow);
    }
  }

  private createNPCs(): void {
    for (const npc of NPCS) {
      const entity = new pc.Entity(npc.name);
      const body = new pc.Entity(`${npc.name}-body`);
      body.addComponent('render', {
        type: 'cylinder',
        material: this.createMaterial(npc.color, [0.05, 0.05, 0.05]),
      });
      body.setLocalScale(0.7, 1.4, 0.7);
      body.setLocalPosition(0, 0.7, 0);
      entity.addChild(body);

      const head = new pc.Entity(`${npc.name}-head`);
      head.addComponent('render', {
        type: 'sphere',
        material: this.createMaterial([0.95, 0.85, 0.75], [0.05, 0.05, 0.05]),
      });
      head.setLocalScale(0.35, 0.35, 0.35);
      head.setLocalPosition(0, 1.55, 0);
      entity.addChild(head);

      const hat = new pc.Entity(`${npc.name}-hat`);
      const hatColor = npc.type === 'quest' ? [0.8, 0.7, 0.2] :
        npc.type === 'shop' ? [0.2, 0.6, 0.8] :
        npc.type === 'skill' ? [0.2, 0.7, 0.4] : [0.4, 0.3, 0.6];
      hat.addComponent('render', {
        type: 'cone',
        material: this.createMaterial(hatColor, [0.02, 0.02, 0.02]),
      });
      hat.setLocalScale(0.45, 0.5, 0.45);
      hat.setLocalPosition(0, 1.85, 0);
      entity.addChild(hat);

      const nameLabel = new pc.Entity(`${npc.name}-label`);
      const text = new pc.Entity('text');
      text.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        text: npc.name,
        color: new pc.Color(1, 1, 1),
        fontSize: 12,
      });
      text.setLocalPosition(0, 2.4, 0);
      entity.addChild(text);

      entity.setLocalPosition(npc.pos[0], npc.pos[1], npc.pos[2]);
      this.root.addChild(entity);
      this.npcEntities.push({ entity, baseY: npc.pos[1], phase: Math.random() * Math.PI * 2 });
    }
  }

  private createMonsters(): void {
    for (const zone of MONSTER_ZONES) {
      for (let i = 0; i < zone.count; i++) {
        const entity = new pc.Entity(`monster-${zone.type}-${i}`);

        const body = new pc.Entity(`monster-${zone.type}-${i}-body`);
        body.addComponent('render', {
          type: 'sphere',
          material: this.createMaterial(zone.color, [0.05, 0.05, 0.05]),
        });
        body.setLocalScale(0.7, 0.7, 0.7);
        body.setLocalPosition(0, 0.6, 0);
        entity.addChild(body);

        const eyeL = new pc.Entity(`monster-${i}-eyeL`);
        eyeL.addComponent('render', {
          type: 'sphere',
          material: this.createEyesMaterial(),
        });
        eyeL.setLocalScale(0.1, 0.1, 0.1);
        eyeL.setLocalPosition(-0.2, 0.75, -0.35);
        entity.addChild(eyeL);

        const eyeR = new pc.Entity(`monster-${i}-eyeR`);
        eyeR.addComponent('render', {
          type: 'sphere',
          material: this.createEyesMaterial(),
        });
        eyeR.setLocalScale(0.1, 0.1, 0.1);
        eyeR.setLocalPosition(0.2, 0.75, -0.35);
        entity.addChild(eyeR);

        const offsetX = (Math.random() - 0.5) * 20;
        const offsetZ = (Math.random() - 0.5) * 20;
        entity.setLocalPosition(zone.pos[0] + offsetX, 0, zone.pos[2] + offsetZ);
        this.root.addChild(entity);
        this.monsterEntities.push({ entity, baseY: 0, phase: Math.random() * Math.PI * 2 });
      }
    }
  }

  private createEyesMaterial(): pc.Material {
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(1, 1, 1);
    mat.specular = new pc.Color(0, 0, 0);
    mat.emissive = new pc.Color(1, 0.1, 0.1);
    mat.metalness = 0;
    mat.update();
    return mat;
  }

  private createMaterial(diffuse: number[], specular: number[]): pc.Material {
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(diffuse[0], diffuse[1], diffuse[2]);
    mat.specular = new pc.Color(specular[0], specular[1], specular[2]);
    mat.metalness = 0;
    mat.update();
    return mat;
  }

  private setupEnvironment(): void {
    this.app.scene.ambientLight = new pc.Color(0.4, 0.45, 0.55);
    this.app.scene.fog = 'linear';
    this.app.scene.fogColor = new pc.Color(0.65, 0.75, 0.85);
    this.app.scene.fogStart = 60;
    this.app.scene.fogEnd = 140;
  }
}
