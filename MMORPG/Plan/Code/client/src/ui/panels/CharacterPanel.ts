export class CharacterPanel {
  private parent: pc.Entity;
  private isOpen = false;

  constructor(parent: pc.Entity) {
    this.parent = parent;
  }

  updateStats(data: {
    level: number;
    className: string;
    str: number;
    sta: number;
    dex: number;
    int: number;
    spr: number;
    statPoints: number;
  }): void {
  }

  open(): void { this.isOpen = true; }
  close(): void { this.isOpen = false; }
  toggle(): void { this.isOpen ? this.close() : this.open(); }
  isVisible(): boolean { return this.isOpen; }
}
