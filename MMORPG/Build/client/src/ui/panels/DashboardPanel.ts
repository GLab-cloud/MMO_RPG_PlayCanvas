import * as pc from 'playcanvas';

export class DashboardPanel {
  entity: pc.Entity;

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('dashboard-panel');

    const bg = new pc.Entity('dash-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.95),
      width: 600,
      height: 450,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(bg);

    const title = new pc.Entity('dash-title');
    title.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Dashboard',
      color: new pc.Color(0.9, 0.9, 0.9),
      fontSize: 20,
      anchor: new pc.Vec4(0.5, 1, 0.5, 1),
      pivot: new pc.Vec2(0.5, 1),
    });
    title.setLocalPosition(0, -15, 0);
    this.entity.addChild(title);

    const statsLabels = ['Kills', 'Deaths', 'Quests Done', 'Play Time', 'Gold Earned'];
    for (let i = 0; i < statsLabels.length; i++) {
      const label = new pc.Entity(`dash-stat-${i}`);
      label.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        text: `${statsLabels[i]}: 0`,
        color: new pc.Color(0.8, 0.8, 0.8),
        fontSize: 13,
        anchor: new pc.Vec4(0, 1, 0, 1),
        pivot: new pc.Vec2(0, 1),
      });
      label.setLocalPosition(-270, -50 - i * 25, 0);
      this.entity.addChild(label);
    }

    parent.addChild(this.entity);
  }
}
