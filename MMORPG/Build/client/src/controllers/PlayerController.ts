import * as pc from 'playcanvas';
import { NetworkManager } from '../network/NetworkManager';
import { InputController } from './InputController';
import { CameraController } from './CameraController';
import { MovementComponent } from '../components/MovementComponent';
import { CombatComponent } from '../components/CombatComponent';
import { MountEntity } from '../entities/MountEntity';
import { StateSync } from '../network/StateSync';
import { config } from '../config';
import { collidesWithWorld } from '../physics/CollisionZones';

const COLLISION_RADIUS = 1.0;
const NPC_INTERACT_RANGE = 4.0;

const NPC_DIALOGS: Record<string, string[]> = {
  'Weapon Merchant': ['Welcome! Check out my fine weapons.', 'A sharp blade is a warrior\'s best friend.'],
  'Armor Merchant': ['Need protection? I have the best armor in town.', 'Defense is just as important as attack!'],
  'Magic Merchant': ['Harness the power of magic!', 'Spells can turn the tide of any battle.', 'Collect magic weapons like wands and orbs to unleash true power!'],
  'Storage Keeper': ['Store your items here safely.', 'Never know what you might find on your travels.'],
  'Quest Guide': ['Find and defeat monsters to gain XP, level up, and earn rewards!', 'Stay alive — HP matters. Use potions to heal!', 'Search for magic weapons — staves, wands, and orbs boost your magic attack!'],
  'Skill Master': ['Learn new abilities to become stronger.', 'Master your skills to defeat tougher foes.'],
  'Class Master': ['Choose your class wisely.', 'Each class has unique strengths.'],
  'Transport NPC': ['Travel to other towns from here.', 'The world is vast — explore every corner!'],
  'Banker': ['Keep your gold safe with me.', 'A wise adventurer saves for the future.'],
  'Guard NPC': ['Stay alert — monsters lurk nearby.', 'Don\'t wander too far alone!'],
};

export class PlayerController {
  private app: pc.Application;
  private network: NetworkManager;
  private input: InputController;
  private camera: CameraController;
  private player: pc.Entity;
  private movement: MovementComponent;
  private combat: CombatComponent;
  private mount: MountEntity;
  private flyingTime: number = 0;
  private moveSpeed: number = 6;
  private sprintMultiplier: number = 1.6;
  private stateSync: StateSync;
  private onPanelToggle: ((panel: string) => void) | null = null;
  private attackAnimTime: number = 0;
  private weaponType: string = 'fist';
  private isDead: boolean = false;
  private bodyParts: pc.Entity[] = [];
  private targetDirection: number = 0;
  private lastTargetPos: { x: number; z: number } | null = null;
  sceneName: string = 'Flarine';

  constructor(app: pc.Application, network: NetworkManager, input: InputController, camera: CameraController) {
    this.app = app;
    this.network = network;
    this.input = input;
    this.camera = camera;
    this.movement = new MovementComponent(this.moveSpeed);
    this.combat = new CombatComponent();
    this.stateSync = network.getStateSync();

    this.player = new pc.Entity('local-player');

    this.mount = new MountEntity(app, 'player-broom', 'broom');
    this.player.addChild(this.mount.entity);
    this.mount.entity.setLocalPosition(0, -0.6, 0);
    this.mount.show();

    const legs = this.createPart('cylinder', [0.15, 0.35, 0.65], [0.2, 0.2, 0.2], [0.7, 0.8, 0.7], [0, 0.4, 0]);
    this.player.addChild(legs);
    this.bodyParts.push(legs);

    const body = this.createPart('cylinder', [0.25, 0.55, 0.85], [0.3, 0.3, 0.3], [0.75, 0.6, 0.75], [0, 1.0, 0]);
    this.player.addChild(body);
    this.bodyParts.push(body);

    const belt = this.createPart('cylinder', [0.6, 0.5, 0.3], [0.3, 0.3, 0.3], [0.7, 0.08, 0.7], [0, 1.35, 0]);
    this.player.addChild(belt);
    this.bodyParts.push(belt);

    const head = this.createPart('sphere', [0.95, 0.8, 0.7], [0.05, 0.05, 0.05], [0.35, 0.35, 0.35], [0, 1.6, 0]);
    this.player.addChild(head);
    this.bodyParts.push(head);

    const hair = this.createPart('sphere', [0.15, 0.1, 0.05], [0.05, 0.05, 0.05], [0.3, 0.12, 0.3], [0, 1.85, 0]);
    this.player.addChild(hair);
    this.bodyParts.push(hair);

    app.root.addChild(this.player);
    camera.follow(this.player);
  }

