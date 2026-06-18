import * as pc from 'playcanvas';

export class HUDPanel {
  entity: pc.Entity;

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('hud-panel');

    const hpBar = this.createBar('hp-bar', -400, 300, 200, 16, new pc.Color(0.9, 0.2, 0.2));
    this.entity.addChild(hpBar);

    const mpBar = this.createBar('mp-bar', -400, 278, 200, 12, new pc.Color(0.2, 0.4, 0.9));
    this.entity.addChild(mpBar);

    const xpBar = this.createBar('xp-bar', -400, 256, 200, 10, new pc.Color(0.2, 0.8, 0.3));
    this.entity.addChild(xpBar);

    const levelText = new pc.Entity('level-text');
    levelText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Lv.1',
      color: new pc.Color(1, 1, 1),
      fontSize: 14,
      anchor: new pc.Vec4(0, 0.5, 0, 0.5),
      pivot: new pc.Vec2(0, 0.5),
    });
    levelText.setLocalPosition(-410, 290, 0);
    this.entity.addChild(levelText);

    for (let i = 0; i < 10; i++) {
      const slot = this.createSkillSlot(i);
      this.entity.addChild(slot);
    }

    const minimap = new pc.Entity('minimap');
    minimap.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.1, 0.1, 0.2, 0.7),
      width: 150,
      height: 150,
      anchor: new pc.Vec4(1, 1, 1, 1),
      pivot: new pc.Vec2(1, 1),
    });
    minimap.setLocalPosition(-10, -10, 0);
    this.entity.addChild(minimap);

    parent.addChild(this.entity);
  }

  private createBar(name: string, x: number, y: number, w: number, h: number, color: pc.Color): pc.Entity {
    const bar = new pc.Entity(name);
    bar.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.2, 0.2, 0.2, 0.8),
      width: w,
      height: h,
      anchor: new pc.Vec4(0, 0.5, 0, 0.5),
      pivot: new pc.Vec2(0, 0.5),
    });
    bar.setLocalPosition(x, y, 0);

    const fill = new pc.Entity(`${name}-fill`);
    fill.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: color,
      width: w - 4,
      height: h - 4,
      anchor: new pc.Vec4(0, 0.5, 0, 0.5),
      pivot: new pc.Vec2(0, 0.5),
    });
    fill.setLocalPosition(2, 0, 0.1);
    bar.addChild(fill);

    return bar;
  }

  private createSkillSlot(index: number): pc.Entity {
    const slot = new pc.Entity(`skill-slot-${index}`);
    slot.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.2, 0.2, 0.2, 0.7),
      width: 36,
      height: 36,
      anchor: new pc.Vec4(0.5, 0, 0.5, 0),
      pivot: new pc.Vec2(0.5, 0),
    });
    slot.setLocalPosition(-180 + index * 40, 10, 0);

    const label = new pc.Entity(`skill-label-${index}`);
    label.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: String(index + 1),
      color: new pc.Color(0.8, 0.8, 0.8),
      fontSize: 10,
      anchor: new pc.Vec4(0.5, 0, 0.5, 0),
      pivot: new pc.Vec2(0.5, 0),
    });
    label.setLocalPosition(0, 1, 0.1);
    slot.addChild(label);

    return slot;
  }
}
