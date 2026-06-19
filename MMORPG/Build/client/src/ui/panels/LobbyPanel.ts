import * as pc from 'playcanvas';
import { MatchInfo } from '../../network/NetworkManager';
import { TextRenderer } from '../utils/TextRenderer';

interface LobbyCallbacks {
  onCreateMatch(name: string, map: string, maxPlayers: number): void;
  onJoinMatch(matchId: string): void;
  onLeaveMatch(matchId: string): void;
  onStartMatch(matchId: string): void;
  onExitGame(): void;
}

const C = {
  bg: new pc.Color(0.04, 0.06, 0.12, 1),
  panelBg: new pc.Color(0.07, 0.09, 0.16, 0.95),
  panelBorder: new pc.Color(0.15, 0.18, 0.28, 1),
  accent: new pc.Color(0.2, 0.5, 0.9, 1),
  accentHover: new pc.Color(0.3, 0.6, 1, 1),
  accentPressed: new pc.Color(0.1, 0.35, 0.7, 1),
  danger: new pc.Color(0.7, 0.15, 0.15, 1),
  dangerHover: new pc.Color(0.85, 0.2, 0.2, 1),
  success: new pc.Color(0.15, 0.6, 0.25, 1),
  successHover: new pc.Color(0.2, 0.75, 0.3, 1),
  textPrimary: new pc.Color(0.92, 0.93, 0.95, 1),
  textSecondary: new pc.Color(0.55, 0.6, 0.7, 1),
  textAccent: new pc.Color(0.4, 0.7, 1, 1),
  slotBg: new pc.Color(0.1, 0.13, 0.22, 0.8),
  slotHover: new pc.Color(0.15, 0.2, 0.32, 0.9),
  logoColor: new pc.Color(0.35, 0.65, 1, 1),
  subtitleColor: new pc.Color(0.55, 0.6, 0.7, 1),
  statColor: new pc.Color(0.3, 0.85, 0.4, 1),
};

function setCol(e: pc.Entity, c: pc.Color): void {
  if (e.element) e.element.color = c;
}

export class LobbyPanel {
  entity: pc.Entity;
  private callbacks: LobbyCallbacks | null = null;
  private matches: MatchInfo[] = [];
  private myMatchId: string | null = null;
  private text: TextRenderer;
  private matchRows: pc.Entity[] = [];
  private createBtn!: pc.Entity;
  private exitBtn!: pc.Entity;
  private matchListContainer!: pc.Entity;

