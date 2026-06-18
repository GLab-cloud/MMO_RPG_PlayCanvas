export class PartyPanel {
  private parent: pc.Entity;
  private isOpen = false;

  constructor(parent: pc.Entity) {
    this.parent = parent;
  }

  updateParty(data: {
    members: Array<{ name: string; level: number; class: string; hp: number; maxHp: number; mp: number; maxMp: number }>;
  }): void {
  }

  open(): void { this.isOpen = true; }
  close(): void { this.isOpen = false; }
  toggle(): void { this.isOpen ? this.close() : this.open(); }
  isVisible(): boolean { return this.isOpen; }
}
