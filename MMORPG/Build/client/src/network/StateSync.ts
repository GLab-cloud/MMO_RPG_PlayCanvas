import * as pc from 'playcanvas';

interface TrackedEntity {
  id: string;
  entity: pc.Entity;
  lastPosition: pc.Vec3;
  targetPosition: pc.Vec3;
  lastRotation: number;
  targetRotation: number;
  lastUpdate: number;
  type: 'player' | 'monster' | 'weapon' | 'loot';
  nameplate?: pc.Entity;
  hpBar?: pc.Entity;
  templateId?: string;
  glowEntity?: pc.Entity;
  _savedScale?: pc.Vec3;
  aiState?: string;
  aggroIndicator?: pc.Entity;
  attackPulseTimer?: number;
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
  onPlayerXPUpdate: ((id: string, xp: number, xpNext: number) => void) | null = null;
  onMonsterAdded: ((id: string, name: string) => void) | null = null;
  onMonsterRemoved: ((id: string) => void) | null = null;
  onMonsterHPUpdate: ((id: string, hp: number, maxHp: number) => void) | null = null;
  onMonsterStateChange: ((id: string, state: string) => void) | null = null;
  private deadPlayers: Set<string> = new Set();

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

  private updateAggroIndicator(tracked: TrackedEntity): void {
    const isAggro = tracked.aiState === 'chase' || tracked.aiState === 'attack';
    if (isAggro && !tracked.aggroIndicator) {
      tracked.aggroIndicator = new pc.Entity(`${tracked.id}-aggro`);
      tracked.aggroIndicator.addComponent('render', {
        type: 'cone',
        material: (() => {
          const m = new pc.StandardMaterial();
          m.diffuse = new pc.Color(1, 0.15, 0.15);
          m.emissive = new pc.Color(1, 0.1, 0.1);
          m.metalness = 0; m.update();
          return m;
        })(),
      });
      tracked.aggroIndicator.setLocalScale(0.4, 0.25, 0.4);
      tracked.aggroIndicator.setLocalPosition(0, 1.1, 0);
      tracked.entity.addChild(tracked.aggroIndicator);
    } else if (!isAggro && tracked.aggroIndicator) {
      tracked.aggroIndicator.destroy();
      tracked.aggroIndicator = undefined;
    }
    if (tracked.aiState === 'attack') {
      tracked.attackPulseTimer = 0.3;
    }
  }

