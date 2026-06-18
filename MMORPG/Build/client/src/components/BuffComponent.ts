interface Buff {
  id: string;
  name: string;
  duration: number;
  remaining: number;
  statBoosts: { stat: string; value: number }[];
}

export class BuffComponent {
  buffs: Buff[] = [];

  addBuff(buff: Buff): void {
    const existing = this.buffs.find(b => b.id === buff.id);
    if (existing) {
      existing.remaining = buff.duration;
    } else {
      this.buffs.push({ ...buff, remaining: buff.duration });
    }
  }

  removeBuff(id: string): void {
    this.buffs = this.buffs.filter(b => b.id !== id);
  }

  hasBuff(id: string): boolean {
    return this.buffs.some(b => b.id === id);
  }

  getTotalStatBoost(stat: string): number {
    return this.buffs
      .filter(b => b.statBoosts.some(s => s.stat === stat))
      .reduce((sum, b) => {
        const boost = b.statBoosts.find(s => s.stat === stat);
        return sum + (boost ? boost.value : 0);
      }, 0);
  }

  tick(dt: number): void {
    for (let i = this.buffs.length - 1; i >= 0; i--) {
      this.buffs[i].remaining -= dt;
      if (this.buffs[i].remaining <= 0) {
        this.buffs.splice(i, 1);
      }
    }
  }
}
