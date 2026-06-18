export class SkillPanel {
  private parent: pc.Entity;
  private isOpen = false;

  constructor(parent: pc.Entity) {
    this.parent = parent;
  }

  loadSkills(skills: Array<{ id: string; name: string; icon: string; level: number; cooldown: number }>): void {
  }

  open(): void { this.isOpen = true; }
  close(): void { this.isOpen = false; }
  toggle(): void { this.isOpen ? this.close() : this.open(); }
  isVisible(): boolean { return this.isOpen; }
}
