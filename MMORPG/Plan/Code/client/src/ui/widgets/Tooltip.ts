export class Tooltip {
  private entity: pc.Entity;
  private text: pc.Entity;
  private isVisible = false;

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('Tooltip');
    parent.addChild(this.entity);
    this.entity.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      width: 200,
      height: 100,
      color: new pc.Color(0.1, 0.1, 0.1, 0.9),
    });

    this.text = new pc.Entity('TooltipText');
    this.entity.addChild(this.text);
    this.text.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 1, 0, 1],
      pivot: [0, 1],
      fontSize: 12,
      text: '',
      color: new pc.Color('#ffffff'),
      autoWidth: true,
      autoHeight: true,
    });
    this.text.setLocalPosition(5, -5, 0);

    this.hide();
  }

  show(content: string, x: number, y: number): void {
    this.text.element.text = content;
    this.entity.setLocalPosition(x, y, 0);
    this.entity.enabled = true;
    this.isVisible = true;
  }

  hide(): void {
    this.entity.enabled = false;
    this.isVisible = false;
  }

  isShown(): boolean {
    return this.isVisible;
  }

  destroy(): void {
    this.entity.destroy();
  }
}
