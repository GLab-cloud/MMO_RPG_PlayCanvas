interface ItemStack {
  id: string;
  itemId: number;
  quantity: number;
}

const INVENTORY_SIZE = 54;
const EQUIPMENT_SLOTS = 9;

export class InventoryComponent {
  slots: (ItemStack | null)[];
  equipment: (ItemStack | null)[];
  gold: number;

  constructor() {
    this.slots = new Array(INVENTORY_SIZE).fill(null);
    this.equipment = new Array(EQUIPMENT_SLOTS).fill(null);
    this.gold = 0;
  }

  addItem(itemId: number, quantity: number): boolean {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] && this.slots[i]!.itemId === itemId) {
        this.slots[i]!.quantity += quantity;
        return true;
      }
    }
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.slots[i]) {
        this.slots[i] = { id: `${itemId}-${i}`, itemId, quantity };
        return true;
      }
    }
    return false;
  }

  removeItem(slotIndex: number, quantity: number): boolean {
    const slot = this.slots[slotIndex];
    if (!slot || slot.quantity < quantity) return false;
    slot.quantity -= quantity;
    if (slot.quantity <= 0) this.slots[slotIndex] = null;
    return true;
  }

  moveItem(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= INVENTORY_SIZE || toIndex < 0 || toIndex >= INVENTORY_SIZE) return false;
    const temp = this.slots[toIndex];
    this.slots[toIndex] = this.slots[fromIndex];
    this.slots[fromIndex] = temp;
    return true;
  }

  equipItem(slotIndex: number, equipIndex: number): boolean {
    const item = this.slots[slotIndex];
    if (!item || equipIndex < 0 || equipIndex >= EQUIPMENT_SLOTS) return false;
    const currentEquip = this.equipment[equipIndex];
    this.equipment[equipIndex] = item;
    this.slots[slotIndex] = currentEquip;
    return true;
  }

  hasSpace(): boolean {
    return this.slots.some(s => s === null);
  }

  getItemCount(itemId: number): number {
    return this.slots.reduce((sum, s) => s && s.itemId === itemId ? sum + s.quantity : sum, 0);
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
