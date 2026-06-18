import * as pc from 'playcanvas';

export class InventoryPanel {
  entity: pc.Entity;
  private slotEntities: pc.Entity[] = [];

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('inventory-panel');

    const bg = new pc.Entity('inv-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.95),
      width: 450,
      height: 500,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(bg);

    const goldText = new pc.Entity('inv-gold');
    goldText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Gold: 0',
      color: new pc.Color(1, 0.85, 0),
      fontSize: 14,
      anchor: new pc.Vec4(0, 1, 0, 1),
      pivot: new pc.Vec2(0, 1),
    });
    goldText.setLocalPosition(-200, -15, 0);
    this.entity.addChild(goldText);

    for (let i = 0; i < 54; i++) {
      const slot = new pc.Entity(`inv-slot-${i}`);
      slot.addComponent('element', {
        type: pc.ELEMENTTYPE_IMAGE,
        color: new pc.Color(0.15, 0.2, 0.3, 0.8),
        width: 48,
        height: 48,
        anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
        pivot: new pc.Vec2(0.5, 0.5),
      });
      const col = i % 6;
      const row = Math.floor(i / 6);
      slot.setLocalPosition(-180 + col * 52, 210 - row * 52, 0);
      this.entity.addChild(slot);
      this.slotEntities.push(slot);
    }

    parent.addChild(this.entity);
  }
}
