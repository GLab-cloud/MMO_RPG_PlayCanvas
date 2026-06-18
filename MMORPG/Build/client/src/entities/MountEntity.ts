import * as pc from 'playcanvas';

export class MountEntity {
  entity: pc.Entity;
  private trailParticles: pc.Entity[] = [];
  private isActive: boolean = false;

  constructor(app: pc.Application, id: string, mountType: string) {
    this.entity = new pc.Entity(id);

    if (mountType === 'broom') {
      const shaft = new pc.Entity(`${id}-shaft`);
      shaft.addComponent('render', {
        type: 'cylinder',
        material: this.createMaterial([0.5, 0.3, 0.15], [0.2, 0.2, 0.2]),
      });
      shaft.setLocalScale(0.08, 1.2, 0.08);
      shaft.setLocalEulerAngles(0, 0, 90);
      this.entity.addChild(shaft);

      const bristles = new pc.Entity(`${id}-bristles`);
      bristles.addComponent('render', {
        type: 'cone',
        material: this.createMaterial([0.6, 0.5, 0.3], [0.1, 0.1, 0.1]),
      });
      bristles.setLocalScale(0.25, 0.3, 0.25);
      bristles.setLocalPosition(-0.7, 0, 0);
      this.entity.addChild(bristles);
    } else {
      const board = new pc.Entity(`${id}-board`);
      board.addComponent('render', {
        type: 'box',
        material: this.createMaterial([0.3, 0.2, 0.6], [0.3, 0.3, 0.3]),
      });
      board.setLocalScale(0.6, 0.05, 0.2);
      this.entity.addChild(board);
    }

    this.entity.setLocalPosition(0, -0.8, 0);
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

  show(): void {
    this.isActive = true;
    this.entity.enabled = true;
  }

  hide(): void {
    this.isActive = false;
    this.entity.enabled = false;
  }

  setAltitude(alt: number): void {
    const pos = this.entity.getLocalPosition();
    pos.y = -0.8 + alt;
    this.entity.setLocalPosition(pos);
  }

  update(dt: number): void {
    if (!this.isActive) return;
  }

  destroy(): void {
    this.entity.destroy();
  }
}
