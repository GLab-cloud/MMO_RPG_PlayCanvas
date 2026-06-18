import * as pc from 'playcanvas';
import { HealthComponent } from '../components/HealthComponent';

export class MonsterEntity {
  entity: pc.Entity;
  health: HealthComponent;
  private healthBar: pc.Entity;
  private aggroIndicator: pc.Entity | null = null;

  constructor(app: pc.Application, id: string, type: string, color: pc.Color) {
    this.entity = new pc.Entity(id);
    this.health = new HealthComponent(100, 0);

    const body = new pc.Entity(`${id}-body`);
    body.addComponent('render', {
      type: 'box',
      material: this.createMaterial([color.r, color.g, color.b], [0.1, 0.1, 0.1]),
    });
    body.setLocalScale(0.8, 0.8, 0.8);
    body.setLocalPosition(0, 0.4, 0);
    this.entity.addChild(body);

    const eyes = new pc.Entity(`${id}-eyes`);
    eyes.addComponent('render', {
      type: 'sphere',
      material: this.createMaterial([1, 0, 0], [0.5, 0.5, 0.5]),
    });
    eyes.setLocalScale(0.15, 0.15, 0.15);
    eyes.setLocalPosition(0, 0.6, 0.3);
    this.entity.addChild(eyes);

    this.healthBar = this.createHealthBar();
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
    const bar = new pc.Entity(`${this.entity.name}-hp`);
    const bg = new pc.Entity('hp-bg');
    bg.addComponent('render', { type: 'box', material: this.createMaterial([0.2, 0.2, 0.2], [0, 0, 0]) });
    bg.setLocalScale(0.7, 0.06, 0.04);
    bar.addChild(bg);

    const fill = new pc.Entity('hp-fill');
    fill.addComponent('render', { type: 'box', material: this.createMaterial([0.9, 0.2, 0.2], [0, 0, 0]) });
    fill.setLocalScale(0.68, 0.04, 0.03);
    fill.setLocalPosition(0, 0, 0.01);
    bar.addChild(fill);

    bar.setLocalPosition(0, 1.0, 0);
    this.entity.addChild(bar);
    return bar;
  }

  showAggro(): void {
    if (!this.aggroIndicator) {
      this.aggroIndicator = new pc.Entity(`${this.entity.name}-aggro`);
      this.aggroIndicator.addComponent('render', {
        type: 'cone',
        material: this.createMaterial([1, 0, 0], [0.3, 0.3, 0.3]),
      });
      this.aggroIndicator.setLocalScale(0.5, 0.3, 0.5);
      this.aggroIndicator.setLocalPosition(0, 1.2, 0);
      this.entity.addChild(this.aggroIndicator);
    }
  }

  hideAggro(): void {
    if (this.aggroIndicator) {
      this.aggroIndicator.destroy();
      this.aggroIndicator = null;
    }
  }

  takeDamage(amount: number): void {
    this.health.takeDamage(amount);
    const fill = this.healthBar.findByName('hp-fill');
    if (fill) {
      fill.setLocalScale(0.68 * this.health.getRatio(), 0.04, 0.03);
    }
    if (this.health.current <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.entity.enabled = false;
    setTimeout(() => {
      this.entity.enabled = true;
      this.health.current = this.health.max;
    }, 5000);
  }

  setPosition(pos: pc.Vec3): void {
    this.entity.setLocalPosition(pos);
  }

  destroy(): void {
    this.entity.destroy();
  }
}
