export class TabList {
  private parent: pc.Entity;
  private tabs: pc.Entity[] = [];
  private tabButtons: pc.Entity[] = [];
  private activeIndex: number = 0;
  private onTabChange: (index: number) => void;

  constructor(
    parent: pc.Entity,
    tabs: string[],
    x: number,
    y: number,
    width: number,
    onTabChange: (index: number) => void
  ) {
    this.parent = parent;
    this.onTabChange = onTabChange;
    this.createTabs(tabs, x, y, width);
  }

  private createTabs(tabs: string[], startX: number, y: number, width: number): void {
    const tabWidth = width / tabs.length;

    tabs.forEach((tabName, index) => {
      const tabEntity = new pc.Entity(`Tab_${index}`);
      this.parent.addChild(tabEntity);
      tabEntity.addComponent('element', {
        type: pc.ELEMENTTYPE_IMAGE,
        anchor: [0.5, 0.5, 0.5, 0.5],
        pivot: [0.5, 0.5],
        width: tabWidth - 4,
        height: 30,
        color: index === 0 ? new pc.Color(0.3, 0.3, 0.3) : new pc.Color(0.15, 0.15, 0.15),
        useInput: true,
      });
      tabEntity.setLocalPosition(startX + tabWidth * index + tabWidth / 2, y, 0);

      const label = new pc.Entity(`TabLabel_${index}`);
      tabEntity.addChild(label);
      label.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        anchor: [0.5, 0.5, 0.5, 0.5],
        pivot: [0.5, 0.5],
        fontSize: 14,
        text: tabName,
        color: new pc.Color('#ffffff'),
        autoWidth: true,
        autoHeight: true,
      });

      tabEntity.element.on('click', () => this.selectTab(index));
      this.tabButtons.push(tabEntity);
    });
  }

  selectTab(index: number): void {
    if (index === this.activeIndex) return;
    this.activeIndex = index;

    this.tabButtons.forEach((tab, i) => {
      tab.element.color = i === index
        ? new pc.Color(0.3, 0.3, 0.3)
        : new pc.Color(0.15, 0.15, 0.15);
    });

    this.onTabChange(index);
  }

  getActiveIndex(): number {
    return this.activeIndex;
  }

  destroy(): void {
    this.tabButtons.forEach((t) => t.destroy());
  }
}
