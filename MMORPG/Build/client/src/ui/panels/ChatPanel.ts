import * as pc from 'playcanvas';

export class ChatPanel {
  entity: pc.Entity;
  private messages: pc.Entity[] = [];

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('chat-panel');

    const bg = new pc.Entity('chat-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.85),
      width: 400,
      height: 200,
      anchor: new pc.Vec4(0, 0, 0, 0),
      pivot: new pc.Vec2(0, 0),
    });
    bg.setLocalPosition(10, 10, 0);
    this.entity.addChild(bg);

    const input = new pc.Entity('chat-input');
    input.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: '',
      color: new pc.Color(1, 1, 1),
      fontSize: 12,
      anchor: new pc.Vec4(0, 0, 0, 0),
      pivot: new pc.Vec2(0, 0),
    });
    input.setLocalPosition(15, 15, 0.1);
    this.entity.addChild(input);

    const tabs = ['General', 'Party', 'Guild', 'Whisper', 'World'];
    for (let i = 0; i < tabs.length; i++) {
      const tab = new pc.Entity(`chat-tab-${tabs[i]}`);
      tab.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        text: tabs[i],
        color: new pc.Color(0.7, 0.7, 0.7),
        fontSize: 11,
        anchor: new pc.Vec4(0, 1, 0, 1),
        pivot: new pc.Vec2(0, 1),
      });
      tab.setLocalPosition(15 + i * 60, -5, 0.1);
      this.entity.addChild(tab);
    }

    parent.addChild(this.entity);
  }

  addMessage(_text: string): void {
    if (this.messages.length >= 100) {
      const old = this.messages.shift();
      if (old) old.destroy();
    }
  }
}
