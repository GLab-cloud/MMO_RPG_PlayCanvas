import { config } from '../config.js';

export class RenderSystem {
  private app: pc.Application;
  private quality: string = 'high';
  private shadowsEnabled: boolean = true;
  private postProcessingEnabled: boolean = true;

  constructor(app: pc.Application) {
    this.app = app;
  }

  setQuality(level: string): void {
    this.quality = level;
    switch (level) {
      case 'low':
        this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
        this.shadowsEnabled = false;
        this.postProcessingEnabled = false;
        break;
      case 'medium':
        this.shadowsEnabled = true;
        this.postProcessingEnabled = false;
        break;
      case 'high':
      case 'ultra':
        this.shadowsEnabled = true;
        this.postProcessingEnabled = true;
        break;
    }
    this.applySettings();
  }

  private applySettings(): void {
    const lights = this.app.root.findByComponent('light');
    for (const light of lights) {
      if (light.light) {
        light.light.castShadows = this.shadowsEnabled;
      }
    }
  }

  toggleShadows(enabled: boolean): void {
    this.shadowsEnabled = enabled;
    this.applySettings();
  }

  togglePostProcessing(enabled: boolean): void {
    this.postProcessingEnabled = enabled;
  }

  getDrawCalls(): number {
    return 0;
  }

  getFrameTime(): number {
    return 0;
  }
}
