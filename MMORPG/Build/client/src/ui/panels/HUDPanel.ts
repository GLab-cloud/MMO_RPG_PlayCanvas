import * as pc from 'playcanvas';

export class HUDPanel {
  entity: pc.Entity;
  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('hud-panel');
    parent.addChild(this.entity);
  }
  updateStats(_hp: number, _maxHp: number, _mp: number, _maxMp: number, _xp: number, _xpNext: number, _level: number, _atk: number, _def: number): void {
  }
}