  private createPart(type: string, diffuse: number[], specular: number[], scale: number[], pos: number[]): pc.Entity {
    const e = new pc.Entity();
    e.addComponent('render', { type, material: this.createMaterial(diffuse, specular) });
    e.setLocalScale(scale[0], scale[1], scale[2]);
    e.setLocalPosition(pos[0], pos[1], pos[2]);
    return e;
  }

  private createMaterial(diffuse: number[], specular: number[]): pc.Material {
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(diffuse[0], diffuse[1], diffuse[2]);
    mat.specular = new pc.Color(specular[0], specular[1], specular[2]);
    mat.metalness = 0;
    mat.update();
    return mat;
  }

  setPanelToggleCallback(cb: (panel: string) => void): void {
    this.onPanelToggle = cb;
  }

  private weaponEntity: pc.Entity | null = null;

  onCombatFeedback: ((text: string, color: string, duration: number) => void) | null = null;

  setWeaponType(type: string): void {
    this.weaponType = type;
    this.updateWeaponModel(type);
    this.equipVFX();
  }

  clearWeapon(): void {
    this.weaponType = '';
    if (this.weaponEntity) {
      this.weaponEntity.destroy();
      this.weaponEntity = null;
    }
  }

  private equipVFX(): void {
    const vfx = new pc.Entity('equip-vfx');
    vfx.addComponent('render', { type: 'sphere' });
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(0.3, 0.7, 1);
    mat.emissive = new pc.Color(0.2, 0.5, 0.8);
    mat.opacity = 0.6;
    mat.blendType = pc.BLEND_NORMAL;
    mat.update();
    vfx.render!.material = mat;
    vfx.setLocalScale(0.1, 0.1, 0.1);
    vfx.setLocalPosition(0, 1.8, 0.5);
    this.player.addChild(vfx);
    const start = Date.now();
    const expand = () => {
      const t = (Date.now() - start) / 500;
      if (t >= 1) { vfx.destroy(); return; }
      const s = 0.1 + t * 1.5;
      vfx.setLocalScale(s, s, s);
      mat.opacity = 0.6 * (1 - t);
      mat.update();
      requestAnimationFrame(expand);
    };
    expand();
  }

