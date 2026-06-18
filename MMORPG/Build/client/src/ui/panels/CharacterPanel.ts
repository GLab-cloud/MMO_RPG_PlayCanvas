import * as pc from 'playcanvas';

export class CharacterPanel {
  entity: pc.Entity;

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('character-panel');

    const bg = new pc.Entity('char-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.95),
      width: 350,
      height: 450,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(bg);

    const stats = ['STR', 'STA', 'DEX', 'INT', 'SPR'];
    for (let i = 0; i < stats.length; i++) {
      const statText = new pc.Entity(`stat-${stats[i]}`);
      statText.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        text: `${stats[i]}: 10`,
        color: new pc.Color(0.9, 0.9, 0.9),
        fontSize: 14,
        anchor: new pc.Vec4(0, 0.5, 0, 0.5),
        pivot: new pc.Vec2(0, 0.5),
      });
      statText.setLocalPosition(-150, 150 - i * 30, 0);
      this.entity.addChild(statText);
    }

    const classText = new pc.Entity('char-class');
    classText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Class: Beginner',
      color: new pc.Color(0.6, 0.8, 1),
      fontSize: 16,
      anchor: new pc.Vec4(0, 1, 0, 1),
      pivot: new pc.Vec2(0, 1),
    });
    classText.setLocalPosition(-160, -15, 0);
    this.entity.addChild(classText);

    parent.addChild(this.entity);
  }
}
