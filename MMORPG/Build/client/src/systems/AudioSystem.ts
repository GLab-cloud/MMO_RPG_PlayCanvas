export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 0.7;
  private bgMusic: AudioBufferSourceNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    try {
      this.audioContext = new AudioContext();
    } catch {
      console.warn('Audio not supported');
    }
  }

  async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext) return;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers.set(name, audioBuffer);
    } catch (err) {
      console.warn(`Failed to load sound ${name}:`, err);
    }
  }

  playSound(name: string): void {
    if (!this.audioContext) return;
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start();
  }

  playMusic(name: string, loop: boolean = true): void {
    if (!this.audioContext) return;
    this.stopMusic();
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    this.bgMusic = this.audioContext.createBufferSource();
    this.bgMusic.buffer = buffer;
    this.bgMusic.loop = loop;
    this.bgMusic.connect(this.audioContext.destination);
    this.bgMusic.start();
  }

  stopMusic(): void {
    this.bgMusic?.stop();
    this.bgMusic = null;
  }

  setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  playFootstep(): void { this.playSound('footstep'); }
  playHit(): void { this.playSound('hit'); }
  playLevelUp(): void { this.playSound('levelup'); }
  playPickup(): void { this.playSound('pickup'); }
  playMount(): void { this.playSound('mount'); }
}
