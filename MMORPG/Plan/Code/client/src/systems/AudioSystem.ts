export class AudioSystem {
  private app: pc.Application;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.8;
  private currentMusic: string = '';

  constructor(app: pc.Application) {
    this.app = app;
  }

  playSound(name: string, volume: number = 1): void {
    this.app.systems.sound.playSound(name, volume * this.sfxVolume);
  }

  playMusic(name: string): void {
    if (this.currentMusic === name) return;
    this.stopMusic();
    this.currentMusic = name;
    this.app.systems.sound.playSound(name, this.musicVolume, { loop: true });
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.app.systems.sound.stopSound(this.currentMusic);
      this.currentMusic = '';
    }
  }

  setMasterVolume(volume: number): void {
    this.app.systems.sound.volume = volume;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = volume;
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = volume;
  }

  playFootstep(): void {
    this.playSound('sfx_footstep', 0.3);
  }

  playHit(): void {
    this.playSound('sfx_hit', 0.6);
  }

  playLevelUp(): void {
    this.playSound('sfx_levelup');
  }

  playPickup(): void {
    this.playSound('sfx_pickup', 0.5);
  }

  playMount(): void {
    this.playSound('sfx_mount');
  }
}