  private updateWeaponModel(templateId: string): void {
    if (this.weaponEntity) {
      this.weaponEntity.destroy();
      this.weaponEntity = null;
    }
    const wep = new pc.Entity('equipped-weapon');
    const s = 1.0;
    if (templateId === 'sword' || templateId === 'dagger') {
      const blade = new pc.Entity('w-blade');
      blade.addComponent('render', { type: 'box' });
      const bm = new pc.StandardMaterial();
      bm.diffuse = new pc.Color(0.8, 0.8, 0.9); bm.metalness = 0.6; bm.update();
      blade.render!.material = bm;
      blade.setLocalScale(0.08 * s, 1.0 * s, 0.02 * s);
      blade.setLocalPosition(0, 0.6 * s, 0);
      wep.addChild(blade);
      const handle = new pc.Entity('w-handle');
      handle.addComponent('render', { type: 'cylinder' });
      const hm = new pc.StandardMaterial();
      hm.diffuse = new pc.Color(0.4, 0.25, 0.1); hm.metalness = 0; hm.update();
      handle.render!.material = hm;
      handle.setLocalScale(0.06 * s, 0.25 * s, 0.06 * s);
      handle.setLocalPosition(0, -0.1 * s, 0);
      wep.addChild(handle);
    } else if (templateId === 'axe') {
      const head = new pc.Entity('w-head');
      head.addComponent('render', { type: 'box' });
      const hm = new pc.StandardMaterial();
      hm.diffuse = new pc.Color(0.55, 0.55, 0.6); hm.metalness = 0.5; hm.update();
      head.render!.material = hm;
      head.setLocalScale(0.35 * s, 0.3 * s, 0.05 * s);
      head.setLocalPosition(0, 0.5 * s, 0);
      wep.addChild(head);
      const handle = new pc.Entity('w-handle');
      handle.addComponent('render', { type: 'cylinder' });
      const hm2 = new pc.StandardMaterial();
      hm2.diffuse = new pc.Color(0.45, 0.3, 0.1); hm2.metalness = 0; hm2.update();
      handle.render!.material = hm2;
      handle.setLocalScale(0.06 * s, 0.6 * s, 0.06 * s);
      handle.setLocalPosition(0, 0, 0);
      wep.addChild(handle);
    } else if (templateId === 'staff' || templateId === 'magic_staff') {
      const rod = new pc.Entity('w-rod');
      rod.addComponent('render', { type: 'cylinder' });
      const rm = new pc.StandardMaterial();
      rm.diffuse = new pc.Color(0.5, 0.35, 0.15); rm.metalness = 0; rm.update();
      rod.render!.material = rm;
      rod.setLocalScale(0.06 * s, 1.2 * s, 0.06 * s);
      rod.setLocalPosition(0, 0.55 * s, 0);
      wep.addChild(rod);
      const crystal = new pc.Entity('w-crystal');
      crystal.addComponent('render', { type: 'sphere' });
      const cm = new pc.StandardMaterial();
      cm.diffuse = new pc.Color(0.2, 0.5, 0.9); cm.emissive = new pc.Color(0.1, 0.3, 0.7); cm.metalness = 0; cm.update();
      crystal.render!.material = cm;
      crystal.setLocalScale(0.15 * s, 0.15 * s, 0.15 * s);
      crystal.setLocalPosition(0, 1.2 * s, 0);
      wep.addChild(crystal);
    } else if (templateId === 'wand' || templateId === 'orb') {
      const orb = new pc.Entity('w-orb');
      orb.addComponent('render', { type: 'sphere' });
      const om = new pc.StandardMaterial();
      om.diffuse = new pc.Color(0.4, 0.6, 1); om.emissive = new pc.Color(0.2, 0.3, 0.8); om.metalness = 0; om.update();
      orb.render!.material = om;
      orb.setLocalScale(0.2 * s, 0.2 * s, 0.2 * s);
      orb.setLocalPosition(0, 0.6 * s, 0);
      wep.addChild(orb);
    } else if (templateId === 'tome') {
      const book = new pc.Entity('w-book');
      book.addComponent('render', { type: 'box' });
      const bm = new pc.StandardMaterial();
      bm.diffuse = new pc.Color(0.6, 0.2, 0.2); bm.metalness = 0; bm.update();
      book.render!.material = bm;
      book.setLocalScale(0.3 * s, 0.4 * s, 0.05 * s);
      book.setLocalPosition(0, 0.3 * s, 0);
      wep.addChild(book);
    } else if (templateId === 'crystal_sword') {
      const blade = new pc.Entity('w-blade');
      blade.addComponent('render', { type: 'box' });
      const bm = new pc.StandardMaterial();
      bm.diffuse = new pc.Color(0.6, 0.8, 1); bm.emissive = new pc.Color(0.2, 0.4, 0.8); bm.metalness = 0.3; bm.update();
      blade.render!.material = bm;
      blade.setLocalScale(0.08 * s, 1.0 * s, 0.02 * s);
      blade.setLocalPosition(0, 0.6 * s, 0);
      wep.addChild(blade);
    } else {
      return;
    }
    wep.setLocalPosition(0.4, 1.2, 0);
    wep.setLocalEulerAngles(0, 0, -30);
    this.player.addChild(wep);
    this.weaponEntity = wep;
  }

  getPlayer(): pc.Entity {
    return this.player;
  }

