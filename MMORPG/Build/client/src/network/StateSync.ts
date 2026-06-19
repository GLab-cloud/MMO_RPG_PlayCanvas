import { Application, Entity, Vec3 } from 'playcanvas';

interface TrackedEntity {
  id: string;
  entity: Entity;
  lastPosition: Vec3;
  targetPosition: Vec3;
  lastUpdate: number;
}

const INTERPOLATION_BUFFER_MS = 50;

export class StateSync {
  private app: Application;
  private entities: Map<string, TrackedEntity> = new Map();

  constructor(app: Application) {
    this.app = app;
  }

  private trackedIds: Set<string> = new Set();
  private localSessionId: string = '';

  setLocalSessionId(sessionId: string): void {
    this.localSessionId = sessionId;
  }

  handleStateChange(state: any): void {
    this.trackedIds.clear();

    if (state.players) {
      for (const [id, data] of state.players) {
        if (id === this.localSessionId || data.sessionId === this.localSessionId) continue;
        this.trackedIds.add(`player:${id}`);
        if (this.entities.has(`player:${id}`)) {
          this.updateEntity(`player:${id}`, data);
        } else {
          this.createEntity(`player:${id}`, data, 'player');
        }
      }
    }

    if (state.monsters) {
      for (const [id, data] of state.monsters) {
        this.trackedIds.add(`monster:${id}`);
        if (this.entities.has(`monster:${id}`)) {
          this.updateEntity(`monster:${id}`, data);
        } else {
          this.createEntity(`monster:${id}`, data, 'monster');
        }
      }
    }

    for (const [id] of this.entities) {
      if (!this.trackedIds.has(id)) {
        this.removeEntity(id);
      }
    }
  }

  private createEntity(id: string, data: any, _type: string): void {
    const entity = new Entity(id);
    entity.addComponent('render', {
      type: 'box',
    });
    entity.setLocalPosition(data.x || 0, 0, data.z || 0);
    this.app.root.addChild(entity);

    this.entities.set(id, {
      id,
      entity,
      lastPosition: new Vec3(data.x || 0, 0, data.z || 0),
      targetPosition: new Vec3(data.x || 0, 0, data.z || 0),
      lastUpdate: Date.now(),
    });
  }

  private updateEntity(id: string, data: any): void {
    const tracked = this.entities.get(id);
    if (!tracked) return;

    tracked.lastPosition.copy(tracked.entity.getLocalPosition());
    tracked.targetPosition.set(data.x || 0, 0, data.z || 0);
    tracked.lastUpdate = Date.now();
  }

  private removeEntity(id: string): void {
    const tracked = this.entities.get(id);
    if (tracked) {
      tracked.entity.destroy();
      this.entities.delete(id);
    }
  }

  update(dt: number): void {
    const now = Date.now();
    for (const [, tracked] of this.entities) {
      const elapsed = now - tracked.lastUpdate;
      const t = Math.min(elapsed / INTERPOLATION_BUFFER_MS, 1);

      const currentPos = tracked.entity.getLocalPosition();
      currentPos.lerp(tracked.lastPosition, tracked.targetPosition, t);
      tracked.entity.setLocalPosition(currentPos);
    }
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id)?.entity;
  }
}
