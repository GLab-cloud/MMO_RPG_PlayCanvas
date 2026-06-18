export class HUDPanel {
  private parent: pc.Entity;
  private healthBar!: pc.Entity;
  private manaBar!: pc.Entity;
  private xpBar!: pc.Entity;
  private healthText!: pc.Entity;
  private manaText!: pc.Entity;
  private levelText!: pc.Entity;
  private skillBar!: pc.Entity;
  private minimap!: pc.Entity;
  private buffBar!: pc.Entity;
  private targetInfo!: pc.Entity;

  constructor(parent: pc.Entity) {
    this.parent = parent;
    this.createHUD();
  }

  private createHUD(): void {
    this.healthBar = this.createBar('HealthBar', 20, 40, 200, 20, '#e74c3c');
    this.manaBar = this.createBar('ManaBar', 20, 65, 200, 16, '#3498db');
    this.xpBar = this.createBar('XPBar', 20, 85, 200, 10, '#2ecc71');

    this.healthText = this.createText('HPText', 'HP: 100/100', 20, 35, '#ffffff', 16);
    this.manaText = this.createText('MPText', 'MP: 50/50', 20, 62, '#ffffff', 14);
    this.levelText = this.createText('LevelText', 'Lv.1', 20, 20, '#f1c40f', 18);
  }

  private createBar(name: string, x: number, y: number, w: number, h: number, color: string): pc.Entity {
    const bar = new pc.Entity(name);
    this.parent.addChild(bar);
    bar.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 1, 0, 1],
      pivot: [0, 1],
      width: w,
      height: h,
      color: new pc.Color(0.2, 0.2, 0.2, 0.8),
      useInput: false,
    });
    bar.setLocalPosition(x, -y, 0);
    return bar;
  }

  private createText(name: string, text: string, x: number, y: number, color: string, size: number): pc.Entity {
    const entity = new pc.Entity(name);
    this.parent.addChild(entity);
    entity.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 1, 0, 1],
      pivot: [0, 1],
      fontSize: size,
      text,
      color: new pc.Color(color),
      autoWidth: true,
      autoHeight: true,
    });
    entity.setLocalPosition(x, -y, 0);
    return entity;
  }

  updateHealth(health: number, maxHealth: number): void {
    const pct = health / maxHealth;
    if (this.healthBar.element) {
      this.healthBar.element.width = 200 * pct;
    }
    this.healthText.element.text = `HP: ${Math.ceil(health)}/${maxHealth}`;
  }

  updateMana(mana: number, maxMana: number): void {
    const pct = mana / maxMana;
    if (this.manaBar.element) {
      this.manaBar.element.width = 200 * pct;
    }
    this.manaText.element.text = `MP: ${Math.ceil(mana)}/${maxMana}`;
  }

  updateXP(xp: number, maxXp: number, level: number): void {
    const pct = maxXp > 0 ? xp / maxXp : 0;
    if (this.xpBar.element) {
      this.xpBar.element.width = 200 * pct;
    }
    this.levelText.element.text = `Lv.${level}`;
  }
}