  getNearestTarget(attackRange: number): { id: string; type: string } | null {
    const pos = this.player.getLocalPosition();
    let nearest: { id: string; type: string } | null = null;
    let nearestDist = attackRange;

    const entities = this.stateSync.getAllEntityPositions();
    for (const e of entities) {
      if (e.type !== 'monster' && e.type !== 'player') continue;
      const dx = e.x - pos.x;
      const dz = e.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { id: e.id, type: e.type };
      }
    }
    return nearest;
  }

  doAttack(): void {
    if (this.isDead) return;
    if (!this.combat.canAttack()) return;
    if (this.weaponType === 'fist') {
      this.combat.attack();
      this.onCombatFeedback?.('Pick up a weapon first!', '#ff6666', 1200);
      return;
    }

    const target = this.getNearestTarget(this.combat.attackRange);
    if (target) {
      if (target.type === 'monster') {
        const pos = this.player.getLocalPosition();
        this.network.sendToWorld('player:action', { type: 'attack', targetId: target.id, x: pos.x, z: pos.z });
        const tpos = this.stateSync.getEntityPosition(target.id);
        if (tpos) this.lastTargetPos = { x: tpos.x, z: tpos.z };
      } else if (target.type === 'player') {
        const pos = this.player.getLocalPosition();
        this.network.sendPlayerAttack(target.id, pos.x, pos.z);
        const tpos = this.stateSync.getEntityPosition(target.id);
        if (tpos) this.lastTargetPos = { x: tpos.x, z: tpos.z };
      }
      const ppos = this.player.getLocalPosition();
      if (this.lastTargetPos) {
        this.targetDirection = Math.atan2(this.lastTargetPos.x - ppos.x, this.lastTargetPos.z - ppos.z);
      }
      this.combat.attack();
      switch (this.weaponType) {
        case 'sword':
        case 'axe':
        case 'dagger':
          this.attackAnimTime = 0.4;
          break;
        case 'gun':
          this.attackAnimTime = 0.35;
          break;
        case 'staff':
          this.attackAnimTime = 0.5;
          this.createGlowEffect();
          break;
        default:
          this.attackAnimTime = 0.3;
      }
    }
  }

  private deathInterval: ReturnType<typeof setInterval> | null = null;

  die(): void {
    this.isDead = true;
    const renders = this.player.findComponents('render') as pc.RenderComponent[];
    for (const comp of renders) {
      if (comp && comp.material instanceof pc.StandardMaterial) {
        comp.material.diffuse = new pc.Color(1, 0.15, 0.15);
        comp.material.update();
      }
    }
    let elapsed = 0;
    this.deathInterval = setInterval(() => {
      elapsed += 50;
      const t = elapsed / 400;
      if (t >= 1) {
        if (this.deathInterval) clearInterval(this.deathInterval);
        this.deathInterval = null;
        this.player.enabled = false;
        return;
      }
      const s = 1 - t;
      this.player.setLocalScale(s, s, s);
    }, 50);
  }

  respawn(): void {
    if (this.deathInterval) {
      clearInterval(this.deathInterval);
      this.deathInterval = null;
    }
    this.isDead = false;
    this.player.setLocalScale(1, 1, 1);
    this.player.setLocalEulerAngles(0, this.player.getLocalEulerAngles().y, 0);
    this.player.setLocalPosition(0, 2, 0);
    this.player.enabled = true;
    this.rebuildRenderMaterials();
  }

  private rebuildRenderMaterials(): void {
    const colors: [number, number, number][] = [
      [0.7, 0.8, 0.7],
      [0.75, 0.6, 0.75],
      [0.7, 0.08, 0.7],
      [0.95, 0.8, 0.7],
      [0.15, 0.1, 0.05],
    ];
    let idx = 0;
    for (const child of this.player.children) {
      if (idx >= colors.length) break;
      const ent = child as pc.Entity;
      if (ent.render && ent.render.material instanceof pc.StandardMaterial) {
        const mat = ent.render.material;
        mat.diffuse = new pc.Color(colors[idx][0], colors[idx][1], colors[idx][2]);
        mat.metalness = 0;
        mat.update();
        idx++;
      }
    }
  }

  private checkCollision(x: number, z: number): boolean {
    const entities = this.stateSync.getAllEntityPositions();
    for (const e of entities) {
      const dx = e.x - x;
      const dz = e.z - z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < COLLISION_RADIUS) return true;
    }
    if (collidesWithWorld(x, z, this.sceneName)) return true;
    return false;
  }

  private npcPositions: { name: string; x: number; z: number }[] = [
    { name: 'Weapon Merchant', x: 25, z: -6 },
    { name: 'Armor Merchant', x: -22, z: -8 },
    { name: 'Magic Merchant', x: 30, z: 12 },
    { name: 'Storage Keeper', x: -28, z: 14 },
    { name: 'Quest Guide', x: 5, z: 26 },
    { name: 'Skill Master', x: 18, z: -18 },
    { name: 'Class Master', x: -5, z: -25 },
    { name: 'Transport NPC', x: 35, z: -5 },
    { name: 'Banker', x: -30, z: -11 },
  ];

  getNearestNPC(): string | null {
    const pos = this.player.getLocalPosition();
    let nearest: string | null = null;
    let nearestDist = NPC_INTERACT_RANGE;
    for (const npc of this.npcPositions) {
      const dx = npc.x - pos.x;
      const dz = npc.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist && NPC_DIALOGS[npc.name]) {
        nearestDist = dist;
        nearest = npc.name;
      }
    }
    return nearest;
  }

  getNearestWeapon(): { id: string; templateId: string; x: number; z: number } | null {
    const pos = this.player.getLocalPosition();
    const weapons = this.stateSync.getWeaponPositions();
    let nearest: { id: string; templateId: string; x: number; z: number } | null = null;
    let nearestDist = 1.8;
    for (const w of weapons) {
      const dx = w.x - pos.x;
      const dz = w.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = w;
      }
    }
    return nearest;
  }

  private pickupNearestWeapon(): void {
    const weapon = this.getNearestWeapon();
    if (weapon) {
      this.network.sendToWorld('player:action', { type: 'pickup_weapon', targetId: weapon.id });
    }
  }

  pickupNearestLoot(): void {
    const pos = this.player.getLocalPosition();
    const loots = this.stateSync.getLootPositions();
    let nearest: { id: string; dist: number } | null = null;
    for (const loot of loots) {
      const dx = loot.x - pos.x;
      const dz = loot.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2.5 && (!nearest || dist < nearest.dist)) {
        nearest = { id: loot.id, dist };
      }
    }
    if (nearest) {
      this.network.sendToWorld('inventory:pickup', { lootId: nearest.id, slot: 0 });
    }
  }

  getNearestLoot(): { id: string; dist: number } | null {
    const pos = this.player.getLocalPosition();
    const loots = this.stateSync.getLootPositions();
    let nearest: { id: string; dist: number } | null = null;
    for (const loot of loots) {
      const dx = loot.x - pos.x;
      const dz = loot.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2.5 && (!nearest || dist < nearest.dist)) {
        nearest = { id: loot.id, dist };
      }
    }
    return nearest;
  }

  private createGlowEffect(): void {
    const glow = new pc.Entity('attack-glow');
    glow.addComponent('render', { type: 'sphere' });
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(0.5, 0.2, 0.8);
    mat.emissive = new pc.Color(0.4, 0.1, 0.7);
    mat.opacity = 0.6;
    mat.blendType = pc.BLEND_NORMAL;
    mat.metalness = 0;
    mat.update();
    glow.render!.material = mat;
    glow.setLocalScale(0.8, 0.8, 0.8);
    glow.setLocalPosition(0, 0.8, 0.5);
    this.player.addChild(glow);
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;
      const t = elapsed / 500;
      if (t >= 1) {
        clearInterval(interval);
        glow.destroy();
        return;
      }
      const s = 0.8 * (1 + t);
      glow.setLocalScale(s, s, s);
      const fadeMat = glow.render!.material as pc.StandardMaterial;
      fadeMat.opacity = 0.6 * (1 - t);
      fadeMat.update();
    }, 50);
  }

  update(dt: number): void {
    if (this.isDead) {
      this.mount.update(dt);
      this.combat.tick(dt);
      return;
    }

    this.flyingTime += dt;
    const pos = this.player.getLocalPosition();
    pos.y = 2 + Math.sin(this.flyingTime * 1.5) * 0.15;

    const forward = this.camera.getForward();
    const right = this.camera.getRight();
    let moveX = 0, moveZ = 0;

    if (this.input.forward) { moveX += forward.x; moveZ += forward.z; }
    if (this.input.backward) { moveX -= forward.x; moveZ -= forward.z; }
    if (this.input.left) { moveX -= right.x; moveZ -= right.z; }
    if (this.input.right) { moveX += right.x; moveZ += right.z; }

    if (moveX !== 0 || moveZ !== 0) {
      const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= len; moveZ /= len;
      const speed = this.input.sprint ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed;
      const newX = pos.x + moveX * speed * dt;
      const newZ = pos.z + moveZ * speed * dt;
      if (!this.checkCollision(newX, newZ)) {
        pos.x = newX;
        pos.z = newZ;
      } else {
        let slidX = pos.x + moveX * speed * dt;
        let slidZ = pos.z;
        if (!this.checkCollision(slidX, slidZ)) {
          pos.x = slidX;
        }
        slidX = pos.x;
        slidZ = pos.z + moveZ * speed * dt;
        if (!this.checkCollision(slidX, slidZ)) {
          pos.z = slidZ;
        }
      }
      this.player.setLocalPosition(pos);
      const targetAngle = Math.atan2(moveX, moveZ) * 180 / Math.PI;
      this.player.setLocalEulerAngles(0, targetAngle, 0);
      this.network.sendToWorld('player:move', { x: pos.x, z: pos.z, rotation: targetAngle });
    }

    if (this.input.inventory) { this.input.keys.delete('KeyI'); this.onPanelToggle?.('inventory'); }
    if (this.input.character) { this.input.keys.delete('KeyC'); this.onPanelToggle?.('character'); }
    if (this.input.skills) { this.input.keys.delete('KeyK'); this.onPanelToggle?.('skills'); }
    if (this.input.quests) { this.input.keys.delete('KeyL'); this.onPanelToggle?.('quests'); }
    if (this.input.party) { this.input.keys.delete('KeyP'); this.onPanelToggle?.('leaderboard'); }
    if (this.input.mount) { this.input.keys.delete('KeyR'); this.network.sendToWorld('mount:mount', { mountId: 'broom' }); }
    if (this.input.jump) { this.input.keys.delete('Space'); pos.y = 3.5; }
    if (this.input.interact) {
      this.input.keys.delete(config.controls.interact);
      this.pickupNearestWeapon();
    }
    if (this.input.loot) {
      this.input.keys.delete(config.controls.loot);
      this.pickupNearestLoot();
    }

    this.player.setLocalPosition(pos);
    this.mount.update(dt);
    this.combat.tick(dt);

    if (this.attackAnimTime > 0) {
      this.attackAnimTime -= dt;
      const t = this.attackAnimTime;
      let scale = 1;
      let rotationOffset = 0;
      switch (this.weaponType) {
        case 'sword':
        case 'axe':
        case 'dagger':
          scale = 1 + Math.sin(t * 25) * 0.15;
          break;
        case 'gun':
          scale = 1 + Math.sin(t * 30) * 0.06;
          rotationOffset = Math.sin(t * 20) * 15;
          break;
        case 'staff':
          scale = 1 + Math.sin(t * 20) * 0.12;
          break;
        default:
          scale = 1 + Math.sin(t * 30) * 0.08;
      }
      for (let i = 1; i < this.bodyParts.length; i++) {
        this.bodyParts[i].setLocalScale(
          0.75 * scale, 0.6 * scale, 0.75 * scale
        );
      }
      if (this.weaponEntity) {
        const swing = Math.sin(t * 20);
        const playerAngle = this.player.getLocalEulerAngles().y * Math.PI / 180;
        const yawDiff = this.targetDirection - playerAngle;
        const wepYaw = yawDiff * 180 / Math.PI * swing;
        const wepPitch = swing * 50;
        this.weaponEntity.setLocalEulerAngles(wepPitch, wepYaw, -30 + swing * 20);
        this.weaponEntity.setLocalPosition(0.5, 1.2, 0.2);
      }
      if (rotationOffset !== 0) {
        this.player.setLocalEulerAngles(0, this.player.getLocalEulerAngles().y + rotationOffset, 0);
      }
    } else {
      if (this.weaponEntity) {
        this.weaponEntity.setLocalPosition(0.4, 1.2, 0);
        this.weaponEntity.setLocalEulerAngles(0, 0, -30);
      }
    }

    if (this.input.wasAttackClicked()) {
      this.doAttack();
    }

    for (let i = 0; i < 10; i++) {
      if (this.input.isSkillSlot(i)) {
        this.input.keys.delete(config.controls.skillBar[i]);
        this.doAttack();
        break;
      }
    }
  }
}

export { NPC_DIALOGS, NPC_INTERACT_RANGE };
