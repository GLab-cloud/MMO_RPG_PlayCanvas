import * as pc from 'playcanvas';
import { HUDPanel } from './panels/HUDPanel';
import { InventoryPanel } from './panels/InventoryPanel';
import { CharacterPanel } from './panels/CharacterPanel';
import { ChatPanel } from './panels/ChatPanel';
import { SkillPanel } from './panels/SkillPanel';
import { PartyPanel } from './panels/PartyPanel';
import { QuestPanel } from './panels/QuestPanel';
import { ShopPanel } from './panels/ShopPanel';
import { TradePanel } from './panels/TradePanel';
import { LobbyPanel } from './panels/LobbyPanel';
import { DashboardPanel } from './panels/DashboardPanel';
import { SettingsPanel } from './panels/SettingsPanel';

type PanelName = 'hud' | 'inventory' | 'character' | 'chat' | 'skills' | 'party' | 'quests' | 'shop' | 'trade' | 'lobby' | 'dashboard' | 'settings';

export class UIManager {
  private app: pc.Application;
  private screen: pc.Entity;
  private panels: Map<PanelName, pc.Entity> = new Map();
  private panelInstances: Record<string, unknown> = {};

  constructor(app: pc.Application) {
    this.app = app;
    this.screen = new pc.Entity('ui-screen');
    this.screen.addComponent('screen', {
      screenSpace: true,
      scaleMode: pc.SCALEMODE_BLEND,
      resolution: new pc.Vec2(1920, 1080),
    });
    app.root.addChild(this.screen);

    this.registerPanel('hud', () => new HUDPanel(this.screen));
    this.registerPanel('inventory', () => new InventoryPanel(this.screen));
    this.registerPanel('character', () => new CharacterPanel(this.screen));
    this.registerPanel('chat', () => new ChatPanel(this.screen));
    this.registerPanel('skills', () => new SkillPanel(this.screen));
    this.registerPanel('party', () => new PartyPanel(this.screen));
    this.registerPanel('quests', () => new QuestPanel(this.screen));
    this.registerPanel('shop', () => new ShopPanel(this.screen));
    this.registerPanel('trade', () => new TradePanel(this.screen));
    this.registerPanel('lobby', () => new LobbyPanel(this.screen));
    this.registerPanel('dashboard', () => new DashboardPanel(this.screen));
    this.registerPanel('settings', () => new SettingsPanel(this.screen));
  }

  private registerPanel(name: PanelName, factory: () => { entity: pc.Entity }): void {
    const instance = factory();
    this.panels.set(name, instance.entity);
    this.panelInstances[name] = instance;
    instance.entity.enabled = false;
  }

  init(): void {
    this.showPanel('hud');
    this.showPanel('chat');
  }

  showPanel(name: PanelName): void {
    this.panels.get(name)!.enabled = true;
  }

  hidePanel(name: PanelName): void {
    this.panels.get(name)!.enabled = false;
  }

  togglePanel(name: PanelName): void {
    const panel = this.panels.get(name)!;
    panel.enabled = !panel.enabled;
  }
}
