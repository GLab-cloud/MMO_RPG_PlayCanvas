interface Buff {
  id: string;
  name: string;
  duration: number;
  remaining: number;
  statBoosts: Partial<Record<string, number>>;
  icon: string;
  stackable: boolean;
}

export class BuffComponent {
  buffs: Buff[] = [];

  addBuff(buff: Buff): void {
    if (!buff.stackable) {
      const existing = this.buffs.find((b) => b.id === buff.id);
      if (existing) {
        existing.remaining = buff.duration;
        return;
      }
    }
    this.buffs.push({ ...buff });
  }

  removeBuff(id: string): void {
    const idx = this.buffs.findIndex((b) => b.id === id);
    if (idx >= 0) this.buffs.splice(idx, 1);
  }

  hasBuff(id: string): boolean {
    return this.buffs.some((b) => b.id === id);
  }

  getTotalStatBoost(stat: string): number {
    return this.buffs
      .filter((b) => b.statBoosts[stat])
      .reduce((total, b) => total + (b.statBoosts[stat] || 0), 0);
  }

  tick(dt: number): void {
    for (let i = this.buffs.length - 1; i >= 0; i--) {
      this.buffs[i].remaining -= dt;
      if (this.buffs[i].remaining <= 0) {
        this.buffs.splice(i, 1);
      }
    }
  }

  clear(): void {
    this.buffs = [];
  }
}
