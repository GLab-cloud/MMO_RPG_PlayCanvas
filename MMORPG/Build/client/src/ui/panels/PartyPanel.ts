import * as pc from 'playcanvas';

export class PartyPanel {
  entity: pc.Entity;

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('party-panel');

    const bg = new pc.Entity('party-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.95),
      width: 250,
      height: 300,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(bg);

    const title = new pc.Entity('party-title');
    title.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Party',
      color: new pc.Color(0.9, 0.9, 0.9),
      fontSize: 16,
      anchor: new pc.Vec4(0.5, 1, 0.5, 1),
      pivot: new pc.Vec2(0.5, 1),
    });
    title.setLocalPosition(0, -10, 0);
    this.entity.addChild(title);

    const leaveBtn = new pc.Entity('party-leave');
    leaveBtn.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Leave Party',
      color: new pc.Color(0.9, 0.3, 0.3),
      fontSize: 12,
      anchor: new pc.Vec4(0.5, 0, 0.5, 0),
      pivot: new pc.Vec2(0.5, 0),
    });
    leaveBtn.setLocalPosition(0, 15, 0);
    this.entity.addChild(leaveBtn);

    parent.addChild(this.entity);
  }
}
