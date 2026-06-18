interface Buff {
  id: string;
  stat: string;
  amount: number;
  duration: number;
  remaining: number;
}

export class BuffSystem {
  private buffs: Map<string, Buff[]> = new Map();

  addBuff(characterId: string, buff: Buff): void {
    const existing = this.buffs.get(characterId) || [];
    const existingBuff = existing.find((b) => b.id === buff.id);
    if (existingBuff) {
      existingBuff.remaining = buff.duration;
      return;
    }
    existing.push(buff);
    this.buffs.set(characterId, existing);
  }

  removeBuff(characterId: string, buffId: string): void {
    const existing = this.buffs.get(characterId);
    if (!existing) return;
    const idx = existing.findIndex((b) => b.id === buffId);
    if (idx >= 0) existing.splice(idx, 1);
  }

  getBuffs(characterId: string): Buff[] {
    return this.buffs.get(characterId) || [];
  }

  getStatBonus(characterId: string, stat: string): number {
    return (this.buffs.get(characterId) || [])
      .filter((b) => b.stat === stat)
      .reduce((total, b) => total + b.amount, 0);
  }

  tick(dt: number): void {
    for (const [, buffList] of this.buffs) {
      for (let i = buffList.length - 1; i >= 0; i--) {
        buffList[i].remaining -= dt;
        if (buffList[i].remaining <= 0) {
          buffList.splice(i, 1);
        }
      }
    }
  }

  clearCharacter(characterId: string): void {
    this.buffs.delete(characterId);
  }
}
