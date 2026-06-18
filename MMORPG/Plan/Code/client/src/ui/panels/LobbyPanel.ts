export class LobbyPanel {
  private parent: pc.Entity;
  private isOpen = false;

  constructor(parent: pc.Entity) {
    this.parent = parent;
  }

  showChannels(channels: Array<{ id: string; name: string; playerCount: number; maxPlayers: number }>): void {
  }

  open(): void { this.isOpen = true; }
  close(): void { this.isOpen = false; }
  isVisible(): boolean { return this.isOpen; }
}
