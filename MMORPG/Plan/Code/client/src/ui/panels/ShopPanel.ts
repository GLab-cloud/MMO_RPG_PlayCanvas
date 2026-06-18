export class ShopPanel {
  private parent: pc.Entity;
  private isOpen = false;

  constructor(parent: pc.Entity) {
    this.parent = parent;
  }

  openShop(npcName: string, items: Array<{ id: number; name: string; price: number }>): void {
    this.isOpen = true;
  }

  close(): void { this.isOpen = false; }
  isVisible(): boolean { return this.isOpen; }
}
