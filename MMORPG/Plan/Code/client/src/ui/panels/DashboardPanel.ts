export class DashboardPanel {
  private parent: pc.Entity;
  private isOpen = false;

  constructor(parent: pc.Entity) {
    this.parent = parent;
  }

  showProfile(data: {
    level: number;
    className: string;
    playtime: number;
    kills: number;
    deaths: number;
    gold: number;
  }): void {
  }

  showLeaderboard(type: string, entries: Array<{ rank: number; name: string; value: number }>): void {
  }

  showAchievements(achievements: Array<{ id: string; name: string; completed: boolean }>): void {
  }

  open(): void { this.isOpen = true; }
  close(): void { this.isOpen = false; }
  toggle(): void { this.isOpen ? this.close() : this.open(); }
  isVisible(): boolean { return this.isOpen; }
}
