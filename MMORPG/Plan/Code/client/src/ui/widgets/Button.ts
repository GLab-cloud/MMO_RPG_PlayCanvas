export class Button {
  private entity: pc.Entity;
  private label: pc.Entity;
  private callback: () => void;
  private isHovered = false;

  constructor(
    parent: pc.Entity,
    name: string,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    callback: () => void,
    color: string = '#3498db'
  ) {
    this.callback = callback;

    this.entity = new pc.Entity(name);
    parent.addChild(this.entity);
    this.entity.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      width,
      height,
      color: new pc.Color(color),
      useInput: true,
    });
    this.entity.setLocalPosition(x, y, 0);

    this.label = new pc.Entity(`${name}_Label`);
    this.entity.addChild(this.label);
    this.label.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      fontSize: 16,
      text,
      color: new pc.Color('#ffffff'),
      autoWidth: true,
      autoHeight: true,
    });

    this.entity.element.on('click', () => this.callback());
    this.entity.element.on('mouseenter', () => this.onHover(true));
    this.entity.element.on('mouseleave', () => this.onHover(false));
  }

  private onHover(hovered: boolean): void {
    this.isHovered = hovered;
    if (this.entity.element) {
      const c = this.entity.element.color;
      this.entity.element.color = hovered
        ? new pc.Color(c.r * 0.8, c.g * 0.8, c.b * 0.8)
        : c;
    }
  }

  setText(text: string): void {
    this.label.element.text = text;
  }

  setEnabled(enabled: boolean): void {
    this.entity.enabled = enabled;
  }

  destroy(): void {
    this.entity.destroy();
  }
}
