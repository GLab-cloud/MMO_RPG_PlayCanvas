import * as pc from 'playcanvas';

export class NPCEntity {
  entity: pc.Entity;
  private nameplate: pc.Entity;
  private questIndicator: pc.Entity | null = null;
  private shopIndicator: pc.Entity | null = null;
  private glowHighlight: pc.Entity | null = null;

  constructor(app: pc.Application, id: string, name: string, npcType: string) {
    this.entity = new pc.Entity(id);

    const body = new pc.Entity(`${id}-body`);
    body.addComponent('render', {
      type: 'cylinder',
      material: this.createMaterial(
        npcType === 'shop' ? [0.2, 0.6, 0.8] :
        npcType === 'quest' ? [0.8, 0.7, 0.2] :
        npcType === 'skill' ? [0.2, 0.8, 0.4] :
        npcType === 'transport' ? [0.6, 0.4, 0.8] :
        [0.6, 0.6, 0.6],
        [0.1, 0.1, 0.1]
      ),
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

    this.nameplate = this.createNameplate(name);

    if (npcType === 'quest') {
      this.showQuestIndicator(true);
    }
    if (npcType === 'shop') {
      this.showShopIndicator();
    }

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

  private createNameplate(name: string): pc.Entity {
    const plate = new pc.Entity('nameplate');
    plate.setLocalPosition(0, 2.3, 0);
    this.entity.addChild(plate);
    return plate;
  }

  showQuestIndicator(available: boolean): void {
    if (this.questIndicator) this.questIndicator.destroy();
    this.questIndicator = new pc.Entity('quest-indicator');
    this.questIndicator.addComponent('render', {
      type: 'sphere',
      material: this.createMaterial(
        available ? [1, 0.8, 0] : [0.5, 0.5, 0.5],
        [0.3, 0.3, 0.3]
      ),
    });
    this.questIndicator.setLocalScale(0.15, 0.15, 0.15);
    this.questIndicator.setLocalPosition(0, 2.6, 0);
    this.entity.addChild(this.questIndicator);
  }

  showShopIndicator(): void {
    this.shopIndicator = new pc.Entity('shop-indicator');
    this.shopIndicator.addComponent('render', {
      type: 'box',
      material: this.createMaterial([0.2, 0.8, 0.2], [0.2, 0.2, 0.2]),
    });
    this.shopIndicator.setLocalScale(0.1, 0.1, 0.1);
    this.shopIndicator.setLocalPosition(0, 2.6, 0);
    this.entity.addChild(this.shopIndicator);
  }

  showHighlight(): void {
    if (!this.glowHighlight) {
      this.glowHighlight = new pc.Entity('highlight');
      this.glowHighlight.addComponent('render', {
        type: 'cylinder',
        material: this.createMaterial([1, 1, 0.5], [0.3, 0.3, 0.3]),
      });
      this.glowHighlight.setLocalScale(1.0, 1.8, 1.0);
      this.glowHighlight.setLocalPosition(0, 0.9, 0);
      this.entity.addChild(this.glowHighlight);
    }
  }

  hideHighlight(): void {
    if (this.glowHighlight) {
      this.glowHighlight.destroy();
      this.glowHighlight = null;
    }
  }

  setPosition(pos: pc.Vec3): void {
    this.entity.setLocalPosition(pos);
  }

  destroy(): void {
    this.entity.destroy();
  }
}
