export class AssetLoader {
  private loaded: Set<string> = new Set();
  private loading: Map<string, Promise<unknown>> = new Map();
  private totalAssets: number = 0;
  private loadedCount: number = 0;

  async loadModel(name: string, url: string): Promise<unknown> {
    return this.load(name, url, 'model');
  }

  async loadTexture(name: string, url: string): Promise<unknown> {
    return this.load(name, url, 'texture');
  }

  async loadSound(name: string, url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    return response.arrayBuffer();
  }

  async loadAnimation(name: string, url: string): Promise<unknown> {
    return this.load(name, url, 'animation');
  }

  private async load(name: string, url: string, _type: string): Promise<unknown> {
    if (this.loaded.has(name)) return;
    if (this.loading.has(name)) return this.loading.get(name);

    const promise = fetch(url).then(r => r.json()).catch(() => {
      console.warn(`Failed to load asset: ${name}`);
      return null;
    });

    this.loading.set(name, promise);
    this.totalAssets++;

    const result = await promise;
    this.loading.delete(name);
    this.loaded.add(name);
    this.loadedCount++;
    return result;
  }

  getProgress(): number {
    return this.totalAssets > 0 ? this.loadedCount / this.totalAssets : 1;
  }

  isLoaded(name: string): boolean {
    return this.loaded.has(name);
  }

  reset(): void {
    this.loaded.clear();
    this.loading.clear();
    this.totalAssets = 0;
    this.loadedCount = 0;
  }
}
