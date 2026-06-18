const INVENTORY_SIZE = 54;
const EQUIPMENT_SLOTS = 9;

interface ItemStack {
  id: string;
  templateId: number;
  quantity: number;
  isEquipped: boolean;
}

export class InventoryComponent {
  slots: (ItemStack | null)[] = new Array(INVENTORY_SIZE).fill(null);
  equipment: (ItemStack | null)[] = new Array(EQUIPMENT_SLOTS).fill(null);
  gold: number = 0;

  addItem(item: ItemStack): boolean {
    const emptySlot = this.slots.findIndex((s) => s === null);
    if (emptySlot < 0) return false;
    this.slots[emptySlot] = item;
    return true;
  }

  removeItem(slot: number): void {
    if (slot >= 0 && slot < INVENTORY_SIZE) {
      this.slots[slot] = null;
    }
  }

  moveItem(fromSlot: number, toSlot: number): boolean {
    if (toSlot >= INVENTORY_SIZE) return false;
    this.slots[toSlot] = this.slots[fromSlot];
    this.slots[fromSlot] = null;
    return true;
  }

  equipItem(slot: number, equipSlot: number): boolean {
    const item = this.slots[slot];
    if (!item) return false;
    if (equipSlot >= EQUIPMENT_SLOTS) return false;

    const currentEquipped = this.equipment[equipSlot];
    this.equipment[equipSlot] = item;
    this.slots[slot] = currentEquipped;
    item.isEquipped = true;
    return true;
  }

  hasSpace(): boolean {
    return this.slots.some((s) => s === null);
  }

  getItemCount(templateId: number): number {
    return this.slots.reduce((count, slot) => {
      if (slot && slot.templateId === templateId) return count + slot.quantity;
      return count;
    }, 0);
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
