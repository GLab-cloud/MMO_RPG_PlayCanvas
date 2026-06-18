import { HUDPanel } from './panels/HUDPanel.js';
import { InventoryPanel } from './panels/InventoryPanel.js';
import { CharacterPanel } from './panels/CharacterPanel.js';
import { ChatPanel } from './panels/ChatPanel.js';
import { SkillPanel } from './panels/SkillPanel.js';
import { PartyPanel } from './panels/PartyPanel.js';
import { QuestPanel } from './panels/QuestPanel.js';
import { ShopPanel } from './panels/ShopPanel.js';
import { TradePanel } from './panels/TradePanel.js';
import { LobbyPanel } from './panels/LobbyPanel.js';
import { DashboardPanel } from './panels/DashboardPanel.js';
import { SettingsPanel } from './panels/SettingsPanel.js';
import { config } from '../config.js';

export class UIManager {
  private app: pc.Application;
  private screen: pc.Entity;
  private panels: Map<string, unknown> = new Map();
  private activePanels: Set<string> = new Set();
  private messageQueue: Array<{ text: string; timer: number }> = [];

  constructor(app: pc.Application) {
    this.app = app;
    this.screen = new pc.Entity('UIScreen');
    this.screen.addComponent('screen', {
      screenSpace: true,
      resolution: new pc.Vec2(config.ui.resolution.width, config.ui.resolution.height),
    });
    app.root.addChild(this.screen);

    this.registerPanels();
    this.setupGlobalListeners();
  }

  private registerPanels(): void {
    this.panels.set('hud', new HUDPanel(this.screen));
    this.panels.set('inventory', new InventoryPanel(this.screen));
    this.panels.set('character', new CharacterPanel(this.screen));
    this.panels.set('chat', new ChatPanel(this.screen));
    this.panels.set('skill', new SkillPanel(this.screen));
    this.panels.set('party', new PartyPanel(this.screen));
    this.panels.set('quest', new QuestPanel(this.screen));
    this.panels.set('shop', new ShopPanel(this.screen));
    this.panels.set('trade', new TradePanel(this.screen));
    this.panels.set('lobby', new LobbyPanel(this.screen));
    this.panels.set('dashboard', new DashboardPanel(this.screen));
    this.panels.set('settings', new SettingsPanel(this.screen));
  }

  private setupGlobalListeners(): void {
    this.app.on('hud:healthUpdate', (data: { health: number; maxHealth: number }) => {
      (this.panels.get('hud') as HUDPanel).updateHealth(data.health, data.maxHealth);
    });

    this.app.on('hud:manaUpdate', (data: { mana: number; maxMana: number }) => {
      (this.panels.get('hud') as HUDPanel).updateMana(data.mana, data.maxMana);
    });

    this.app.on('hud:xUpdate', (data: { xp: number; maxXp: number; level: number }) => {
      (this.panels.get('hud') as HUDPanel).updateXP(data.xp, data.maxXp, data.level);
    });

    this.app.on('chat:message', (data: { channel: string; senderName: string; text: string; color: string }) => {
      (this.panels.get('chat') as ChatPanel).addMessage(data);
    });

    this.app.on('ui:showPanel', (panelName: string) => this.showPanel(panelName));
    this.app.on('ui:hidePanel', (panelName: string) => this.hidePanel(panelName));
    this.app.on('ui:togglePanel', (panelName: string) => this.togglePanel(panelName));
  }

  showPanel(name: string): void {
    this.panels.get(name);
    this.activePanels.add(name);
  }

  hidePanel(name: string): void {
    this.panels.get(name);
    this.activePanels.delete(name);
  }

  togglePanel(name: string): void {
    if (this.activePanels.has(name)) this.hidePanel(name);
    else this.showPanel(name);
  }

  showDamageNumber(targetId: string, damage: number): void {
  }

  showSystemMessage(text: string): void {
    this.messageQueue.push({ text, timer: 3 });
  }

  showChatMessage(data: { channel: string; senderName: string; text: string }): void {
    (this.panels.get('chat') as ChatPanel).addMessage(data);
  }

  update(dt: number): void {
    for (let i = this.messageQueue.length - 1; i >= 0; i--) {
      this.messageQueue[i].timer -= dt;
      if (this.messageQueue[i].timer <= 0) {
        this.messageQueue.splice(i, 1);
      }
    }
  }
}
