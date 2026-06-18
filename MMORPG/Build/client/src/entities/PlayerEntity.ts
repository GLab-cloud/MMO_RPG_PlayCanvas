import * as pc from 'playcanvas';

export class PlayerEntity {
  entity: pc.Entity;
  private app: pc.Application;
  private healthBar: pc.Entity;
  private nameplate: pc.Entity;

  constructor(app: pc.Application, id: string, name: string, color: pc.Color) {
    this.app = app;
    this.entity = new pc.Entity(id);

    const body = new pc.Entity(`${id}-body`);
    body.addComponent('render', {
      type: 'cylinder',
      material: this.createMaterial([color.r, color.g, color.b], [0.1, 0.1, 0.1]),
    });
    body.setLocalScale(0.8, 1.5, 0.8);
    body.setLocalPosition(0, 0.75, 0);
    this.entity.addChild(body);

    const head = new pc.Entity(`${id}-head`);
    head.addComponent('render', {
      type: 'sphere',
      material: this.createMaterial([0.9, 0.8, 0.7], [0.1, 0.1, 0.1]),
    });
    head.setLocalScale(0.4, 0.4, 0.4);
    head.setLocalPosition(0, 1.6, 0);
    this.entity.addChild(head);

    this.healthBar = this.createHealthBar();
    this.nameplate = this.createNameplate(name);

    app.root.addChild(this.entity);
  }

  private createMaterial(diffuse: number[], specular: number[]): pc.Material {
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(diffuse[0], diffuse[1], diffuse[2]);
    mat.specular = new pc.Color(specular[0], specular[1], specular[2]);
    mat.metalness = 0;
    mat.update();
    return mat;
  }

  private createHealthBar(): pc.Entity {
    const bar = new pc.Entity('healthbar');
    const bg = new pc.Entity('healthbar-bg');
    bg.addComponent('render', { type: 'box', material: this.createMaterial([0.2, 0.2, 0.2], [0, 0, 0]) });
    bg.setLocalScale(0.8, 0.08, 0.05);
    bar.addChild(bg);

    const fill = new pc.Entity('healthbar-fill');
    fill.addComponent('render', { type: 'box', material: this.createMaterial([0.9, 0.2, 0.2], [0, 0, 0]) });
    fill.setLocalScale(0.78, 0.06, 0.04);
    fill.setLocalPosition(0, 0, 0.01);
    bar.addChild(fill);

    bar.setLocalPosition(0, 2.2, 0);
    this.entity.addChild(bar);
    return bar;
  }

  private createNameplate(name: string): pc.Entity {
    const plate = new pc.Entity('nameplate');
    plate.setLocalPosition(0, 2.5, 0);
    this.entity.addChild(plate);
    return plate;
  }

  setPosition(pos: pc.Vec3): void {
    this.entity.setLocalPosition(pos);
  }

  setRotation(rot: pc.Vec3): void {
    this.entity.setLocalEulerAngles(rot);
  }

  destroy(): void {
    this.entity.destroy();
  }
}
