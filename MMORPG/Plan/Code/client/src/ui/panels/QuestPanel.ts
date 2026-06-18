export class QuestPanel {
  private parent: pc.Entity;
  private isOpen = false;

  constructor(parent: pc.Entity) {
    this.parent = parent;
  }

  updateQuests(quests: Array<{ id: string; name: string; type: string; objectives: string[] }>): void {
  }

  open(): void { this.isOpen = true; }
  close(): void { this.isOpen = false; }
  toggle(): void { this.isOpen ? this.close() : this.open(); }
  isVisible(): boolean { return this.isOpen; }
}
