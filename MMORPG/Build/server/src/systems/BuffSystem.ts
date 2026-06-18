export interface Buff {
  id: string;
  name: string;
  duration: number;
  remaining: number;
  statBoosts: Partial<{ strength: number; stamina: number; dexterity: number; intelligence: number; attack: number; defense: number; moveSpeed: number }>;
}

export class BuffSystem {
  buffs: Map<string, Buff[]> = new Map();

  addBuff(characterId: string, buff: Buff): void {
    const existing = this.buffs.get(characterId) || [];
    const index = existing.findIndex(b => b.id === buff.id);
    if (index >= 0) {
      existing[index] = { ...buff, remaining: buff.duration };
    } else {
      existing.push({ ...buff, remaining: buff.duration });
    }
    this.buffs.set(characterId, existing);
  }

  removeBuff(characterId: string, buffId: string): void {
    const existing = this.buffs.get(characterId);
    if (existing) {
      this.buffs.set(characterId, existing.filter(b => b.id !== buffId));
    }
  }

  tick(characterId: string, deltaTime: number): Buff[] {
    const existing = this.buffs.get(characterId);
    if (!existing) return [];
    const remaining: Buff[] = [];
    const expired: Buff[] = [];
    for (const buff of existing) {
      buff.remaining -= deltaTime;
      if (buff.remaining <= 0) {
        expired.push(buff);
      } else {
        remaining.push(buff);
      }
    }
    this.buffs.set(characterId, remaining);
    return expired;
  }

  getBuffs(characterId: string): Buff[] {
    return this.buffs.get(characterId) || [];
  }
}
