import { generateId } from '../utils/Helpers.js';

export interface Item {
  id: string;
  name: string;
  quantity: number;
  slot: number;
  equipped: boolean;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material';
}

export class InventoryHandler {
  handleMove(data: { fromSlot: number; toSlot: number }, items: Item[]): Item[] {
    const fromIdx = items.findIndex(i => i.slot === data.fromSlot);
    const toIdx = items.findIndex(i => i.slot === data.toSlot);
    if (fromIdx >= 0) {
      if (toIdx >= 0) {
        const tempSlot = items[fromIdx]!.slot;
        items[fromIdx]!.slot = items[toIdx]!.slot;
        items[toIdx]!.slot = tempSlot;
      } else {
        items[fromIdx]!.slot = data.toSlot;
      }
    }
    return [...items];
  }

  handleUse(data: { slot: number }, items: Item[]): { updatedItems: Item[]; effect?: string } {
    const idx = items.findIndex(i => i.slot === data.slot && i.type === 'consumable');
    if (idx >= 0) {
      const item = items[idx]!;
      item.quantity--;
      if (item.quantity <= 0) {
        items.splice(idx, 1);
      }
      return { updatedItems: [...items], effect: 'consumed' };
    }
    return { updatedItems: items };
  }

  handleEquip(data: { slot: number }, items: Item[]): Item[] {
    const item = items.find(i => i.slot === data.slot);
    if (item && (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory')) {
      item.equipped = !item.equipped;
    }
    return [...items];
  }

  handleDrop(data: { slot: number }, items: Item[]): { updatedItems: Item[]; droppedItem?: Item } {
    const idx = items.findIndex(i => i.slot === data.slot);
    if (idx >= 0) {
      const dropped = items.splice(idx, 1)[0]!;
      return { updatedItems: [...items], droppedItem: dropped };
    }
    return { updatedItems: items };
  }

  handlePickup(data: { lootId: string; slot: number }, lootSpawns: Map<string, any>, items: Item[]): { updatedItems: Item[]; lootRemoved: boolean } {
    const loot = lootSpawns.get(data.lootId);
    if (!loot) return { updatedItems: items, lootRemoved: false };
    for (const lootItem of loot.items) {
      items.push({ ...lootItem, slot: data.slot, equipped: false, type: 'material' });
    }
    lootSpawns.delete(data.lootId);
    return { updatedItems: [...items], lootRemoved: true };
  }
}
