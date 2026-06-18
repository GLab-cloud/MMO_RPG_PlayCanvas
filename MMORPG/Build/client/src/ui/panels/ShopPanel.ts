import * as pc from 'playcanvas';

export class ShopPanel {
  entity: pc.Entity;

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('shop-panel');

    const bg = new pc.Entity('shop-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.95),
      width: 500,
      height: 400,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(bg);

    const buyTab = new pc.Entity('shop-buy-tab');
    buyTab.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Buy',
      color: new pc.Color(0.9, 0.9, 0.9),
      fontSize: 14,
      anchor: new pc.Vec4(0, 1, 0, 1),
      pivot: new pc.Vec2(0, 1),
    });
    buyTab.setLocalPosition(-230, -15, 0);
    this.entity.addChild(buyTab);

    const sellTab = new pc.Entity('shop-sell-tab');
    sellTab.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Sell',
      color: new pc.Color(0.6, 0.6, 0.6),
      fontSize: 14,
      anchor: new pc.Vec4(0, 1, 0, 1),
      pivot: new pc.Vec2(0, 1),
    });
    sellTab.setLocalPosition(-180, -15, 0);
    this.entity.addChild(sellTab);

    parent.addChild(this.entity);
  }
}
