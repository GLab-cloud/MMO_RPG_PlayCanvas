import * as pc from 'playcanvas';

export class TradePanel {
  entity: pc.Entity;

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('trade-panel');

    const bg = new pc.Entity('trade-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.95),
      width: 500,
      height: 350,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(bg);

    const yourPanel = new pc.Entity('trade-your');
    yourPanel.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.12, 0.16, 0.25, 0.8),
      width: 220,
      height: 250,
      anchor: new pc.Vec4(0, 0.5, 0, 0.5),
      pivot: new pc.Vec2(0, 0.5),
    });
    yourPanel.setLocalPosition(-240, 0, 0);
    this.entity.addChild(yourPanel);

    const theirPanel = new pc.Entity('trade-their');
    theirPanel.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.12, 0.16, 0.25, 0.8),
      width: 220,
      height: 250,
      anchor: new pc.Vec4(1, 0.5, 1, 0.5),
      pivot: new pc.Vec2(1, 0.5),
    });
    theirPanel.setLocalPosition(240, 0, 0);
    this.entity.addChild(theirPanel);

    const confirmBtn = new pc.Entity('trade-confirm');
    confirmBtn.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Confirm',
      color: new pc.Color(0.2, 0.8, 0.3),
      fontSize: 14,
      anchor: new pc.Vec4(0.5, 0, 0.5, 0),
      pivot: new pc.Vec2(0.5, 0),
    });
    confirmBtn.setLocalPosition(0, 15, 0);
    this.entity.addChild(confirmBtn);

    parent.addChild(this.entity);
  }
}
