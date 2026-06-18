import { randomRange, randomInt } from '../utils/Helpers.js';
import { config } from '../config.js';

export interface SpawnPoint {
  id: string;
  x: number;
  z: number;
  monsterTemplateId: string;
  respawnTime: number;
  currentMonsterId: string | null;
  timer: number;
}

export class SpawnSystem {
  spawnPoints: Map<string, SpawnPoint> = new Map();

  initialize(count: number = 50): void {
    const monsterTypes = ['rat', 'wolf', 'bear', 'goblin', 'orc', 'troll', 'dragon_whelp', 'skeleton', 'zombie', 'ghost'];
    for (let i = 0; i < count; i++) {
      const id = `spawn_${i}`;
      this.spawnPoints.set(id, {
        id,
        x: randomRange(config.worldBounds.minX + 10, config.worldBounds.maxX - 10),
        z: randomRange(config.worldBounds.minZ + 10, config.worldBounds.maxZ - 10),
        monsterTemplateId: monsterTypes[randomInt(0, monsterTypes.length - 1)]!,
        respawnTime: 10 + Math.random() * 20,
        currentMonsterId: null,
        timer: 0,
      });
    }
  }

  update(deltaTime: number, monsters: Map<string, any>, spawnMonster: (templateId: string, x: number, z: number) => string): void {
    for (const point of this.spawnPoints.values()) {
      if (!point.currentMonsterId || !monsters.has(point.currentMonsterId)) {
        point.currentMonsterId = null;
        point.timer -= deltaTime;
        if (point.timer <= 0) {
          const monsterId = spawnMonster(point.monsterTemplateId, point.x, point.z);
          point.currentMonsterId = monsterId;
          point.timer = point.respawnTime;
        }
      }
    }
  }
}
