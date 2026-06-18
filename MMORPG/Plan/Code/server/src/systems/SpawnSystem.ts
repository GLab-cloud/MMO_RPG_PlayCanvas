import { WorldRoom } from '../rooms/WorldRoom.js';
import { Logger } from '../utils/Logger.js';

interface SpawnPoint {
  templateId: number;
  x: number;
  z: number;
  respawnTime: number;
  currentTimer: number;
}

export class SpawnSystem {
  private room: WorldRoom;
  private spawnPoints: SpawnPoint[] = [];
  private initialized = false;

  constructor(room: WorldRoom) {
    this.room = room;
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.spawnPoints = [];
    for (let i = 0; i < 50; i++) {
      this.spawnPoints.push({
        templateId: 1001 + Math.floor(Math.random() * 5),
        x: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100,
        respawnTime: 10 + Math.random() * 20,
        currentTimer: 0,
      });
    }

    this.spawnPoints.forEach((sp) => this.spawnMonster(sp));
    Logger.info(`SpawnSystem initialized with ${this.spawnPoints.length} spawn points`);
  }

  update(dt: number): void {
    if (!this.initialized) this.initialize();

    for (const sp of this.spawnPoints) {
      const id = this.getMonsterId(sp);
      if (!this.room.state.monsters.has(id)) {
        sp.currentTimer -= dt;
        if (sp.currentTimer <= 0) {
          this.spawnMonster(sp);
        }
      }
    }
  }

  private spawnMonster(sp: SpawnPoint): void {
    const id = this.getMonsterId(sp);
    const monster = new (class {
      id = id;
      templateId = sp.templateId;
      x = sp.x + (Math.random() - 0.5) * 3;
      y = 0;
      z = sp.z + (Math.random() - 0.5) * 3;
      rotation = Math.random() * 360;
      hp = 50 + sp.templateId * 10;
      maxHp = this.hp;
      aiState = 'idle';
      targetId = '';
    })();

    this.room.state.monsters.set(id, monster as never);
  }

  private getMonsterId(sp: SpawnPoint): string {
    return `monster_${sp.x.toFixed(0)}_${sp.z.toFixed(0)}`;
  }
}
