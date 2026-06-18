export class ProgressBar {
  private background: pc.Entity;
  private fill: pc.Entity;
  private label: pc.Entity;
  private maxWidth: number;

  constructor(
    parent: pc.Entity,
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string = '#2ecc71',
    bgColor: string = '#333333'
  ) {
    this.maxWidth = width;

    this.background = new pc.Entity(`${name}_BG`);
    parent.addChild(this.background);
    this.background.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 1, 0, 1],
      pivot: [0, 1],
      width,
      height,
      color: new pc.Color(bgColor),
    });
    this.background.setLocalPosition(x, -y, 0);

    this.fill = new pc.Entity(`${name}_Fill`);
    this.background.addChild(this.fill);
    this.fill.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 0, 1],
      pivot: [0, 0.5],
      width: 0,
      height,
      color: new pc.Color(fillColor),
    });

    this.label = new pc.Entity(`${name}_Label`);
    this.background.addChild(this.label);
    this.label.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      fontSize: Math.max(10, height - 4),
      text: '',
      color: new pc.Color('#ffffff'),
      autoWidth: true,
      autoHeight: true,
    });
  }

  setValue(current: number, max: number): void {
    const ratio = max > 0 ? Math.min(1, current / max) : 0;
    this.fill.element.width = this.maxWidth * ratio;
  }

  setText(text: string): void {
    this.label.element.text = text;
  }

  setColor(color: string): void {
    this.fill.element.color = new pc.Color(color);
  }

  destroy(): void {
    this.background.destroy();
  }
}