  syncMonsterState(monsters: any[]): void {
    for (const m of monsters) {
      const tracked = this.entities.get(m.id);
      if (tracked && tracked.type === 'monster') {
        const newState = m.state ?? 'idle';
        if (newState !== tracked.aiState) {
          tracked.aiState = newState;
          this.updateAggroIndicator(tracked);
        }
        this.onMonsterHPUpdate?.(m.id, m.hp ?? 0, m.maxHp ?? 1);
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

    const x = data.x || 0;
    const z = data.z || 0;
    entity.setLocalPosition(x, 1.0, z);

    this.app.root.addChild(entity);

    this.entities.set(id, {
      id, entity,
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
    const templateId = data.templateId || 'rat';

    const colors: Record<string, pc.Color> = {
      rat: new pc.Color(0.6, 0.5, 0.4),
      wolf: new pc.Color(0.45, 0.45, 0.5),
      bear: new pc.Color(0.35, 0.25, 0.15),
      goblin: new pc.Color(0.3, 0.7, 0.3),
      orc: new pc.Color(0.25, 0.5, 0.2),
      troll: new pc.Color(0.4, 0.55, 0.3),
      dragon_whelp: new pc.Color(0.7, 0.2, 0.15),
      skeleton: new pc.Color(0.8, 0.8, 0.75),
      zombie: new pc.Color(0.35, 0.5, 0.3),
      ghost: new pc.Color(0.6, 0.6, 0.8),
    };
    const mainColor = colors[templateId] || new pc.Color(0.8, 0.2, 0.2);
    const bodyScale = templateId === 'rat' ? 0.35 : templateId === 'wolf' ? 0.7 : templateId === 'bear' ? 1.0 : templateId === 'troll' ? 1.1 : templateId === 'dragon_whelp' ? 0.9 : 0.5;

    const body = new pc.Entity(`${id}-body`);
    body.addComponent('render', { type: 'box' });
    const bodyMat = new pc.StandardMaterial();
    bodyMat.diffuse = mainColor; bodyMat.metalness = 0; bodyMat.update();
    body.render!.material = bodyMat;

    if (templateId === 'rat') {
      body.setLocalScale(0.4, 0.2, 0.25);
      body.setLocalPosition(0, 0.1, 0);
      entity.addChild(body);
      const tail = new pc.Entity(`${id}-tail`);
      tail.addComponent('render', { type: 'cylinder' });
      const tailMat = new pc.StandardMaterial();
      tailMat.diffuse = new pc.Color(0.5, 0.4, 0.3); tailMat.update();
      tail.render!.material = tailMat;
      tail.setLocalScale(0.02, 0.3, 0.02);
      tail.setLocalPosition(-0.2, 0.05, 0);
      tail.setLocalEulerAngles(0, 0, 30);
      entity.addChild(tail);
      const head = new pc.Entity(`${id}-head`);
      head.addComponent('render', { type: 'sphere' });
      const headMat = new pc.StandardMaterial();
      headMat.diffuse = new pc.Color(0.55, 0.45, 0.35); headMat.update();
      head.render!.material = headMat;
      head.setLocalScale(0.12, 0.12, 0.12);
      head.setLocalPosition(0.22, 0.2, 0);
      entity.addChild(head);
    } else if (templateId === 'wolf') {
      body.setLocalScale(0.6, 0.35, 0.25);
      body.setLocalPosition(0, 0.2, 0);
      entity.addChild(body);
      const head = new pc.Entity(`${id}-head`);
      head.addComponent('render', { type: 'sphere' });
      const headMat = new pc.StandardMaterial();
      headMat.diffuse = new pc.Color(0.4, 0.4, 0.45); headMat.update();
      head.render!.material = headMat;
      head.setLocalScale(0.2, 0.2, 0.2);
      head.setLocalPosition(0.35, 0.35, 0);
      entity.addChild(head);
      const leg1 = new pc.Entity(`${id}-leg1`);
      leg1.addComponent('render', { type: 'cylinder' });
      const legMat = new pc.StandardMaterial();
      legMat.diffuse = new pc.Color(0.4, 0.4, 0.45); legMat.update();
      leg1.render!.material = legMat;
      leg1.setLocalScale(0.05, 0.2, 0.05);
      leg1.setLocalPosition(0.2, 0.0, 0.15);
      entity.addChild(leg1);
      const leg2 = leg1.clone();
      leg2.setLocalPosition(0.2, 0.0, -0.15);
      entity.addChild(leg2);
      const leg3 = leg1.clone();
      leg3.setLocalPosition(-0.2, 0.0, 0.15);
      entity.addChild(leg3);
      const leg4 = leg1.clone();
      leg4.setLocalPosition(-0.2, 0.0, -0.15);
      entity.addChild(leg4);
    } else if (templateId === 'bear') {
      body.setLocalScale(0.8, 0.5, 0.5);
      body.setLocalPosition(0, 0.25, 0);
      entity.addChild(body);
      const head = new pc.Entity(`${id}-head`);
      head.addComponent('render', { type: 'sphere' });
      const headMat = new pc.StandardMaterial();
      headMat.diffuse = new pc.Color(0.3, 0.2, 0.1); headMat.update();
      head.render!.material = headMat;
      head.setLocalScale(0.3, 0.3, 0.3);
      head.setLocalPosition(0.5, 0.45, 0);
      entity.addChild(head);
    } else if (templateId === 'goblin') {
      body.setLocalScale(0.3, 0.5, 0.25);
      body.setLocalPosition(0, 0.25, 0);
      entity.addChild(body);
      const head = new pc.Entity(`${id}-head`);
      head.addComponent('render', { type: 'sphere' });
      const headMat = new pc.StandardMaterial();
      headMat.diffuse = new pc.Color(0.4, 0.7, 0.3); headMat.update();
      head.render!.material = headMat;
      head.setLocalScale(0.2, 0.2, 0.2);
      head.setLocalPosition(0, 0.55, 0);
      entity.addChild(head);
    } else if (templateId === 'dragon_whelp') {
      body.setLocalScale(0.6, 0.3, 0.6);
      body.setLocalPosition(0, 0.15, 0);
      entity.addChild(body);
      const head = new pc.Entity(`${id}-head`);
      head.addComponent('render', { type: 'cone' });
      const headMat = new pc.StandardMaterial();
      headMat.diffuse = new pc.Color(0.8, 0.25, 0.2); headMat.update();
      head.render!.material = headMat;
      head.setLocalScale(0.25, 0.3, 0.25);
      head.setLocalPosition(0.35, 0.3, 0);
      entity.addChild(head);
      const wing1 = new pc.Entity(`${id}-wing1`);
      wing1.addComponent('render', { type: 'box' });
      const wingMat = new pc.StandardMaterial();
      wingMat.diffuse = new pc.Color(0.6, 0.15, 0.1); wingMat.update();
      wing1.render!.material = wingMat;
      wing1.setLocalScale(0.3, 0.02, 0.15);
      wing1.setLocalPosition(0, 0.3, 0.4);
      wing1.setLocalEulerAngles(0, 0, 15);
      entity.addChild(wing1);
      const wing2 = wing1.clone();
      wing2.setLocalPosition(0, 0.3, -0.4);
      wing2.setLocalEulerAngles(0, 0, -15);
      entity.addChild(wing2);
    } else if (templateId === 'ghost') {
      body.setLocalScale(0.5, 0.6, 0.3);
      body.setLocalPosition(0, 0.3, 0);
      const ghostMat = new pc.StandardMaterial();
      ghostMat.diffuse = new pc.Color(0.6, 0.6, 0.8);
      ghostMat.opacity = 0.6;
      ghostMat.blendType = pc.BLEND_NORMAL;
      ghostMat.update();
      body.render!.material = ghostMat;
      entity.addChild(body);
    } else {
      body.setLocalScale(bodyScale, bodyScale, bodyScale);
      body.setLocalPosition(0, bodyScale * 0.5, 0);
      entity.addChild(body);
    }

    const x = data.x || 0;
    const z = data.z || 0;
    entity.setLocalPosition(x, 0.5, z);

    this.app.root.addChild(entity);

    this.entities.set(id, {
      id, entity,
      lastPosition: new pc.Vec3(x, 0.5, z),
      targetPosition: new pc.Vec3(x, 0.5, z),
      lastRotation: 0, targetRotation: 0,
      lastUpdate: Date.now(),
      type: 'monster',
    });
    this.onMonsterAdded?.(id, data.name || data.templateId || 'Monster');
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
      } else if (tracked.type === 'weapon' || tracked.type === 'loot') {
        this.pickupAnimation(tracked);
      } else {
        this.deathAnimation(tracked);
      }
      if (tracked.type === 'player') {
        this.onPlayerRemoved?.(id);
      } else if (tracked.type === 'monster') {
        this.onMonsterRemoved?.(id);
      }
    }
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
    const pos = tracked.entity.getLocalPosition().clone();
    const renders = tracked.entity.findComponents('render') as pc.RenderComponent[];
    for (const comp of renders) {
      if (comp && comp.material instanceof pc.StandardMaterial) {
        comp.material.diffuse = new pc.Color(1, 0.2, 0.2);
        comp.material.update();
      }
    }

    const flash = new pc.Entity(`${tracked.id}-deathflash`);
    flash.addComponent('render', { type: 'sphere' });
    const flashMat = new pc.StandardMaterial();
    flashMat.diffuse = new pc.Color(1, 0.9, 0.6);
    flashMat.emissive = new pc.Color(1, 0.7, 0.2);
    flashMat.opacity = 0.8;
    flashMat.blendType = pc.BLEND_NORMAL;
    flashMat.update();
    flash.render!.material = flashMat;
    flash.setLocalPosition(pos.x, pos.y, pos.z);
    flash.setLocalScale(startScale * 2, startScale * 2, startScale * 2);
    this.app.root.addChild(flash);

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;
      const t = elapsed / 400;
      if (t >= 1) {
        clearInterval(interval);
        flash.destroy();
        tracked.entity.destroy();
        this.entities.delete(tracked.id);
        return;
      }
      const s = startScale * (1 - t);
      tracked.entity.setLocalScale(s, s, s);
      const flashScale = startScale * 2 + t * startScale * 3;
      flash.setLocalScale(flashScale, flashScale, flashScale);
      const fadedMat = flash.render!.material as pc.StandardMaterial;
      fadedMat.opacity = 0.8 * (1 - t);
      fadedMat.update();
    }, 50);
  }

