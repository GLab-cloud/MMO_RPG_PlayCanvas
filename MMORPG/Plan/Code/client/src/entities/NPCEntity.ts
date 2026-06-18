export class NPCEntity {
  private entity: pc.Entity;
  private npcId: string;
  private npcName: string;
  private interactionRange: number = 5;

  constructor(
    app: pc.Application,
    id: string,
    name: string,
    type: string,
    x: number,
    z: number
  ) {
    this.npcId = id;
    this.npcName = name;

    this.entity = new pc.Entity(`NPC_${id}`);
    this.entity.addComponent('render', { type: 'box' });
    this.entity.setLocalScale(1, 2, 1);
    this.entity.setPosition(x, 1, z);
    app.root.addChild(this.entity);

    const nameplate = new pc.Entity(`${id}_Nameplate`);
    this.entity.addChild(nameplate);
    nameplate.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0.5, 0, 0.5, 0],
      pivot: [0.5, 0],
      fontSize: 14,
      text: name,
      color: new pc.Color('#f1c40f'),
      autoWidth: true,
      autoHeight: true,
    });
    nameplate.setLocalPosition(0, 2.5, 0);
  }

  getPosition(): pc.Vec3 {
    return this.entity.getPosition();
  }

  getInteractionRange(): number {
    return this.interactionRange;
  }

  getName(): string {
    return this.npcName;
  }

  getId(): string {
    return this.npcId;
  }

  destroy(): void {
    this.entity.destroy();
  }
}
