import { config } from '../config.js';

export class AssetLoader {
  private app: pc.Application;
  private loaded: Set<string> = new Set();
  private loading: Map<string, Promise<unknown>> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
  }

  loadModel(name: string, url: string): Promise<pc.Asset> {
    return this.load(name, 'model', url);
  }

  loadTexture(name: string, url: string): Promise<pc.Asset> {
    return this.load(name, 'texture', url);
  }

  loadSound(name: string, url: string): Promise<pc.Asset> {
    return this.load(name, 'audio', url);
  }

  loadAnimation(name: string, url: string): Promise<pc.Asset> {
    return this.load(name, 'animation', url);
  }

  private load(name: string, type: string, url: string): Promise<pc.Asset> {
    if (this.loaded.has(name)) {
      return Promise.resolve(this.app.assets.find(name)!);
    }

    if (this.loading.has(name)) {
      return this.loading.get(name)! as Promise<pc.Asset>;
    }

    const promise = new Promise<pc.Asset>((resolve, reject) => {
      const asset = new pc.Asset(name, type as pc.ASSET_MODEL, {
        url: `${config.resourceUrl}/${url}`,
      });

      asset.on('load', () => {
        this.loaded.add(name);
        resolve(asset);
      });

      asset.on('error', (err: Error) => {
        this.loading.delete(name);
        reject(err);
      });

      this.app.assets.add(asset);
      this.app.assets.load(asset);
    });

    this.loading.set(name, promise);
    return promise;
  }

  loadMultiple(assets: Array<{ name: string; type: string; url: string }>): Promise<pc.Asset[]> {
    return Promise.all(assets.map((a) => this.load(a.name, a.type, a.url)));
  }

  isLoaded(name: string): boolean {
    return this.loaded.has(name);
  }

  getProgress(): number {
    return this.loading.size > 0 ? this.loaded.size / (this.loaded.size + this.loading.size) : 1;
  }
}
