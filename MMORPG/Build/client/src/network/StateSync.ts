import * as pc from 'playcanvas';

interface TrackedEntity {
  id: string;
  entity: pc.Entity;
  lastPosition: pc.Vec3;
  targetPosition: pc.Vec3;
  lastRotation: number;
  targetRotation: number;
  lastUpdate: number;
  type: 'player' | 'monster' | 'weapon';
  nameplate?: pc.Entity;
  hpBar?: pc.Entity;
  templateId?: string;
  glowEntity?: pc.Entity;
}

const INTERPOLATION_BUFFER_MS = 100;

export class StateSync {
  private app: pc.Application;
  private entities: Map<string, TrackedEntity> = new Map();
  localPlayerId: string | null = null;
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

  handleInitialState(data: { players: any[]; monsters: any[]; weapons?: any[] }): void {
    for (const p of data.players) {
      this.addPlayer(p.id, p);
    }
    for (const m of data.monsters) {
      this.addMonster(m.id, m);
    }
    if (data.weapons) {
      for (const w of data.weapons) {
        this.addWeapon(w.id, w);
      }
    }
  }

  syncMonsterState(monsters: any[]): void {
    for (const m of monsters) {
      const tracked = this.entities.get(m.id);
      if (tracked && tracked.type === 'monster') {
        tracked.lastPosition.copy(tracked.entity.getLocalPosition());
        tracked.targetPosition.set(m.x ?? 0, 0.5, m.z ?? 0);
        tracked.lastUpdate = Date.now();
        const hpPct = m.maxHp > 0 ? (m.hp ?? 0) / m.maxHp : 0;
        const baseScale = 0.5;
        tracked.hpBar?.setLocalScale(baseScale * Math.max(0, hpPct), 0.04, 0.03);
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

  removeEntity(id: string, immediate: boolean = true): void {
    const tracked = this.entities.get(id);
    if (tracked) {
      if (immediate) {
        tracked.entity.destroy();
        this.entities.delete(id);
      } else if (tracked.type === 'weapon') {
        this.pickupAnimation(tracked);
      } else {
        this.deathAnimation(tracked);
      }
    }
    this.onPlayerRemoved?.(id);
  }

  private pickupAnimation(tracked: TrackedEntity): void {
    const startScale = 0.7;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;
      const t = elapsed / 500;
      if (t >= 1) {
        clearInterval(interval);
        tracked.entity.destroy();
        this.entities.delete(tracked.id);
        return;
      }
      const s = startScale * (1 + t * 2);
      tracked.entity.setLocalScale(s, s, s);
      tracked.entity.setLocalEulerAngles(0, tracked.entity.getLocalEulerAngles().y + 20, -25);
      if (t > 0.5) {
        const fade = (1 - t) * 2;
        const children = tracked.entity.findComponents('render') as pc.RenderComponent[];
        for (const comp of children) {
          const mat = comp.entity.render?.material;
          if (mat && mat instanceof pc.StandardMaterial) {
            const clone = mat.clone();
            (clone as pc.StandardMaterial).opacity = fade;
            (clone as pc.StandardMaterial).blendType = pc.BLEND_NORMAL;
            clone.update();
            comp.entity.render!.material = clone;
          }
        }
      }
    }, 50);
  }

  private deathAnimation(tracked: TrackedEntity): void {
    const startScale = tracked.entity.getLocalScale().x;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;
      const t = elapsed / 400;
      if (t >= 1) {
        clearInterval(interval);
        tracked.entity.destroy();
        this.entities.delete(tracked.id);
        return;
      }
      const s = startScale * (1 - t);
      tracked.entity.setLocalScale(s, s, s);
    }, 50);
  }

  addWeapon(id: string, data: any): void {
    if (this.entities.has(id)) return;
    const entity = new pc.Entity(`weapon-${id}`);
    const templateId = data.templateId || 'sword';

    const color = new pc.Color(0.9, 0.85, 0.7);
    const metalColor = new pc.Color(0.7, 0.7, 0.75);

    if (templateId === 'sword') {
      const blade = new pc.Entity(`${id}-blade`);
      blade.addComponent('render', { type: 'box' });
      const bladeMat = new pc.StandardMaterial();
      bladeMat.diffuse = new pc.Color(0.8, 0.8, 0.9); bladeMat.metalness = 0.6; bladeMat.update();
      blade.render!.material = bladeMat;
      blade.setLocalScale(0.08, 1.0, 0.02);
      blade.setLocalPosition(0, 0.6, 0);
      entity.addChild(blade);

      const handle = new pc.Entity(`${id}-handle`);
      handle.addComponent('render', { type: 'cylinder' });
      const handleMat = new pc.StandardMaterial();
      handleMat.diffuse = new pc.Color(0.4, 0.25, 0.1); handleMat.metalness = 0; handleMat.update();
      handle.render!.material = handleMat;
      handle.setLocalScale(0.06, 0.25, 0.06);
      handle.setLocalPosition(0, -0.1, 0);
      entity.addChild(handle);

      const crossguard = new pc.Entity(`${id}-guard`);
      crossguard.addComponent('render', { type: 'box' });
      crossguard.render!.material = bladeMat;
      crossguard.setLocalScale(0.3, 0.04, 0.04);
      crossguard.setLocalPosition(0, 0.1, 0);
      entity.addChild(crossguard);
    } else if (templateId === 'gun') {
      const barrel = new pc.Entity(`${id}-barrel`);
      barrel.addComponent('render', { type: 'cylinder' });
      const barrelMat = new pc.StandardMaterial();
      barrelMat.diffuse = new pc.Color(0.3, 0.3, 0.32); barrelMat.metalness = 0.7; barrelMat.update();
      barrel.render!.material = barrelMat;
      barrel.setLocalScale(0.06, 0.5, 0.06);
      barrel.setLocalPosition(0, 0.35, 0);
      barrel.setLocalEulerAngles(0, 0, 90);
      entity.addChild(barrel);

      const body = new pc.Entity(`${id}-body`);
      body.addComponent('render', { type: 'box' });
      const bodyMat = new pc.StandardMaterial();
      bodyMat.diffuse = new pc.Color(0.2, 0.2, 0.22); bodyMat.metalness = 0.5; bodyMat.update();
      body.render!.material = bodyMat;
      body.setLocalScale(0.14, 0.08, 0.06);
      body.setLocalPosition(0, 0.1, 0);
      entity.addChild(body);

      const grip = new pc.Entity(`${id}-grip`);
      grip.addComponent('render', { type: 'box' });
      const gripMat = new pc.StandardMaterial();
      gripMat.diffuse = new pc.Color(0.3, 0.2, 0.1); gripMat.metalness = 0; gripMat.update();
      grip.render!.material = gripMat;
      grip.setLocalScale(0.06, 0.15, 0.06);
      grip.setLocalPosition(0, -0.15, 0);
      entity.addChild(grip);
    } else if (templateId === 'axe') {
      const head = new pc.Entity(`${id}-head`);
      head.addComponent('render', { type: 'box' });
      const headMat = new pc.StandardMaterial();
      headMat.diffuse = new pc.Color(0.55, 0.55, 0.6); headMat.metalness = 0.5; headMat.update();
      head.render!.material = headMat;
      head.setLocalScale(0.35, 0.3, 0.05);
      head.setLocalPosition(0, 0.5, 0);
      entity.addChild(head);

      const handle = new pc.Entity(`${id}-handle`);
      handle.addComponent('render', { type: 'cylinder' });
      const handleMat = new pc.StandardMaterial();
      handleMat.diffuse = new pc.Color(0.45, 0.3, 0.1); handleMat.metalness = 0; handleMat.update();
      handle.render!.material = handleMat;
      handle.setLocalScale(0.06, 0.6, 0.06);
      handle.setLocalPosition(0, 0.0, 0);
      entity.addChild(handle);
    } else if (templateId === 'staff') {
      const rod = new pc.Entity(`${id}-rod`);
      rod.addComponent('render', { type: 'cylinder' });
      const rodMat = new pc.StandardMaterial();
      rodMat.diffuse = new pc.Color(0.5, 0.35, 0.15); rodMat.metalness = 0; rodMat.update();
      rod.render!.material = rodMat;
      rod.setLocalScale(0.06, 1.2, 0.06);
      rod.setLocalPosition(0, 0.55, 0);
      entity.addChild(rod);

      const crystal = new pc.Entity(`${id}-crystal`);
      crystal.addComponent('render', { type: 'sphere' });
      const crystalMat = new pc.StandardMaterial();
      crystalMat.diffuse = new pc.Color(0.2, 0.5, 0.9); crystalMat.emissive = new pc.Color(0.1, 0.3, 0.7); crystalMat.metalness = 0; crystalMat.update();
      crystal.render!.material = crystalMat;
      crystal.setLocalScale(0.15, 0.15, 0.15);
      crystal.setLocalPosition(0, 1.2, 0);
      entity.addChild(crystal);
    } else {
      const blade = new pc.Entity(`${id}-blade`);
      blade.addComponent('render', { type: 'box' });
      const bladeMat = new pc.StandardMaterial();
      bladeMat.diffuse = new pc.Color(0.75, 0.75, 0.85); bladeMat.metalness = 0.5; bladeMat.update();
      blade.render!.material = bladeMat;
      blade.setLocalScale(0.06, 0.5, 0.02);
      blade.setLocalPosition(0, 0.35, 0);
      entity.addChild(blade);

      const handle = new pc.Entity(`${id}-handle`);
      handle.addComponent('render', { type: 'cylinder' });
      const handleMat = new pc.StandardMaterial();
      handleMat.diffuse = new pc.Color(0.35, 0.2, 0.08); handleMat.metalness = 0; handleMat.update();
      handle.render!.material = handleMat;
      handle.setLocalScale(0.05, 0.15, 0.05);
      handle.setLocalPosition(0, -0.05, 0);
      entity.addChild(handle);
    }

    const glowEntity = new pc.Entity(`${id}-glow`);
    glowEntity.addComponent('render', { type: 'sphere' });
    const glowMat = new pc.StandardMaterial();
    glowMat.diffuse = new pc.Color(0.95, 0.85, 0.4);
    glowMat.emissive = new pc.Color(0.3, 0.25, 0.05);
    glowMat.opacity = 0.25;
    glowMat.blendType = pc.BLEND_NORMAL;
    glowMat.update();
    glowEntity.render!.material = glowMat;
    glowEntity.setLocalScale(0.6, 0.6, 0.6);
    entity.addChild(glowEntity);

    entity.setLocalScale(0.7, 0.7, 0.7);
    const x = data.x || 0;
    const z = data.z || 0;
    entity.setLocalPosition(x, 0.3, z);
    entity.setLocalEulerAngles(0, 0, -25);
    this.app.root.addChild(entity);

    this.entities.set(id, {
      id, entity, glowEntity,
      templateId,
      lastPosition: new pc.Vec3(x, 0.3, z),
      targetPosition: new pc.Vec3(x, 0.3, z),
      lastRotation: 0, targetRotation: 0,
      lastUpdate: Date.now(),
      type: 'weapon',
    });
  }

  getWeaponPositions(): { id: string; templateId: string; x: number; z: number }[] {
    const result: { id: string; templateId: string; x: number; z: number }[] = [];
    for (const [id, tracked] of this.entities) {
      if (tracked.type === 'weapon') {
        const pos = tracked.entity.getLocalPosition();
        result.push({ id, templateId: tracked.templateId || '', x: pos.x, z: pos.z });
      }
    }
    return result;
  }

  private weaponTime: number = 0;

  update(dt: number): void {
    const now = Date.now();
    this.weaponTime += dt;
    for (const [, tracked] of this.entities) {
      const elapsed = now - tracked.lastUpdate;
      const t = Math.min(elapsed / INTERPOLATION_BUFFER_MS, 1);
      const currentPos = tracked.entity.getLocalPosition();
      currentPos.lerp(tracked.lastPosition, tracked.targetPosition, t);
      tracked.entity.setLocalPosition(currentPos);

      if (tracked.type === 'player') {
        const rot = tracked.lastRotation + (tracked.targetRotation - tracked.lastRotation) * t;
        tracked.entity.setLocalEulerAngles(0, rot, 0);
      } else if (tracked.type === 'weapon') {
        const angles = tracked.entity.getLocalEulerAngles();
        tracked.entity.setLocalEulerAngles(0, this.weaponTime * 30, -25);
        const pos = tracked.entity.getLocalPosition();
        pos.y = 0.3 + Math.sin(this.weaponTime * 2) * 0.08;
        tracked.entity.setLocalPosition(pos);
      }
    }
  }

  getEntity(id: string): pc.Entity | undefined {
    return this.entities.get(id)?.entity;
  }

  getEntityType(id: string): string | undefined {
    return this.entities.get(id)?.type;
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

  getAllEntityPositions(): { id: string; type: string; x: number; z: number }[] {
    const result: { id: string; type: string; x: number; z: number }[] = [];
    for (const [id, tracked] of this.entities) {
      const pos = tracked.entity.getLocalPosition();
      result.push({ id, type: tracked.type, x: pos.x, z: pos.z });
    }
    return result;
  }

  getMonsterPositions(): { id: string; x: number; z: number }[] {
    const result: { id: string; x: number; z: number }[] = [];
    for (const [id, tracked] of this.entities) {
      if (tracked.type === 'monster') {
        const pos = tracked.entity.getLocalPosition();
        result.push({ id, x: pos.x, z: pos.z });
      }
    }
    return result;
  }
}
