export class AnimationController {
  private currentAnim: string = 'idle';
  private animations: Map<string, { speed: number; loop: boolean }> = new Map();

  constructor() {
    this.animations.set('idle', { speed: 1, loop: true });
    this.animations.set('walk', { speed: 1, loop: true });
    this.animations.set('run', { speed: 1.5, loop: true });
    this.animations.set('sprint', { speed: 2, loop: true });
    this.animations.set('jump', { speed: 1, loop: false });
    this.animations.set('attack', { speed: 1.5, loop: false });
    this.animations.set('skill', { speed: 1, loop: false });
    this.animations.set('hit', { speed: 1, loop: false });
    this.animations.set('death', { speed: 0.5, loop: false });
    this.animations.set('fly', { speed: 1, loop: true });
    this.animations.set('emote', { speed: 1, loop: false });
  }

  play(name: string): void {
    const anim = this.animations.get(name);
    if (!anim) return;
    this.currentAnim = name;
  }

  getCurrentAnimation(): string {
    return this.currentAnim;
  }

  update(dt: number): void {
  }
}