  constructor(app: pc.Application, parent: pc.Entity) {
    this.text = new TextRenderer(app);
    this.entity = new pc.Entity('lobby-panel');
    this.entity.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: C.bg,
      anchor: new pc.Vec4(0, 0, 1, 1),
      pivot: new pc.Vec2(0, 0),
    });
    parent.addChild(this.entity);

    this.buildBackground();
    this.buildHeader();
    this.buildMatchListPanel();
    this.buildActionsPanel();
  }

  private buildBackground(): void {
    const grid = new pc.Entity('lobby-grid');
    grid.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.06, 0.09, 0.16, 0.3),
      anchor: new pc.Vec4(0, 0, 1, 1),
      pivot: new pc.Vec2(0, 0),
      rect: new pc.Vec4(0, 0, 1, 1),
    });
    this.entity.addChild(grid);
  }

  private buildHeader(): void {
    this.text.createText('FLYFF', 48, C.logoColor, this.entity, 0, 400);
    this.text.createText('GAME LOBBY', 16, C.subtitleColor, this.entity, 0, 365);
  }

  private buildMatchListPanel(): void {
    const listX = -320;
    const listW = 540;
    const listH = 460;
    const listY = 220;

    const panel = new pc.Entity('lobby-list-panel');
    panel.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: C.panelBg,
      width: listW,
      height: listH,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    panel.setLocalPosition(listX, listY, 0);
    this.entity.addChild(panel);

    const border = new pc.Entity('lobby-list-border');
    border.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: C.panelBorder,
      width: listW + 2,
      height: listH + 2,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    border.setLocalPosition(0, 0, 0.1);
    panel.addChild(border);

    const header = new pc.Entity('lobby-list-header');
    header.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.1, 0.13, 0.22, 1),
      width: listW - 4,
      height: 38,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    header.setLocalPosition(0, listH / 2 - 23, 0.2);
    panel.addChild(header);

    this.text.createText('AVAILABLE MATCHES', 13, C.textSecondary, panel, 0, listH / 2 - 16);

    this.matchListContainer = new pc.Entity('lobby-matches');
    this.matchListContainer.setLocalPosition(0, 0, 0);
    panel.addChild(this.matchListContainer);

    for (let i = 0; i < 6; i++) {
      const row = this.createMatchRow(i);
      this.matchRows.push(row);
      this.matchListContainer.addChild(row);
    }
  }

  private createMatchRow(index: number): pc.Entity {
    const listW = 540;
    const rowW = listW - 20;
    const rowH = 52;
    const startY = 80;
    const gap = 8;
    const y = startY - index * (rowH + gap);

    const row = new pc.Entity(`match-row-${index}`);
    row.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(C.slotBg.r, C.slotBg.g, C.slotBg.b, C.slotBg.a),
      width: rowW,
      height: rowH,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    row.setLocalPosition(0, y, 0.3);
    row.enabled = false;

    // Hover effects
    const originalColor = new pc.Color(C.slotBg.r, C.slotBg.g, C.slotBg.b, C.slotBg.a);
    const hoverColor = new pc.Color(C.slotHover.r, C.slotHover.g, C.slotHover.b, C.slotHover.a);

    row.on('mouseenter', () => {
      if (row.element) row.element.color = hoverColor;
    });
    row.on('mouseleave', () => {
      if (row.element) row.element.color = originalColor;
    });

    return row;
  }

  private buildActionsPanel(): void {
    const actX = 340;
    const actW = 300;
    const actH = 460;
    const actY = 220;

    const panel = new pc.Entity('lobby-actions-panel');
    panel.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: C.panelBg,
      width: actW,
      height: actH,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    panel.setLocalPosition(actX, actY, 0);
    this.entity.addChild(panel);

    const border = new pc.Entity('lobby-actions-border');
    border.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: C.panelBorder,
      width: actW + 2,
      height: actH + 2,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    border.setLocalPosition(0, 0, 0.1);
    panel.addChild(border);

    this.text.createText('CREATE NEW MATCH', 14, C.textSecondary, panel, 0, actH / 2 - 28);

    this.text.createText('Match Name', 11, C.textSecondary, panel, 0, actH / 2 - 68);
    const nameBg = new pc.Entity('lobby-name-bg');
    nameBg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.05, 0.07, 0.14, 1),
      width: actW - 40,
      height: 32,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    nameBg.setLocalPosition(0, actH / 2 - 98, 0);
    panel.addChild(nameBg);

    const nameBorder = new pc.Entity('lobby-name-border');
    nameBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: C.panelBorder,
      width: actW - 38,
      height: 34,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    nameBorder.setLocalPosition(0, actH / 2 - 98, -0.1);
    panel.addChild(nameBorder);

    this.text.createText('My Match', 13, C.textPrimary, panel, 0, actH / 2 - 94);

    this.text.createText('Map', 11, C.textSecondary, panel, 0, actH / 2 - 138);
    const mapBg = new pc.Entity('lobby-map-bg');
    mapBg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.05, 0.07, 0.14, 1),
      width: actW - 40,
      height: 32,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    mapBg.setLocalPosition(0, actH / 2 - 168, 0);
    panel.addChild(mapBg);

    const mapBorder = new pc.Entity('lobby-map-border');
    mapBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: C.panelBorder,
      width: actW - 38,
      height: 34,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    mapBorder.setLocalPosition(0, actH / 2 - 168, -0.1);
    panel.addChild(mapBorder);

    this.text.createText('Flarine', 13, C.textPrimary, panel, 0, actH / 2 - 164);

    this.text.createText('Max Players', 11, C.textSecondary, panel, 0, actH / 2 - 208);
    const maxBg = new pc.Entity('lobby-max-bg');
    maxBg.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.05, 0.07, 0.14, 1),
      width: actW - 40,
      height: 32,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    maxBg.setLocalPosition(0, actH / 2 - 238, 0);
    panel.addChild(maxBg);

    const maxBorder = new pc.Entity('lobby-max-border');
    maxBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: C.panelBorder,
      width: actW - 38,
      height: 34,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    maxBorder.setLocalPosition(0, actH / 2 - 238, -0.1);
    panel.addChild(maxBorder);

    this.text.createText('4', 13, C.textPrimary, panel, 0, actH / 2 - 234);

    const btnW = actW - 40;

    this.createBtn = this.makeButton('CREATE MATCH', btnW, 40, C.success, C.successHover, panel, 0, actH / 2 - 295);
    this.createBtn.on('click', () => this.callbacks?.onCreateMatch('My Match', 'Flarine', 4));

    const spacer = actY - actH / 2;

    this.exitBtn = this.makeButton('EXIT GAME', btnW, 40, C.danger, C.dangerHover, panel, 0, actH / 2 - 355);
    this.exitBtn.on('click', () => this.callbacks?.onExitGame());
  }

  private makeButton(label: string, w: number, h: number, normal: pc.Color, hover: pc.Color, parent: pc.Entity, x: number, y: number): pc.Entity {
    const btn = new pc.Entity('btn-' + label.substring(0, 4));
    btn.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(normal.r, normal.g, normal.b, normal.a),
      width: w,
      height: h,
      useInput: true,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    btn.setLocalPosition(x, y, 0);
    parent.addChild(btn);

    this.text.createText(label, Math.min(14, h - 12), C.textPrimary, btn, 0, 0);

    // Hover effects
    btn.on('mouseenter', () => {
      btn.element!.color = new pc.Color(hover.r, hover.g, hover.b, hover.a);
    });
    btn.on('mouseleave', () => {
      btn.element!.color = new pc.Color(normal.r, normal.g, normal.b, normal.a);
    });

    return btn;
  }

  setCallbacks(cb: LobbyCallbacks): void { this.callbacks = cb; }
  setMyMatchId(id: string | null): void { this.myMatchId = id; }

  updateMatchList(matches: MatchInfo[]): void {
    this.matches = matches;
    this.renderMatchList();
  }

  private renderMatchList(): void {
    const maxRows = this.matchRows.length;
    for (let i = 0; i < maxRows; i++) {
      const row = this.matchRows[i];
      const match = this.matches[i];
      if (match) {
        row.enabled = true;
        this.populateMatchRow(row, match);
      } else {
        row.enabled = false;
      }
    }
  }

  private populateMatchRow(row: pc.Entity, match: MatchInfo): void {
    const rowW = 520;
    const rowH = 52;

    const existingChildren = row.children.length;
    if (existingChildren > 0) {
      for (let i = row.children.length - 1; i >= 0; i--) {
        row.removeChild(row.children[i]);
        row.children[i].destroy();
      }
    }

    const leftX = -(rowW / 2) + 12;
    const nameSize = Math.min(13, rowH * 0.26);
    this.text.createText(match.name, nameSize, C.textPrimary, row, leftX + 70, 8);
    this.text.createText(`${match.playerCount}/${match.maxPlayers} players`, 10, C.statColor, row, leftX + 70, -8);

    const icon = new pc.Entity('match-dot');
    icon.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: match.playerCount < match.maxPlayers ? C.statColor : C.accent,
      width: 8,
      height: 8,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    icon.setLocalPosition(leftX, 0, 0);
    row.addChild(icon);

    const smallLabel = 10;
    const btnY = 0;
    const btnH = 26;
    const btnW2 = 54;

    if (this.myMatchId === match.id) {
      const startBtn = this.makeButton('START', btnW2, btnH, C.success, C.successHover, row, rowW / 2 - btnW2 * 3 - 8, btnY);
      startBtn.on('click', () => this.callbacks?.onStartMatch(match.id));

      const leaveBtn = this.makeButton('LEAVE', btnW2, btnH, C.danger, C.dangerHover, row, rowW / 2 - btnW2 * 2 - 4, btnY);
      leaveBtn.on('click', () => this.callbacks?.onLeaveMatch(match.id));
    } else if (this.myMatchId === null) {
      const joinBtn = this.makeButton('JOIN', btnW2, btnH, C.accent, C.accentHover, row, rowW / 2 - btnW2 - 0, btnY);
      joinBtn.on('click', () => this.callbacks?.onJoinMatch(match.id));
    }

    this.text.createText(match.map || 'Flarine', 10, C.textSecondary, row, leftX + 70, -20);
  }
}
