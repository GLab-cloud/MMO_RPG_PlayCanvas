import * as pc from 'playcanvas';

interface TrackedEntity {
  id: string;
  entity: pc.Entity;
  lastPosition: pc.Vec3;
  targetPosition: pc.Vec3;
  lastRotation: number;
  targetRotation: number;
  lastUpdate: number;
  type: 'player' | 'monster';
  nameplate?: pc.Entity;
  hpBar?: pc.Entity;
}

const INTERPOLATION_BUFFER_MS = 100;

export class StateSync {
  private app: pc.Application;
  private entities: Map<string, TrackedEntity> = new Map();
  private localPlayerId: string | null = null;
  onPlayerAdded: ((id: string, name: string) => void) | null = null;
  onPlayerRemoved: ((id: string) => void) | null = null;
  onPlayerRenamed: ((id: string, name: string) => void) | null = null;
  onPlayerHPUpdate: ((id: string, hp: number, maxHp: number) => void) | null = null;

  constructor(app: pc.Application) {
    this.app = app;
  }

  setLocalPlayerId(id: string): void {
    this.localPlayerId = id;
  }

  handleInitialState(data: { players: any[]; monsters: any[] }): void {
    for (const p of data.players) {
      this.addPlayer(p.id, p);
    }
    for (const m of data.monsters) {
      this.addMonster(m.id, m);
    }
  }

  syncMonsterState(monsters: any[]): void {
    for (const m of monsters) {
      const tracked = this.entities.get(m.id);
      if (tracked && tracked.type === 'monster') {
        tracked.lastPosition.copy(tracked.entity.getLocalPosition());
        tracked.targetPosition.set(m.x ?? 0, 0.5, m.z ?? 0);
        tracked.lastUpdate = Date.now();
      } else if (!tracked) {
        this.addMonster(m.id, m);
      }
    }
  }

  addPlayer(id: string, data: any): void {
    if (this.entities.has(id) || id === this.localPlayerId) return;
    const hue = (parseInt(id.slice(-4), 36) % 10) / 10;
    const color = new pc.Color(0.3 + hue * 0.5, 0.3, 0.5 + (1 - hue) * 0.3);

    const entity = new pc.Entity(`remote-player-${id}`);

    const body = new pc.Entity(`${id}-body`);
    body.addComponent('render', { type: 'cylinder' });
    const mat = new pc.StandardMaterial();
    mat.diffuse = color; mat.metalness = 0; mat.update();
    body.render!.material = mat;
    body.setLocalScale(0.8, 1.5, 0.8);
    body.setLocalPosition(0, 0.75, 0);
    entity.addChild(body);

    const head = new pc.Entity(`${id}-head`);
    head.addComponent('render', { type: 'sphere' });
    const headMat = new pc.StandardMaterial();
    headMat.diffuse = new pc.Color(0.9, 0.8, 0.7); headMat.metalness = 0; headMat.update();
    head.render!.material = headMat;
    head.setLocalScale(0.35, 0.35, 0.35);
    head.setLocalPosition(0, 1.55, 0);
    entity.addChild(head);

    const hpBar = new pc.Entity(`${id}-hp`);
    hpBar.addComponent('render', { type: 'box' });
    const hpMat = new pc.StandardMaterial();
    hpMat.diffuse = new pc.Color(0.9, 0.2, 0.2); hpMat.metalness = 0; hpMat.update();
    hpBar.render!.material = hpMat;
    hpBar.setLocalScale(0.76, 0.05, 0.03);
    hpBar.setLocalPosition(0, 2.25, 0);
    entity.addChild(hpBar);

    const x = data.x || 0;
    const z = data.z || 0;
    entity.setLocalPosition(x, 1.0, z);

    this.app.root.addChild(entity);

    this.entities.set(id, {
      id, entity, hpBar,
      lastPosition: new pc.Vec3(x, 1.0, z),
      targetPosition: new pc.Vec3(x, 1.0, z),
      lastRotation: data.rotation || 0,
      targetRotation: data.rotation || 0,
      lastUpdate: Date.now(),
      type: 'player',
    });

    this.onPlayerAdded?.(id, data.name || 'Player');
  }

