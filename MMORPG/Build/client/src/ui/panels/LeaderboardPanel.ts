import * as pc from 'playcanvas';

interface LeaderboardEntry {
  rank: number;
  name: string;
  level: number;
  value: number;
}

export class LeaderboardPanel {
  entity: pc.Entity;
  private entries: pc.Entity[] = [];
  private currentType: string = 'score';
  private tabButtons: pc.Entity[] = [];

  constructor(parent: pc.Entity) {
    this.entity = new pc.Entity('leaderboard-panel');

    const bg = new pc.Entity('lb-bg');
    bg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.08, 0.12, 0.2, 0.95),
      width: 450,
      height: 500,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    this.entity.addChild(bg);

    const title = new pc.Entity('lb-title');
    title.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Leaderboard',
      color: new pc.Color(1, 0.85, 0),
      fontSize: 22,
      anchor: new pc.Vec4(0.5, 1, 0.5, 1),
      pivot: new pc.Vec2(0.5, 1),
    });
    title.setLocalPosition(0, -15, 0);
    this.entity.addChild(title);

    const tabs = ['Score', 'Level', 'PvP', 'Kills'];
    const tabColors = [new pc.Color(0.9, 0.85, 0.1), new pc.Color(0.2, 0.8, 0.3), new pc.Color(0.9, 0.2, 0.2), new pc.Color(0.8, 0.5, 0.2)];
    for (let i = 0; i < tabs.length; i++) {
      const tab = new pc.Entity(`lb-tab-${i}`);
      tab.addComponent('element', {
        type: pc.ELEMENTTYPE_IMAGE,
        color: new pc.Color(0.15, 0.2, 0.3, 0.8),
        width: 100,
        height: 28,
        anchor: new pc.Vec4(0, 1, 0, 1),
        pivot: new pc.Vec2(0, 1),
      });
      tab.setLocalPosition(-210 + i * 105, -45, 0);
      const tabText = new pc.Entity(`lb-tab-text-${i}`);
      tabText.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        text: tabs[i],
        color: tabColors[i],
        fontSize: 12,
        anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
        pivot: new pc.Vec2(0.5, 0.5),
      });
      tab.addChild(tabText);
      tab.element!.on('click', () => this.switchTab(tabs[i].toLowerCase()));
      this.entity.addChild(tab);
      this.tabButtons.push(tab);
    }

    const headerText = new pc.Entity('lb-header');
    headerText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: '#  Name                  Score',
      color: new pc.Color(0.7, 0.7, 0.9),
      fontSize: 11,
      anchor: new pc.Vec4(0, 1, 0, 1),
      pivot: new pc.Vec2(0, 1),
    });
    headerText.setLocalPosition(-200, -80, 0);
    this.entity.addChild(headerText);

    for (let i = 0; i < 15; i++) {
      const entry = new pc.Entity(`lb-entry-${i}`);
      entry.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        text: '',
        color: new pc.Color(0.8, 0.8, 0.8),
        fontSize: 12,
        anchor: new pc.Vec4(0, 1, 0, 1),
        pivot: new pc.Vec2(0, 1),
      });
      entry.setLocalPosition(-200, -100 - i * 22, 0);
      this.entity.addChild(entry);
      this.entries.push(entry);
    }

    const closeBtn = new pc.Entity('lb-close');
    closeBtn.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.4, 0.1, 0.1, 0.8),
      width: 60,
      height: 24,
      anchor: new pc.Vec4(0.5, 0, 0.5, 0),
      pivot: new pc.Vec2(0.5, 0),
    });
    closeBtn.setLocalPosition(0, 10, 0);
    const closeText = new pc.Entity('lb-close-text');
    closeText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'Close',
      color: new pc.Color(1, 1, 1),
      fontSize: 12,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    closeBtn.addChild(closeText);
    this.entity.addChild(closeBtn);

    parent.addChild(this.entity);
  }

  private switchTab(type: string): void {
    this.currentType = type;
    const urlMap: Record<string, string> = {
      score: 'score',
      level: 'level',
      pvp: 'pvp',
      kills: 'kills',
    };
    const endpoint = urlMap[type] || 'score';
    fetch(`/api/leaderboard/${endpoint}`)
      .then(r => r.json())
      .then(data => this.updateEntries(data))
      .catch(() => {});
  }

  updateEntries(entries: LeaderboardEntry[]): void {
    const typeLabel = this.currentType === 'level' ? 'Level' :
      this.currentType === 'pvp' ? 'PvP' :
      this.currentType === 'kills' ? 'Kills' : 'Score';

    for (let i = 0; i < this.entries.length; i++) {
      const entry = entries[i];
      if (entry) {
        const rankColor = entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : '#ccc';
        this.entries[i].element!.text =
          `${String(entry.rank).padStart(2, ' ')}. ${entry.name.padEnd(22, ' ')} ${typeLabel}: ${entry.value}`;
        this.entries[i].element!.color = new pc.Color().fromString(rankColor);
      } else {
        this.entries[i].element!.text = '';
      }
    }
  }

  refresh(): void {
    this.switchTab(this.currentType);
  }
}
