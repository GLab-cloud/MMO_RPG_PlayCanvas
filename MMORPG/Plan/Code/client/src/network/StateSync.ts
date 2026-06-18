import { NetworkManager } from './NetworkManager.js';

interface InterpolationState {
  previous: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  startTime: number;
  duration: number;
}

export class StateSync {
  private networkManager: NetworkManager;
  private interpolationStates: Map<string, InterpolationState> = new Map();

  constructor(networkManager: NetworkManager) {
    this.networkManager = networkManager;
  }

  update(dt: number): void {
    for (const [id, state] of this.interpolationStates) {
      const elapsed = Date.now() - state.startTime;
      const t = Math.min(1, elapsed / state.duration);
      const x = state.previous.x + (state.target.x - state.previous.x) * t;
      const y = state.previous.y + (state.target.y - state.previous.y) * t;
      const z = state.previous.z + (state.target.z - state.previous.z) * t;
    }
  }

  setTarget(id: string, x: number, y: number, z: number): void {
    const existing = this.interpolationStates.get(id);
    if (existing) {
      existing.previous = existing.target;
    } else {
      this.interpolationStates.set(id, {
        previous: { x, y, z },
        target: { x, y, z },
        startTime: Date.now(),
        duration: 50,
      });
    }
  }

  removeEntity(id: string): void {
    this.interpolationStates.delete(id);
  }
}
