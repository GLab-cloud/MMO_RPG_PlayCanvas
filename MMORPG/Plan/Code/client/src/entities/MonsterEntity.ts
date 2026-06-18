export class MonsterEntity {
  private entity: pc.Entity;
  private templateId: number;
  private health: number;
  private maxHealth: number;
  private healthBar: pc.Entity;

  constructor(app: pc.Application, id: string, templateId: number) {
    this.templateId = templateId;
    this.health = 100;
    this.maxHealth = 100;

    this.entity = new pc.Entity(`Monster_${id}`);
    this.entity.addComponent('render', { type: 'box' });
    this.entity.setLocalScale(1, 1.5, 1);
    app.root.addChild(this.entity);

    this.healthBar = new pc.Entity('HealthBar');
    this.healthBar.addComponent('render', {
      type: 'box',
      material: this.createHealthBarMaterial(app),
    });
    this.healthBar.setLocalScale(1.2, 0.1, 0.1);
    this.healthBar.setLocalPosition(0, 2, 0);
    this.entity.addChild(this.healthBar);
  }

  private createHealthBarMaterial(app: pc.Application): pc.StandardMaterial {
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(0.9, 0.1, 0.1);
    mat.update();
    return mat;
  }

  setPosition(x: number, y: number, z: number): void {
    this.entity.setPosition(x, y, z);
  }

  setHealth(hp: number, maxHp: number): void {
    this.health = hp;
    this.maxHealth = maxHp;
    const ratio = hp / maxHp;
    this.healthBar.setLocalScale(1.2 * ratio, 0.1, 0.1);
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.setHealth(this.health, this.maxHealth);
  }

  destroy(): void {
    this.entity.destroy();
  }
}
