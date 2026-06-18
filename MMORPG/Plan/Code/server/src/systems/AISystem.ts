import { WorldRoom } from '../rooms/WorldRoom.js';

interface AIState {
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'return';
  targetId: string | null;
  spawnX: number;
  spawnZ: number;
  patrolPoint: { x: number; z: number } | null;
  idleTimer: number;
  shootCooldown: number;
}

export class AISystem {
  private room: WorldRoom;
  private aiStates: Map<string, AIState> = new Map();

  constructor(room: WorldRoom) {
    this.room = room;
  }

  update(dt: number): void {
    const monsters = this.room.state.monsters;
    for (const [id, monster] of monsters) {
      let ai = this.aiStates.get(id);
      if (!ai) {
        ai = {
          state: 'idle',
          targetId: null,
          spawnX: monster.x,
          spawnZ: monster.z,
          patrolPoint: null,
          idleTimer: 3,
          shootCooldown: 0,
        };
        this.aiStates.set(id, ai);
      }

      ai.shootCooldown = Math.max(0, ai.shootCooldown - dt);
      ai.idleTimer = Math.max(0, ai.idleTimer - dt);

      this.updateBehavior(id, monster, ai, dt);
    }
  }

  private updateBehavior(
    id: string,
    monster: { x: number; y: number; z: number; hp: number; maxHp: number; aiState: string; targetId: string },
    ai: AIState,
    dt: number
  ): void {
    const nearestPlayer = this.findNearestPlayer(monster.x, monster.z);
    const distToSpawn = Math.sqrt(
      Math.pow(monster.x - ai.spawnX, 2) + Math.pow(monster.z - ai.spawnZ, 2)
    );

    if (distToSpawn > 30) {
      ai.state = 'return';
    }

    if (monster.hp <= 0) return;

    switch (ai.state) {
      case 'idle':
        if (ai.idleTimer <= 0) {
          ai.state = 'patrol';
          ai.patrolPoint = {
            x: ai.spawnX + (Math.random() - 0.5) * 10,
            z: ai.spawnZ + (Math.random() - 0.5) * 10,
          };
        }
        if (nearestPlayer) {
          const dist = this.distance(monster, nearestPlayer);
          if (dist < 10) {
            ai.state = 'chase';
            ai.targetId = nearestPlayer.id;
          }
        }
        break;

      case 'patrol':
        if (ai.patrolPoint) {
          this.moveToward(monster, ai.patrolPoint.x, ai.patrolPoint.z, dt);
          if (this.distanceTo(monster.x, monster.z, ai.patrolPoint.x, ai.patrolPoint.z) < 1) {
            ai.state = 'idle';
            ai.idleTimer = 2 + Math.random() * 3;
          }
        }
        if (nearestPlayer) {
          const dist = this.distance(monster, nearestPlayer);
          if (dist < 10) {
            ai.state = 'chase';
            ai.targetId = nearestPlayer.id;
          }
        }
        break;

      case 'chase':
        if (nearestPlayer) {
          const dist = this.distance(monster, nearestPlayer);
          if (dist < 3) {
            ai.state = 'attack';
            ai.targetId = nearestPlayer.id;
          } else if (dist > 15) {
            ai.state = 'return';
          } else {
            this.moveToward(monster, nearestPlayer.x, nearestPlayer.z, dt);
          }
        } else {
          ai.state = 'return';
        }
        break;

      case 'attack':
        if (ai.shootCooldown <= 0) {
          this.performAttack(id, monster, ai);
          ai.shootCooldown = 1 + Math.random() * 2;
        }
        if (nearestPlayer) {
          const dist = this.distance(monster, nearestPlayer);
          if (dist > 5) {
            ai.state = 'chase';
          }
        } else {
          ai.state = 'return';
        }
        break;

      case 'flee':
        if (nearestPlayer) {
          const awayX = monster.x + (monster.x - nearestPlayer.x) * 0.5;
          const awayZ = monster.z + (monster.z - nearestPlayer.z) * 0.5;
          this.moveToward(monster, awayX, awayZ, dt);
        }
        if (monster.hp > monster.maxHp * 0.5) {
          ai.state = 'idle';
        }
        break;

      case 'return':
        this.moveToward(monster, ai.spawnX, ai.spawnZ, dt);
        if (this.distanceTo(monster.x, monster.z, ai.spawnX, ai.spawnZ) < 1) {
          monster.hp = monster.maxHp;
          ai.state = 'idle';
          ai.idleTimer = 3;
        }
        break;
    }

    monster.aiState = ai.state;
    monster.targetId = ai.targetId || '';
  }

  private findNearestPlayer(
    mx: number,
    mz: number
  ): { id: string; x: number; z: number } | null {
    let nearest: { id: string; x: number; z: number } | null = null;
    let nearestDist = 20;

    const players = this.room.state.players;
    for (const [id, p] of players) {
      const dist = this.distanceTo(mx, mz, p.x, p.z);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { id, x: p.x, z: p.z };
      }
    }
    return nearest;
  }

  private moveToward(
    monster: { x: number; y: number; z: number },
    tx: number,
    tz: number,
    dt: number
  ): void {
    const dx = tx - monster.x;
    const dz = tz - monster.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.5) return;
    const speed = 3;
    monster.x += (dx / dist) * speed * dt;
    monster.z += (dz / dist) * speed * dt;
  }

  private performAttack(
    _id: string,
    monster: { x: number; y: number; z: number },
    ai: AIState
  ): void {
    this.room.broadcast('monster:attack', {
      monsterId: _id,
      targetId: ai.targetId,
      damage: 10,
    });
  }

  private distance(a: { x: number; z: number }, b: { x: number; z: number }): number {
    return this.distanceTo(a.x, a.z, b.x, b.z);
  }

  private distanceTo(x1: number, z1: number, x2: number, z2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
  }
}
