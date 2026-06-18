import * as pc from 'playcanvas';

export class LobbyPanel {
  entity: pc.Entity;

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('lobby-panel');

    const bg = new pc.Entity('lobby-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.95),
      width: 800,
      height: 600,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(bg);

    const title = new pc.Entity('lobby-title');
    title.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Select Character',
      color: new pc.Color(0.9, 0.9, 0.9),
      fontSize: 24,
      anchor: new pc.Vec4(0.5, 1, 0.5, 1),
      pivot: new pc.Vec2(0.5, 1),
    });
    title.setLocalPosition(0, -20, 0);
    this.entity.addChild(title);

    for (let i = 0; i < 4; i++) {
      const slot = new pc.Entity(`lobby-character-${i}`);
      slot.addComponent('element', {
        type: pc.ELEMENTTYPE_IMAGE,
        color: new pc.Color(0.15, 0.2, 0.3, 0.8),
        width: 160,
        height: 200,
        anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
        pivot: new pc.Vec2(0.5, 0.5),
      });
      const col = i % 2;
      const row = Math.floor(i / 2);
      slot.setLocalPosition(-100 + col * 180, 100 - row * 220, 0);
      this.entity.addChild(slot);
    }

    const createBtn = new pc.Entity('lobby-create');
    createBtn.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Create Character',
      color: new pc.Color(0.4, 0.7, 1),
      fontSize: 14,
      anchor: new pc.Vec4(0.5, 0, 0.5, 0),
      pivot: new pc.Vec2(0.5, 0),
    });
    createBtn.setLocalPosition(0, 20, 0);
    this.entity.addChild(createBtn);

    parent.addChild(this.entity);
  }
}
