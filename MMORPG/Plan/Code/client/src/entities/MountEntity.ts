export class MountEntity {
  private entity: pc.Entity;
  private mountId: string;
  private mountName: string;
  private speed: number;
  private altitude: number = 0;

  constructor(
    app: pc.Application,
    id: string,
    name: string,
    speed: number,
    template: string
  ) {
    this.mountId = id;
    this.mountName = name;
    this.speed = speed;

    this.entity = new pc.Entity(`Mount_${id}`);
    this.entity.addComponent('render', { type: 'cylinder' });
    this.entity.setLocalScale(0.8, 0.2, 0.3);
    app.root.addChild(this.entity);
  }

  setPosition(x: number, y: number, z: number): void {
    this.entity.setPosition(x, y + this.altitude, z);
  }

  setAltitude(alt: number): void {
    this.altitude = Math.max(0, Math.min(20, alt));
  }

  getSpeed(): number {
    return this.speed;
  }

  getAltitude(): number {
    return this.altitude;
  }

  getEntity(): pc.Entity {
    return this.entity;
  }

  destroy(): void {
    this.entity.destroy();
  }
}
