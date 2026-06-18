type AnimationState = 'idle' | 'walk' | 'run' | 'sprint' | 'jump' | 'attack' | 'skill' | 'hit' | 'death' | 'fly' | 'emote';

export class AnimationController {
  private currentState: AnimationState = 'idle';
  private previousState: AnimationState = 'idle';

  play(name: AnimationState): void {
    this.previousState = this.currentState;
    this.currentState = name;
  }

  getCurrent(): AnimationState {
    return this.currentState;
  }

  getPrevious(): AnimationState {
    return this.previousState;
  }

  isIdle(): boolean {
    return this.currentState === 'idle';
  }

  isMoving(): boolean {
    return this.currentState === 'walk' || this.currentState === 'run' || this.currentState === 'sprint';
  }

  isAttacking(): boolean {
    return this.currentState === 'attack' || this.currentState === 'skill';
  }
}
