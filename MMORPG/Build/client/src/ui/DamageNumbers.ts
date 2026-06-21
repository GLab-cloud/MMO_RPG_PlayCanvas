import * as pc from 'playcanvas';

interface DamageNumber {
  entity: pc.Entity;
  velocity: pc.Vec3;
  lifetime: number;
  maxLifetime: number;
  color: pc.Color;
}

export class DamageNumbers {
  private app: pc.Application;
  private camera: pc.Entity | null = null;
  private numbers: DamageNumber[] = [];

  constructor(app: pc.Application) {
    this.app = app;
  }

  setCamera(camera: pc.Entity): void {
    this.camera = camera;
  }

  show(damage: number, worldPos: pc.Vec3, critical: boolean = false, isHeal: boolean = false): void {
    const color = isHeal ? new pc.Color(0.2, 1, 0.2)
      : critical ? new pc.Color(1, 0.8, 0)
      : new pc.Color(1, 0.3, 0.3);

    const text = critical ? `⚡${damage}` : `${damage}`;
    const size = critical ? 28 : 20;

    const entity = new pc.Entity('dmg-' + Date.now());
    entity.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text,
      color,
      fontSize: size,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
      autoWidth: true,
      autoHeight: true,
    });

    entity.setLocalPosition(
      worldPos.x + (Math.random() - 0.5) * 0.5,
      worldPos.y + 1.5 + Math.random() * 0.5,
      worldPos.z + (Math.random() - 0.5) * 0.5,
    );

    this.app.root.addChild(entity);

    this.numbers.push({
      entity,
      velocity: new pc.Vec3(0, 1.5 + Math.random() * 0.5, 0),
      lifetime: 0,
      maxLifetime: 1.2 + Math.random() * 0.4,
      color,
    });
  }

  update(dt: number): void {
    const cam = this.camera;
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.lifetime += dt;

      const t = n.lifetime / n.maxLifetime;
      const pos = n.entity.getLocalPosition();
      pos.add(n.velocity.clone().mulScalar(dt));
      n.entity.setLocalPosition(pos);

      n.entity.setLocalScale(1 + t * 0.3, 1 + t * 0.3, 1 + t * 0.3);

      const opacity = 1 - t;
      n.entity.element!.opacity = Math.max(0, opacity);

      if (cam) {
        n.entity.lookAt(cam.getPosition());
      }

      if (n.lifetime >= n.maxLifetime) {
        n.entity.destroy();
        this.numbers.splice(i, 1);
      }
    }
  }

  clear(): void {
    for (const n of this.numbers) {
      n.entity.destroy();
    }
    this.numbers = [];
  }
}
