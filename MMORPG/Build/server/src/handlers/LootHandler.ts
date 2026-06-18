import { generateId } from '../utils/Helpers.js';

interface LootItem {
  id: string;
  name: string;
  quantity: number;
}

interface LootSpawn {
  id: string;
  x: number;
  z: number;
  items: LootItem[];
  despawnTimer: number;
}

export class LootHandler {
  private lootSpawns: Map<string, LootSpawn> = new Map();

  spawnLoot(x: number, z: number, items: { name: string; quantity: number }[]): LootSpawn {
    const spawn: LootSpawn = {
      id: generateId(),
      x,
      z,
      items: items.map(i => ({ id: generateId(), ...i })),
      despawnTimer: 30,
    };
    this.lootSpawns.set(spawn.id, spawn);
    return spawn;
  }

  handlePickup(playerId: string, lootId: string): { success: boolean; items?: LootItem[]; error?: string } {
    const spawn = this.lootSpawns.get(lootId);
    if (!spawn) return { success: false, error: 'Loot not found' };
    const items = [...spawn.items];
    this.lootSpawns.delete(lootId);
    return { success: true, items };
  }

  update(deltaTime: number): string[] {
    const despawned: string[] = [];
    for (const [id, spawn] of this.lootSpawns) {
      spawn.despawnTimer -= deltaTime;
      if (spawn.despawnTimer <= 0) {
        this.lootSpawns.delete(id);
        despawned.push(id);
      }
    }
    return despawned;
  }

  getLootSpawns(): Map<string, LootSpawn> {
    return this.lootSpawns;
  }
}
