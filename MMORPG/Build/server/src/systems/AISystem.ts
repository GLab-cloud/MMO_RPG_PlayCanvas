import { distance } from '../utils/Helpers.js';

export enum MonsterState {
  Idle = 'idle',
  Patrol = 'patrol',
  Chase = 'chase',
  Attack = 'attack',
  Flee = 'flee',
  Return = 'return',
}

export class AISystem {
  update(monsters: Map<string, { id: string; x: number; z: number; level: number; hp: number; maxHp: number; aggroRange: number; attackRange: number; moveSpeed: number; state: MonsterState; targetId: string | null; patrolPoint: { x: number; z: number } }>, players: Map<string, { id: string; x: number; z: number; level: number }>, _deltaTime: number): void {
    for (const [monsterId, monster] of monsters) {
      if (monster.hp <= 0) continue;

      switch (monster.state) {
        case MonsterState.Idle:
          this.handleIdle(monster, players);
          break;
        case MonsterState.Chase:
          this.handleChase(monster, players);
          break;
        case MonsterState.Attack:
          this.handleAttack(monster);
          break;
        case MonsterState.Flee:
          this.handleFlee(monster, players);
          break;
        case MonsterState.Return:
          this.handleReturn(monster);
          break;
        case MonsterState.Patrol:
          this.handlePatrol(monster);
          break;
      }
    }
  }

  private findNearestPlayer(
    monster: { x: number; z: number; aggroRange: number },
    players: Map<string, { id: string; x: number; z: number; level: number }>
  ): { id: string; dist: number } | null {
    let nearest: { id: string; dist: number } | null = null;
    for (const [id, player] of players) {
      const dist = distance(monster.x, monster.z, player.x, player.z);
      if (dist <= monster.aggroRange && (!nearest || dist < nearest.dist)) {
        nearest = { id, dist };
      }
    }
    return nearest;
  }

  private handleIdle(
    monster: { state: MonsterState; targetId: string | null; aggroRange: number; x: number; z: number },
    players: Map<string, { id: string; x: number; z: number; level: number }>
  ): void {
    const nearest = this.findNearestPlayer(monster, players);
    if (nearest) {
      monster.state = MonsterState.Chase;
      monster.targetId = nearest.id;
    }
  }

  private handleChase(
    monster: { state: MonsterState; targetId: string | null; x: number; z: number; moveSpeed: number; attackRange: number },
    players: Map<string, { id: string; x: number; z: number; level: number }>
  ): void {
    if (!monster.targetId) {
      monster.state = MonsterState.Idle;
      return;
    }
    const player = players.get(monster.targetId);
    if (!player) {
      monster.state = MonsterState.Return;
      monster.targetId = null;
      return;
    }
    const dist = distance(monster.x, monster.z, player.x, player.z);
    if (dist <= monster.attackRange) {
      monster.state = MonsterState.Attack;
    } else {
      const dx = player.x - monster.x;
      const dz = player.z - monster.z;
      const len = Math.sqrt(dx * dx + dz * dz);
      monster.x += (dx / len) * monster.moveSpeed;
      monster.z += (dz / len) * monster.moveSpeed;
    }
  }

  private handleAttack(_monster: { state: MonsterState }): void {
  }

  private handleFlee(
    monster: { state: MonsterState; x: number; z: number; moveSpeed: number },
    players: Map<string, { id: string; x: number; z: number; level: number }>
  ): void {
    const nearest = this.findNearestPlayer(monster as any, players);
    if (!nearest) {
      monster.state = MonsterState.Idle;
      return;
    }
    const player = players.get(nearest.id);
    if (!player) {
      monster.state = MonsterState.Idle;
      return;
    }
    const dx = monster.x - player.x;
    const dz = monster.z - player.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
      monster.x += (dx / len) * monster.moveSpeed;
      monster.z += (dz / len) * monster.moveSpeed;
    }
  }

  private handleReturn(monster: { state: MonsterState; x: number; z: number; moveSpeed: number; patrolPoint: { x: number; z: number } }): void {
    const dist = distance(monster.x, monster.z, monster.patrolPoint.x, monster.patrolPoint.z);
    if (dist < 1) {
      monster.state = MonsterState.Idle;
      return;
    }
    const dx = monster.patrolPoint.x - monster.x;
    const dz = monster.patrolPoint.z - monster.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    monster.x += (dx / len) * monster.moveSpeed;
    monster.z += (dz / len) * monster.moveSpeed;
  }

  private handlePatrol(monster: { state: MonsterState; x: number; z: number; moveSpeed: number; patrolPoint: { x: number; z: number } }): void {
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
      monster.x += (dx / len) * monster.moveSpeed * 0.5;
      monster.z += (dz / len) * monster.moveSpeed * 0.5;
    }
  }
}
