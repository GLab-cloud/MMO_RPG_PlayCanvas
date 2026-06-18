import { describe, it, expect } from 'vitest';
import { ClassType } from '../shared/types.js';
import { INVENTORY_SIZE, MAX_PARTY_SIZE, XP_TABLE } from '../shared/constants.js';

describe('Shared Constants', () => {
  it('ClassType enum has all 13 classes', () => {
    const classes = Object.keys(ClassType);
    expect(classes.length).toBe(13);
    expect(ClassType.Beginner).toBe('Beginner');
    expect(ClassType.Billposter).toBe('Billposter');
  });

  it('INVENTORY_SIZE = 54', () => {
    expect(INVENTORY_SIZE).toBe(54);
  });

  it('MAX_PARTY_SIZE = 6', () => {
    expect(MAX_PARTY_SIZE).toBe(6);
  });

  it('XP_TABLE has 121 entries (level 0-120)', () => {
    expect(XP_TABLE.length).toBe(121);
  });

  it('XP for level 1 = 60, level 10 = 10050, level 50 = 1250050', () => {
    expect(XP_TABLE[1]).toBe(60);
    expect(XP_TABLE[10]).toBe(10050);
    expect(XP_TABLE[50]).toBe(1250050);
  });
});
