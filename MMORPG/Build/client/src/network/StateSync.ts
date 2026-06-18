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

  handleStateChange(state: any): void {
    if (!state.entities) return;

    for (const [id, data] of Object.entries(state.entities)) {
      if (this.entities.has(id)) {
        this.updateEntity(id, data as any);
      } else {
        this.createEntity(id, data as any);
      }
    }

    for (const [id] of this.entities) {
      if (!state.entities[id]) {
        this.removeEntity(id);
      }
    }
  }

  private createEntity(id: string, data: { x: number; y: number; z: number; type: string }): void {
    const entity = new Entity(id);
    entity.addComponent('render', {
      type: 'box',
    });
    entity.setLocalPosition(data.x, data.y, data.z);
    this.app.root.addChild(entity);

    this.entities.set(id, {
      id,
      entity,
      lastPosition: new Vec3(data.x, data.y, data.z),
      targetPosition: new Vec3(data.x, data.y, data.z),
      lastUpdate: Date.now(),
    });
  }

  private updateEntity(id: string, data: { x: number; y: number; z: number }): void {
    const tracked = this.entities.get(id);
    if (!tracked) return;

    tracked.lastPosition.copy(tracked.entity.getLocalPosition());
    tracked.targetPosition.set(data.x, data.y, data.z);
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
