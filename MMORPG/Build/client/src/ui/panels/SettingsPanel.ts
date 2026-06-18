import * as pc from 'playcanvas';

export class SettingsPanel {
  entity: pc.Entity;

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('settings-panel');

    const bg = new pc.Entity('settings-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.95),
      width: 400,
      height: 350,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(bg);

    const title = new pc.Entity('settings-title');
    title.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Settings',
      color: new pc.Color(0.9, 0.9, 0.9),
      fontSize: 18,
      anchor: new pc.Vec4(0.5, 1, 0.5, 1),
      pivot: new pc.Vec2(0.5, 1),
    });
    title.setLocalPosition(0, -15, 0);
    this.entity.addChild(title);

    const categories = ['Graphics Quality', 'Master Volume', 'Camera Sensitivity', 'Mouse Sensitivity'];
    for (let i = 0; i < categories.length; i++) {
      const label = new pc.Entity(`setting-${i}`);
      label.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        text: `${categories[i]}: Medium`,
        color: new pc.Color(0.8, 0.8, 0.8),
        fontSize: 13,
        anchor: new pc.Vec4(0, 1, 0, 1),
        pivot: new pc.Vec2(0, 1),
      });
      label.setLocalPosition(-170, -50 - i * 35, 0);
      this.entity.addChild(label);
    }

    parent.addChild(this.entity);
  }
}
