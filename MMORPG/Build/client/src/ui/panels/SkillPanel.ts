import * as pc from 'playcanvas';

export class SkillPanel {
  entity: pc.Entity;

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('skill-panel');

    const bg = new pc.Entity('skill-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.95),
      width: 400,
      height: 350,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(bg);

    const title = new pc.Entity('skill-title');
    title.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Skills',
      color: new pc.Color(0.9, 0.9, 0.9),
      fontSize: 18,
      anchor: new pc.Vec4(0.5, 1, 0.5, 1),
      pivot: new pc.Vec2(0.5, 1),
    });
    title.setLocalPosition(0, -15, 0);
    this.entity.addChild(title);

    for (let i = 0; i < 10; i++) {
      const slot = new pc.Entity(`skill-slot-${i}`);
      slot.addComponent('element', {
        type: pc.ELEMENTTYPE_IMAGE,
        color: new pc.Color(0.15, 0.2, 0.3, 0.8),
        width: 40,
        height: 40,
        anchor: new pc.Vec4(0, 1, 0, 1),
        pivot: new pc.Vec2(0, 1),
      });
      const col = i % 5;
      const row = Math.floor(i / 5);
      slot.setLocalPosition(20 + col * 45, -50 - row * 45, 0);
      this.entity.addChild(slot);
    }

    parent.addChild(this.entity);
  }
}
