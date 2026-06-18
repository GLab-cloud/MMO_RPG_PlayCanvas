import { generateId } from '../utils/Helpers.js';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material';
}

interface Shop {
  id: string;
  name: string;
  items: ShopItem[];
}

export class ShopHandler {
  private shops: Map<string, Shop> = new Map();

  constructor() {
    this.initializeShops();
  }

  private initializeShops(): void {
    const shopDefs: Shop[] = [
      {
        id: 'general_store',
        name: 'General Store',
        items: [
          { id: generateId(), name: 'Health Potion', price: 50, type: 'consumable' },
          { id: generateId(), name: 'Mana Potion', price: 50, type: 'consumable' },
          { id: generateId(), name: 'Bread', price: 10, type: 'consumable' },
          { id: generateId(), name: 'Water', price: 5, type: 'consumable' },
        ],
      },
      {
        id: 'weapon_smith',
        name: 'Weapon Smith',
        items: [
          { id: generateId(), name: 'Iron Sword', price: 500, type: 'weapon' },
          { id: generateId(), name: 'Steel Axe', price: 800, type: 'weapon' },
          { id: generateId(), name: 'Wooden Staff', price: 300, type: 'weapon' },
          { id: generateId(), name: 'Long Bow', price: 600, type: 'weapon' },
        ],
      },
      {
        id: 'armorer',
        name: 'Armorer',
        items: [
          { id: generateId(), name: 'Leather Armor', price: 400, type: 'armor' },
          { id: generateId(), name: 'Chain Mail', price: 1000, type: 'armor' },
          { id: generateId(), name: 'Iron Helmet', price: 300, type: 'armor' },
          { id: generateId(), name: 'Steel Boots', price: 350, type: 'armor' },
        ],
      },
    ];
    for (const shop of shopDefs) {
      this.shops.set(shop.id, shop);
    }
  }

  handleOpen(shopId: string): { success: boolean; shop?: Shop; error?: string } {
    const shop = this.shops.get(shopId);
    if (!shop) return { success: false, error: 'Shop not found' };
    return { success: true, shop };
  }

  handleBuy(playerGold: number, shopId: string, itemId: string, quantity: number = 1): { success: boolean; item?: ShopItem; totalCost?: number; error?: string } {
    const shop = this.shops.get(shopId);
    if (!shop) return { success: false, error: 'Shop not found' };
    const shopItem = shop.items.find(i => i.id === itemId);
    if (!shopItem) return { success: false, error: 'Item not found in shop' };
    const totalCost = shopItem.price * quantity;
    if (playerGold < totalCost) return { success: false, error: 'Not enough gold' };
    return { success: true, item: shopItem, totalCost };
  }

  handleSell(itemPrice: number, quantity: number = 1): { success: boolean; goldEarned: number } {
    const goldEarned = Math.floor(itemPrice * quantity * 0.5);
    return { success: true, goldEarned };
  }

  getAllShops(): Shop[] {
    return Array.from(this.shops.values());
  }
}
