import { describe, it, expect, beforeEach } from 'vitest';

interface BuffData {
  id: string;
  name: string;
  statBoosts: Record<string, number>;
  duration: number;
  remaining: number;
  stackable: boolean;
}

class BuffComponent {
  buffs: Map<string, BuffData> = new Map();

  addBuff(buff: BuffData): void {
    const existing = this.buffs.get(buff.id);
    if (existing) {
      if (!buff.stackable) {
        existing.remaining = buff.duration;
        return;
      }
    }
    this.buffs.set(buff.id, { ...buff });
  }

  tick(dt: number): void {
    for (const [id, buff] of this.buffs.entries()) {
      buff.remaining -= dt;
      if (buff.remaining <= 0) {
        this.buffs.delete(id);
      }
    }
  }

  getTotalStatBoost(stat: string): number {
    let total = 0;
    for (const buff of this.buffs.values()) {
      total += buff.statBoosts[stat] || 0;
    }
    return total;
  }

  clear(): void {
    this.buffs.clear();
  }

  hasBuff(id: string): boolean {
    return this.buffs.has(id);
  }
}

describe('BuffComponent', () => {
  let bc: BuffComponent;

  beforeEach(() => {
    bc = new BuffComponent();
  });

  it('can add buff', () => {
    const buff: BuffData = {
      id: 'atk_up',
      name: 'Attack Up',
      statBoosts: { str: 10 },
      duration: 30,
      remaining: 30,
      stackable: false,
    };
    bc.addBuff(buff);
    expect(bc.hasBuff('atk_up')).toBe(true);
  });

  it('duplicate non-stackable buff refreshes duration', () => {
    const buff: BuffData = {
      id: 'atk_up',
      name: 'Attack Up',
      statBoosts: { str: 10 },
      duration: 30,
      remaining: 30,
      stackable: false,
    };
    bc.addBuff(buff);
    bc.tick(10);
    expect(bc.buffs.get('atk_up')!.remaining).toBeCloseTo(20);
    bc.addBuff(buff);
    expect(bc.buffs.get('atk_up')!.remaining).toBe(30);
  });

  it('ttl tick decreases remaining time', () => {
    const buff: BuffData = {
      id: 'speed',
      name: 'Speed Boost',
      statBoosts: { dex: 5 },
      duration: 10,
      remaining: 10,
      stackable: false,
    };
    bc.addBuff(buff);
    bc.tick(3);
    expect(bc.buffs.get('speed')!.remaining).toBeCloseTo(7);
  });

  it('buff expires and is removed', () => {
    const buff: BuffData = {
      id: 'short',
      name: 'Short Buff',
      statBoosts: { str: 1 },
      duration: 1,
      remaining: 1,
      stackable: false,
    };
    bc.addBuff(buff);
    expect(bc.hasBuff('short')).toBe(true);
    bc.tick(2);
    expect(bc.hasBuff('short')).toBe(false);
  });

  it('getTotalStatBoost sums correctly', () => {
    bc.addBuff({
      id: 'b1', name: 'B1', statBoosts: { str: 5, dex: 3 },
      duration: 30, remaining: 30, stackable: false,
    });
    bc.addBuff({
      id: 'b2', name: 'B2', statBoosts: { str: 10 },
      duration: 30, remaining: 30, stackable: false,
    });
    expect(bc.getTotalStatBoost('str')).toBe(15);
    expect(bc.getTotalStatBoost('dex')).toBe(3);
  });

  it('buff with 0 stat boost returns 0', () => {
    bc.addBuff({
      id: 'empty', name: 'Empty',
      statBoosts: {},
      duration: 30, remaining: 30, stackable: false,
    });
    expect(bc.getTotalStatBoost('str')).toBe(0);
  });

  it('clear removes all buffs', () => {
    bc.addBuff({
      id: 'b1', name: 'B1', statBoosts: { str: 5 },
      duration: 30, remaining: 30, stackable: false,
    });
    bc.addBuff({
      id: 'b2', name: 'B2', statBoosts: { dex: 3 },
      duration: 30, remaining: 30, stackable: false,
    });
    expect(bc.buffs.size).toBe(2);
    bc.clear();
    expect(bc.buffs.size).toBe(0);
  });

  it('hasBuff returns correct boolean', () => {
    expect(bc.hasBuff('nonexistent')).toBe(false);
    bc.addBuff({
      id: 'test', name: 'Test', statBoosts: {},
      duration: 10, remaining: 10, stackable: false,
    });
    expect(bc.hasBuff('test')).toBe(true);
  });
});
