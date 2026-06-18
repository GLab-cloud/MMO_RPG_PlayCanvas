import { describe, it, expect, beforeEach } from 'vitest';

interface Item {
  id: string;
  templateId: number;
  slot: number;
  quantity: number;
}

class InventoryComponent {
  slots: (Item | null)[];
  equipment: (Item | null)[];
  gold: number;

  constructor(slotCount: number = 54, equipmentSlots: number = 9) {
    this.slots = new Array(slotCount).fill(null);
    this.equipment = new Array(equipmentSlots).fill(null);
    this.gold = 0;
  }

  addItem(item: Item): boolean {
    const emptyIdx = this.slots.findIndex(s => s === null);
    if (emptyIdx === -1) return false;
    this.slots[emptyIdx] = { ...item, slot: emptyIdx };
    return true;
  }

  removeItem(slot: number): Item | null {
    const item = this.slots[slot];
    if (!item) return null;
    this.slots[slot] = null;
    return item;
  }

  moveItem(fromSlot: number, toSlot: number): boolean {
    if (fromSlot < 0 || fromSlot >= this.slots.length) return false;
    if (toSlot < 0 || toSlot >= this.slots.length) return false;
    const item = this.slots[fromSlot];
    const target = this.slots[toSlot];
    if (!item) return false;
    this.slots[toSlot] = { ...item, slot: toSlot };
    this.slots[fromSlot] = target ? { ...target, slot: fromSlot } : null;
    return true;
  }

  equipItem(invSlot: number, equipSlot: number): boolean {
    if (equipSlot < 0 || equipSlot >= this.equipment.length) return false;
    const item = this.slots[invSlot];
    if (!item) return false;
    const currentEquipped = this.equipment[equipSlot];
    this.equipment[equipSlot] = { ...item, slot: equipSlot };
    this.slots[invSlot] = currentEquipped
      ? { ...currentEquipped, slot: invSlot }
      : null;
    return true;
  }

  hasSpace(): boolean {
    return this.slots.some(s => s === null);
  }

  getItemCount(templateId: number): number {
    let count = 0;
    for (const slot of this.slots) {
      if (slot && slot.templateId === templateId) {
        count += slot.quantity;
      }
    }
    return count;
  }

  addGold(amount: number): void {
    this.gold += amount;
  }

  removeGold(amount: number): boolean {
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }
}

describe('InventoryComponent', () => {
  let inv: InventoryComponent;

  beforeEach(() => {
    inv = new InventoryComponent();
  });

  it('can add item to empty inventory', () => {
    const item: Item = { id: '1', templateId: 101, slot: -1, quantity: 1 };
    expect(inv.addItem(item)).toBe(true);
    expect(inv.slots.some(s => s?.templateId === 101)).toBe(true);
  });

  it('cannot add item to full inventory', () => {
    for (let i = 0; i < 54; i++) {
      inv.addItem({ id: `${i}`, templateId: 100 + i, slot: -1, quantity: 1 });
    }
    const result = inv.addItem({ id: 'overflow', templateId: 999, slot: -1, quantity: 1 });
    expect(result).toBe(false);
  });

  it('can remove item from inventory', () => {
    inv.addItem({ id: '1', templateId: 101, slot: -1, quantity: 1 });
    const removed = inv.removeItem(0);
    expect(removed).not.toBeNull();
    expect(removed!.templateId).toBe(101);
    expect(inv.slots[0]).toBeNull();
  });

  it('can move item between slots', () => {
    inv.addItem({ id: '1', templateId: 101, slot: -1, quantity: 1 });
    inv.addItem({ id: '2', templateId: 102, slot: -1, quantity: 1 });
    expect(inv.moveItem(0, 1)).toBe(true);
    expect(inv.slots[0]?.templateId).toBe(102);
    expect(inv.slots[1]?.templateId).toBe(101);
  });

  it('can equip item to correct equipment slot', () => {
    inv.addItem({ id: '1', templateId: 101, slot: -1, quantity: 1 });
    expect(inv.equipItem(0, 0)).toBe(true);
    expect(inv.equipment[0]).not.toBeNull();
    expect(inv.equipment[0]!.templateId).toBe(101);
  });

  it('hasSpace returns true when slots available', () => {
    expect(inv.hasSpace()).toBe(true);
  });

  it('hasSpace returns false when full', () => {
    for (let i = 0; i < 54; i++) {
      inv.addItem({ id: `${i}`, templateId: 100 + i, slot: -1, quantity: 1 });
    }
    expect(inv.hasSpace()).toBe(false);
  });

  it('getItemCount counts correctly', () => {
    inv.addItem({ id: '1', templateId: 101, slot: -1, quantity: 5 });
    inv.addItem({ id: '2', templateId: 101, slot: -1, quantity: 3 });
    expect(inv.getItemCount(101)).toBe(8);
  });

  it('addGold increases gold', () => {
    inv.addGold(1000);
    expect(inv.gold).toBe(1000);
  });

  it('removeGold decreases gold only if sufficient', () => {
    inv.addGold(1000);
    expect(inv.removeGold(500)).toBe(true);
    expect(inv.gold).toBe(500);
    expect(inv.removeGold(1000)).toBe(false);
    expect(inv.gold).toBe(500);
  });
});
