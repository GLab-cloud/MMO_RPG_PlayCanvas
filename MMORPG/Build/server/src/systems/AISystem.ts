import { distance } from '../utils/Helpers.js';

export enum MonsterState {
  Idle = 'idle',
  Patrol = 'patrol',
  Chase = 'chase',
  Attack = 'attack',
  Flee = 'flee',
  Return = 'return',
}

interface AIMonster {
  id: string; x: number; z: number; level: number;
  hp: number; maxHp: number;
  aggroRange: number; attackRange: number; moveSpeed: number;
  state: MonsterState; targetId: string | null;
  fleeThreshold: number;
  patrolPoint: { x: number; z: number };
}

export class AISystem {
  update(monsters: Map<string, AIMonster>, players: Map<string, { id: string; x: number; z: number; level: number; equippedWeapon: string; hp: number }>, deltaTime: number): void {
    const activePerPlayer = new Map<string, number>();
    for (const [, monster] of monsters) {
      if (monster.hp <= 0) continue;
      if ((monster.state === MonsterState.Chase || monster.state === MonsterState.Attack) && monster.targetId) {
        activePerPlayer.set(monster.targetId, (activePerPlayer.get(monster.targetId) || 0) + 1);
      }
    }

    for (const [monsterId, monster] of monsters) {
      if (monster.hp <= 0) continue;

      switch (monster.state) {
        case MonsterState.Idle:
          this.handleIdle(monster, players, activePerPlayer);
          break;
        case MonsterState.Chase:
          this.handleChase(monster, players, deltaTime);
          break;
        case MonsterState.Attack:
          this.handleAttack(monster, players, deltaTime);
          break;
        case MonsterState.Flee:
          this.handleFlee(monster, players, deltaTime);
          break;
        case MonsterState.Return:
          this.handleReturn(monster, deltaTime);
          break;
        case MonsterState.Patrol:
          this.handlePatrol(monster, deltaTime);
          break;
      }
    }
  }

  private findNearestPlayer(
    monster: { x: number; z: number; aggroRange: number },
    players: Map<string, { id: string; x: number; z: number; level: number; equippedWeapon: string; hp: number }>
  ): { id: string; dist: number } | null {
    let nearest: { id: string; dist: number } | null = null;
    for (const [id, player] of players) {
      if (!player.equippedWeapon) continue;
      if (player.hp <= 0) continue;
      const dist = distance(monster.x, monster.z, player.x, player.z);
      if (dist <= monster.aggroRange && (!nearest || dist < nearest.dist)) {
        nearest = { id, dist };
      }
    }
    return nearest;
  }

  private handleIdle(
    monster: { state: MonsterState; targetId: string | null; aggroRange: number; x: number; z: number; hp: number; maxHp: number; fleeThreshold: number },
    players: Map<string, { id: string; x: number; z: number; level: number; equippedWeapon: string; hp: number }>,
    activePerPlayer: Map<string, number>
  ): void {
    if (this.shouldFlee(monster)) return;
    const nearest = this.findNearestPlayer(monster, players);
    if (!nearest) return;
    if ((activePerPlayer.get(nearest.id) || 0) >= 1) return;
    activePerPlayer.set(nearest.id, (activePerPlayer.get(nearest.id) || 0) + 1);
    monster.state = MonsterState.Chase;
    monster.targetId = nearest.id;
    console.log(`IDLE→CHASE monster at (${monster.x.toFixed(2)},${monster.z.toFixed(2)}) targets player=${nearest.id} dist=${nearest.dist.toFixed(2)}`);
  }

  private shouldFlee(monster: { hp: number; maxHp: number; fleeThreshold: number }): boolean {
    return monster.fleeThreshold > 0 && monster.maxHp > 0 && monster.hp / monster.maxHp < monster.fleeThreshold;
  }