  addMonster(id: string, data: any): void {
    if (this.entities.has(id)) return;

    const entity = new pc.Entity(`monster-${id}`);

    const body = new pc.Entity(`${id}-mbody`);
    body.addComponent('render', { type: 'box' });
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(0.8, 0.2, 0.2); mat.metalness = 0; mat.update();
    body.render!.material = mat;
    body.setLocalScale(0.6, 0.6, 0.6);
    body.setLocalPosition(0, 0.3, 0);
    entity.addChild(body);

    const hpBar = new pc.Entity(`${id}-mhp`);
    hpBar.addComponent('render', { type: 'box' });
    const hpMat = new pc.StandardMaterial();
    hpMat.diffuse = new pc.Color(0.9, 0.2, 0.2); hpMat.metalness = 0; hpMat.update();
    hpBar.render!.material = hpMat;
    hpBar.setLocalScale(0.5, 0.04, 0.03);
    hpBar.setLocalPosition(0, 0.8, 0);
    entity.addChild(hpBar);

    const x = data.x || 0;
    const z = data.z || 0;
    entity.setLocalPosition(x, 0.5, z);

    this.app.root.addChild(entity);

    this.entities.set(id, {
      id, entity, hpBar,
      lastPosition: new pc.Vec3(x, 0.5, z),
      targetPosition: new pc.Vec3(x, 0.5, z),
      lastRotation: 0, targetRotation: 0,
      lastUpdate: Date.now(),
      type: 'monster',
    });
  }

  addEntity(id: string, data: any, type: string): void {
    if (type === 'player') this.addPlayer(id, data);
    else this.addMonster(id, data);
  }

  updatePosition(id: string, x: number, z: number, rotation?: number): void {
    const tracked = this.entities.get(id);
    if (!tracked) return;
    tracked.lastPosition.copy(tracked.entity.getLocalPosition());
    tracked.targetPosition.set(x, tracked.type === 'player' ? 1.0 : 0.5, z);
    if (rotation !== undefined) {
      tracked.lastRotation = tracked.targetRotation;
      tracked.targetRotation = rotation;
    }
    tracked.lastUpdate = Date.now();
  }

  updateHP(id: string, hpPct: number): void {
    const tracked = this.entities.get(id);
    if (!tracked || !tracked.hpBar) return;
    const baseScale = tracked.type === 'player' ? 0.76 : 0.5;
    tracked.hpBar.setLocalScale(baseScale * Math.max(0, hpPct), 0.05, 0.03);
  }

  removeEntity(id: string): void {
    const tracked = this.entities.get(id);
    if (tracked) {
      tracked.entity.destroy();
      this.entities.delete(id);
    }
    this.onPlayerRemoved?.(id);
  }

  update(dt: number): void {
    const now = Date.now();
    for (const [, tracked] of this.entities) {
      const elapsed = now - tracked.lastUpdate;
      const t = Math.min(elapsed / INTERPOLATION_BUFFER_MS, 1);
      const currentPos = tracked.entity.getLocalPosition();
      currentPos.lerp(tracked.lastPosition, tracked.targetPosition, t);
      tracked.entity.setLocalPosition(currentPos);

      if (tracked.type === 'player') {
        const rot = tracked.lastRotation + (tracked.targetRotation - tracked.lastRotation) * t;
        tracked.entity.setLocalEulerAngles(0, rot, 0);
      }
    }
  }

  getEntity(id: string): pc.Entity | undefined {
    return this.entities.get(id)?.entity;
  }

  getAllPlayerPositions(): { id: string; x: number; y: number; z: number }[] {
    const result: { id: string; x: number; y: number; z: number }[] = [];
    for (const [id, tracked] of this.entities) {
      if (tracked.type === 'player') {
        const pos = tracked.entity.getLocalPosition();
        result.push({ id, x: pos.x, y: pos.y + 2.8, z: pos.z });
      }
    }
    return result;
  }
}
