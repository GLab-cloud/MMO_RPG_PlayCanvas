import * as pc from 'playcanvas';

const ITEM_COLORS: Record<string, number[]> = {
  weapon: [0.8, 0.4, 0.2],
  armor: [0.2, 0.3, 0.7],
  potion: [0.2, 0.8, 0.2],
  quest: [0.8, 0.7, 0.1],
  gold: [1, 0.85, 0],
  ore: [0.6, 0.5, 0.4],
  herb: [0.3, 0.7, 0.3],
};

export class ItemEntity {
  entity: pc.Entity;
  private bobbingTime: number = 0;
  private initialY: number;

  constructor(app: pc.Application, id: string, itemType: string) {
    this.entity = new pc.Entity(id);

    const color = ITEM_COLORS[itemType] || [0.5, 0.5, 0.5];
    const mesh = new pc.Entity(`${id}-mesh`);
    mesh.addComponent('render', {
      type: itemType === 'gold' ? 'cylinder' : 'box',
      material: this.createMaterial(color, [0.2, 0.2, 0.2]),
    });
    mesh.setLocalScale(0.3, 0.3, 0.3);
    this.entity.addChild(mesh);

    const glow = new pc.Entity(`${id}-glow`);
    glow.addComponent('render', {
      type: 'sphere',
      material: this.createMaterial([color[0] * 0.5 + 0.5, color[1] * 0.5 + 0.5, color[2] * 0.5 + 0.5], [0.5, 0.5, 0.5]),
    });
    glow.setLocalScale(0.5, 0.5, 0.5);
    glow.setLocalPosition(0, 0, 0);
    this.entity.addChild(glow);

    this.initialY = 0.3;
    this.entity.setLocalPosition(0, this.initialY, 0);
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

  update(dt: number): void {
    this.bobbingTime += dt * 2;
    const pos = this.entity.getLocalPosition();
    pos.y = this.initialY + Math.sin(this.bobbingTime) * 0.1;
    this.entity.setLocalPosition(pos);

    this.entity.rotateLocal(0, dt * 60, 0);
  }

  setPosition(pos: pc.Vec3): void {
    this.initialY = pos.y;
    this.entity.setLocalPosition(pos);
  }

  destroy(): void {
    this.entity.destroy();
  }
}
