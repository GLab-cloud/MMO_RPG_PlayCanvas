import * as pc from 'playcanvas';

export class QuestPanel {
  entity: pc.Entity;

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('quest-panel');

    const bg = new pc.Entity('quest-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.95),
      width: 400,
      height: 350,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(bg);

    const title = new pc.Entity('quest-title');
    title.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Quests',
      color: new pc.Color(0.9, 0.9, 0.9),
      fontSize: 18,
      anchor: new pc.Vec4(0.5, 1, 0.5, 1),
      pivot: new pc.Vec2(0.5, 1),
    });
    title.setLocalPosition(0, -15, 0);
    this.entity.addChild(title);

    const emptyText = new pc.Entity('quest-empty');
    emptyText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'No active quests',
      color: new pc.Color(0.5, 0.5, 0.5),
      fontSize: 14,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(emptyText);

    parent.addChild(this.entity);
  }
}
