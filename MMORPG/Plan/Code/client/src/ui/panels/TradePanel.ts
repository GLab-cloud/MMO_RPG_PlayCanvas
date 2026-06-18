export class TradePanel {
  private parent: pc.Entity;
  private isOpen = false;

  constructor(parent: pc.Entity) {
    this.parent = parent;
  }

  openTrade(data: { tradeId: string; partnerName: string }): void {
    this.isOpen = true;
  }

  close(): void { this.isOpen = false; }
  isVisible(): boolean { return this.isOpen; }
}
