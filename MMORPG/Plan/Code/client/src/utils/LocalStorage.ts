export class LocalStorageManager {
  private prefix: string = 'flyff_';

  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      console.warn('Failed to save to localStorage:', key);
    }
  }

  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
  }

  getSettings(): Record<string, unknown> {
    return {
      graphics: this.get('graphics', { quality: 'high', shadows: true, postProcessing: true }),
      audio: this.get('audio', { masterVolume: 1, musicVolume: 0.5, sfxVolume: 0.8 }),
      controls: this.get('controls', { sensitivity: 0.15, invertY: false }),
      gameplay: this.get('gameplay', { showDamageNumbers: true, showNameplates: true }),
    };
  }

  saveSettings(settings: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(settings)) {
      this.set(key, value);
    }
  }

  getAuthToken(): string | null {
    return this.get<string | null>('authToken', null);
  }

  setAuthToken(token: string): void {
    this.set('authToken', token);
  }

  clearAuthToken(): void {
    this.remove('authToken');
  }
}
