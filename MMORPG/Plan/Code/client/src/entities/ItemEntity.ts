export class ItemEntity {
  private entity: pc.Entity;
  private itemType: string;
  private pickupRange: number = 2;
  private bobTimer: number = 0;

  constructor(
    app: pc.Application,
    id: string,
    type: string,
    x: number,
    y: number,
    z: number
  ) {
    this.itemType = type;

    this.entity = new pc.Entity(`Item_${id}`);
    this.entity.addComponent('render', { type: 'box' });
    this.entity.setLocalScale(0.5, 0.3, 0.5);
    this.entity.setPosition(x, y, z);

    const colorMap: Record<string, string> = {
      health: '#2ecc71',
      armor: '#3498db',
      ammo: '#f1c40f',
      weapon: '#e74c3c',
      gold: '#f39c12',
    };

    this.entity.render.material = this.createMaterial(colorMap[type] || '#ffffff', app);
    app.root.addChild(this.entity);
  }

  private createMaterial(color: string, app: pc.Application): pc.StandardMaterial {
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(color);
    mat.update();
    return mat;
  }

  getPosition(): pc.Vec3 {
    return this.entity.getPosition();
  }

  getPickupRange(): number {
    return this.pickupRange;
  }

  getItemType(): string {
    return this.itemType;
  }

  update(dt: number): void {
    this.bobTimer += dt;
    const pos = this.entity.getPosition();
    pos.y += Math.sin(this.bobTimer * 3) * 0.01;
    this.entity.setPosition(pos);
    this.entity.rotateLocal(0, 60 * dt, 0);
  }

  destroy(): void {
    this.entity.destroy();
  }
}
