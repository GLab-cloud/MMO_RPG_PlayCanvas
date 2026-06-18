export class SettingsPanel {
  private parent: pc.Entity;
  private isOpen = false;

  constructor(parent: pc.Entity) {
    this.parent = parent;
  }

  open(): void { this.isOpen = true; }
  close(): void { this.isOpen = false; }
  toggle(): void { this.isOpen ? this.close() : this.open(); }
  isVisible(): boolean { return this.isOpen; }

  applyGraphics(settings: { quality: string; shadows: boolean; postProcessing: boolean }): void {
  }

  applyAudio(settings: { masterVolume: number; musicVolume: number; sfxVolume: number }): void {
  }

  applyControls(settings: { sensitivity: number; invertY: boolean }): void {
  }
}