  private playerDied(id: string): void {
    if (this.deadPlayers.has(id)) return;
    this.deadPlayers.add(id);
    const tracked = this.entities.get(id);
    if (!tracked) return;
    const renders = tracked.entity.findComponents('render') as pc.RenderComponent[];
    for (const comp of renders) {
      if (comp && comp.material instanceof pc.StandardMaterial) {
        comp.material.diffuse = new pc.Color(1, 0.15, 0.15);
        comp.material.update();
      }
    }
    tracked._savedScale = tracked.entity.getLocalScale().clone();
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;
      const t = elapsed / 400;
      if (t >= 1) {
        clearInterval(interval);
        tracked.entity.enabled = false;
        return;
      }
      const s = 1 - t;
      tracked.entity.setLocalScale(s, s, s);
    }, 50);
  }

  private playerRevived(id: string): void {
    this.deadPlayers.delete(id);
    const tracked = this.entities.get(id);
    if (!tracked) return;
    tracked.entity.enabled = true;
    if (tracked._savedScale) {
      tracked.entity.setLocalScale(tracked._savedScale);
    }
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

    entity.setLocalScale(1.4, 1.4, 1.4);
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

  flashEntity(id: string): void {
    const tracked = this.entities.get(id);
    if (!tracked) return;
    const renders = tracked.entity.findComponents('render') as any[];
    for (const comp of renders) {
      if (comp && comp.material instanceof pc.StandardMaterial) {
        const orig = comp.material.diffuse.clone();
        comp.material.diffuse = new pc.Color(1, 1, 1);
        comp.material.update();
        setTimeout(() => {
          if (comp.material) {
            comp.material.diffuse = orig;
            comp.material.update();
          }
        }, 100);
      }
    }
  }

  getEntityPosition(id: string): { x: number; z: number } | null {
    const tracked = this.entities.get(id);
    if (!tracked) return null;
    const pos = tracked.entity.getLocalPosition();
    return { x: pos.x, z: pos.z };
  }

  getLootPositions(): { id: string; x: number; z: number }[] {
    const result: { id: string; x: number; z: number }[] = [];
    for (const [id, tracked] of this.entities) {
      if (tracked.type === 'loot') {
        const pos = tracked.entity.getLocalPosition();
        result.push({ id, x: pos.x, z: pos.z });
      }
    }
    return result;
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
      } else if (tracked.type === 'monster') {
        if (tracked.aiState === 'attack') {
          const pulse = 1 + Math.sin(now * 0.015) * 0.12;
          tracked.entity.setLocalScale(pulse, pulse, pulse);
        } else if (tracked.attackPulseTimer !== undefined) {
          tracked.attackPulseTimer = undefined;
          tracked.entity.setLocalScale(1, 1, 1);
        }
      } else if (tracked.type === 'weapon') {
        const angles = tracked.entity.getLocalEulerAngles();
        tracked.entity.setLocalEulerAngles(0, this.weaponTime * 30, -25);
        const pos = tracked.entity.getLocalPosition();
        pos.y = 0.3 + Math.sin(this.weaponTime * 2) * 0.08;
        tracked.entity.setLocalPosition(pos);
      }
    }
  }

  addLoot(id: string, data: { x: number; z: number; items: { name: string; type: string }[] }): void {
    if (this.entities.has(id)) return;
    const entity = new pc.Entity(`loot-${id}`);
    const primaryType = data.items?.[0]?.type || 'gold';
    const color = primaryType === 'health_potion' ? new pc.Color(0.2, 1, 0.3)
      : primaryType === 'mana_potion' ? new pc.Color(0.2, 0.5, 1)
      : primaryType === 'weapon' ? new pc.Color(1, 0.7, 0.2)
      : new pc.Color(1, 0.9, 0.3);

    const glow = new pc.Entity(`${id}-glow`);
    glow.addComponent('render', { type: 'sphere' });
    const mat = new pc.StandardMaterial();
    mat.diffuse = color;
    mat.emissive = new pc.Color(color.r * 0.4, color.g * 0.4, color.b * 0.4);
    mat.opacity = 0.5;
    mat.blendType = pc.BLEND_NORMAL;
    mat.update();
    glow.render!.material = mat;
    glow.setLocalScale(0.25, 0.25, 0.25);
    entity.addChild(glow);

    const icon = new pc.Entity(`${id}-icon`);
    icon.addComponent('render', { type: 'box' });
    const iconMat = new pc.StandardMaterial();
    iconMat.diffuse = color;
    iconMat.emissive = new pc.Color(color.r * 0.3, color.g * 0.3, color.b * 0.3);
    iconMat.update();
    icon.render!.material = iconMat;
    icon.setLocalScale(0.15, 0.15, 0.05);
    entity.addChild(icon);

    entity.setLocalPosition(data.x, 0.3, data.z);
    this.app.root.addChild(entity);
    this.entities.set(id, {
      id, entity,
      lastPosition: new pc.Vec3(data.x, 0.3, data.z),
      targetPosition: new pc.Vec3(data.x, 0.3, data.z),
      lastRotation: 0, targetRotation: 0,
      lastUpdate: Date.now(),
      type: 'loot',
    });
  }

  removeLoot(id: string): void {
    this.removeEntity(id, false);
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

  getAllMonsterPositions(): { id: string; x: number; y: number; z: number }[] {
    const result: { id: string; x: number; y: number; z: number }[] = [];
    for (const [id, tracked] of this.entities) {
      if (tracked.type === 'monster') {
        const pos = tracked.entity.getLocalPosition();
        result.push({ id, x: pos.x, y: pos.y + 0.8, z: pos.z });
      }
    }
    return result;
  }
}