  private handleChase(
    monster: { state: MonsterState; targetId: string | null; x: number; z: number; moveSpeed: number; attackRange: number; hp: number; maxHp: number; fleeThreshold: number },
    players: Map<string, { id: string; x: number; z: number; level: number; equippedWeapon: string; hp: number }>,
    dt: number
  ): void {
    if (!monster.targetId) {
      monster.state = MonsterState.Idle;
      return;
    }
    if (this.shouldFlee(monster)) { monster.state = MonsterState.Flee; return; }
    const player = players.get(monster.targetId);
    if (!player || player.hp <= 0) {
      monster.state = MonsterState.Return;
      monster.targetId = null;
      return;
    }
    const dx = player.x - monster.x;
    const dz = player.z - monster.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const stepPerTick = monster.moveSpeed * dt;
    if (dist > stepPerTick) {
      monster.x += (dx / dist) * stepPerTick;
      monster.z += (dz / dist) * stepPerTick;
    }
    if (dist <= monster.attackRange) {
      monster.state = MonsterState.Attack;
    }
  }

  private handleAttack(
    monster: { state: MonsterState; targetId: string | null; x: number; z: number; attackRange: number; hp: number; maxHp: number; fleeThreshold: number },
    players: Map<string, { id: string; x: number; z: number; level: number; equippedWeapon: string; hp: number }>,
    dt: number
  ): void {
    if (!monster.targetId) { monster.state = MonsterState.Idle; return; }
    if (this.shouldFlee(monster)) { monster.state = MonsterState.Flee; return; }
    const player = players.get(monster.targetId);
    if (!player || player.hp <= 0) { monster.state = MonsterState.Return; monster.targetId = null; return; }
    const dist = distance(monster.x, monster.z, player.x, player.z);
    if (dist > monster.attackRange) {
      monster.state = MonsterState.Chase;
    }
  }

  private handleFlee(
    monster: { state: MonsterState; x: number; z: number; moveSpeed: number; hp: number; maxHp: number; fleeThreshold: number },
    players: Map<string, { id: string; x: number; z: number; level: number; equippedWeapon: string; hp: number }>,
    dt: number
  ): void {
    if (!this.shouldFlee(monster)) { monster.state = MonsterState.Return; return; }
    const nearest = this.findNearestPlayer(monster as any, players);
    if (!nearest) { monster.state = MonsterState.Return; return; }
    const player = players.get(nearest.id);
    if (!player) { monster.state = MonsterState.Return; return; }
    const dist = distance(monster.x, monster.z, player.x, player.z);
    if (dist > 30) { monster.state = MonsterState.Return; return; }
    const dx = monster.x - player.x;
    const dz = monster.z - player.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
      const step = monster.moveSpeed * dt * 1.5;
      monster.x += (dx / len) * step;
      monster.z += (dz / len) * step;
    }
  }

  private handleReturn(monster: { state: MonsterState; x: number; z: number; moveSpeed: number; patrolPoint: { x: number; z: number } }, dt: number): void {
    const dist = distance(monster.x, monster.z, monster.patrolPoint.x, monster.patrolPoint.z);
    if (dist < 1) {
      monster.state = MonsterState.Idle;
      return;
    }
    const dx = monster.patrolPoint.x - monster.x;
    const dz = monster.patrolPoint.z - monster.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    const step = monster.moveSpeed * dt;
    monster.x += (dx / len) * step;
    monster.z += (dz / len) * step;
  }

  private handlePatrol(monster: { state: MonsterState; x: number; z: number; moveSpeed: number; patrolPoint: { x: number; z: number } }, dt: number): void {
    const dist = distance(monster.x, monster.z, monster.patrolPoint.x, monster.patrolPoint.z);
    if (dist < 1) {
      monster.patrolPoint = {
        x: monster.patrolPoint.x + (Math.random() - 0.5) * 10,
        z: monster.patrolPoint.z + (Math.random() - 0.5) * 10,
      };
    }
    const dx = monster.patrolPoint.x - monster.x;
    const dz = monster.patrolPoint.z - monster.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
      const step = monster.moveSpeed * dt * 0.5;
      monster.x += (dx / len) * step;
      monster.z += (dz / len) * step;
    }
  }
}
