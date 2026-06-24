import { MatchInfo } from '../network/NetworkManager';
import { InputController } from '../controllers/InputController';
import { HTMLLobbyUI, HTMLLobbyCallbacks } from './HTMLLobbyUI';

interface ScoreEntry {
  name: string;
  kills: number;
  deaths: number;
}

export interface LobbyUICallbacks extends HTMLLobbyCallbacks {}

export class UIManager {
  private htmlLobby: HTMLLobbyUI;
  private hudEl: HTMLElement;
  private nameDisplay: HTMLElement;
  private levelDisplay: HTMLElement;
  private hpFill: HTMLElement;
  private mpFill: HTMLElement;
  private xpFill: HTMLElement;
  private hpValue: HTMLElement;
  private mpValue: HTMLElement;
  private xpValue: HTMLElement;
  private killsDisplay: HTMLElement;
  private deathsDisplay: HTMLElement;
  private combatFeedback: HTMLElement;
  private damageContainer: HTMLElement;
  private helpText: HTMLElement;
  private leaderboardEl: HTMLElement;
  private leaderboardList: HTMLElement;
  private deathScreen: HTMLElement;
  private playerName: string = 'Player';
  private kills: number = 0;
  private deaths: number = 0;
  private leaderboardEntries: ScoreEntry[] = [];
  private onRespawn: (() => void) | null = null;

  constructor() {
    this.htmlLobby = new HTMLLobbyUI();
    this.hudEl = document.getElementById('hud-overlay')!;
    this.nameDisplay = document.getElementById('player-name-display')!;
    this.levelDisplay = document.getElementById('level-display')!;
    this.hpFill = document.getElementById('hp-fill')!;
    this.mpFill = document.getElementById('mp-fill')!;
    this.xpFill = document.getElementById('xp-fill')!;
    this.hpValue = document.getElementById('hp-value')!;
    this.mpValue = document.getElementById('mp-value')!;
    this.xpValue = document.getElementById('xp-value')!;
    this.killsDisplay = document.getElementById('score-kills')!;
    this.deathsDisplay = document.getElementById('score-deaths')!;
    this.combatFeedback = document.getElementById('combat-feedback')!;
    this.damageContainer = document.getElementById('hud-damage-container')!;
    this.helpText = document.getElementById('help-text')!;
    this.leaderboardEl = document.getElementById('leaderboard')!;
    this.leaderboardList = document.getElementById('leaderboard-list')!;
    this.deathScreen = document.createElement('div');
    this.deathScreen.id = 'death-screen';
    this.deathScreen.style.display = 'none';
    document.body.appendChild(this.deathScreen);
  }

  setInputController(inputController: InputController): void {
    this.htmlLobby.setInputController(inputController);
  }

  showLobby(callbacks: LobbyUICallbacks): void {
    this.hudEl.style.display = 'none';
    this.htmlLobby.setCallbacks(callbacks);
    this.htmlLobby.show();
  }

  showWorld(): void {
    this.htmlLobby.hide();
    this.hudEl.style.display = 'block';
    this.deathScreen.style.display = 'none';
  }

  updateMatchList(matches: MatchInfo[]): void {
    this.htmlLobby.updateMatchList(matches);
  }

  setMyMatchId(id: string | null): void {
    this.htmlLobby.setMyMatchId(id);
  }

  setPlayerName(name: string): void {
    this.playerName = name;
    this.nameDisplay.textContent = name;
  }

  getPlayerName(): string {
    return this.playerName;
  }

  updateHUD(hp: number, maxHp: number, mp: number, maxMp: number, xp: number, xpNext: number, level: number, atk: number, def: number): void {
    const hpPct = Math.min(100, Math.max(0, (hp / maxHp) * 100));
    const mpPct = Math.min(100, Math.max(0, (mp / maxMp) * 100));
    const xpPct = Math.min(100, Math.max(0, xpNext > 0 ? (xp / xpNext) * 100 : 0));

    this.hpFill.style.width = `${hpPct}%`;
    this.mpFill.style.width = `${mpPct}%`;
    this.xpFill.style.width = `${xpPct}%`;

    this.hpValue.textContent = `${Math.floor(hp)}/${Math.floor(maxHp)}`;
    this.mpValue.textContent = `${Math.floor(mp)}/${Math.floor(maxMp)}`;
    this.xpValue.textContent = `${Math.floor(xp)}/${Math.floor(xpNext)}`;
    this.levelDisplay.textContent = `Lv.${level}`;
  }

  updateScore(kills: number, deaths: number): void {
    this.kills = kills;
    this.deaths = deaths;
    this.killsDisplay.textContent = `Kills: ${kills}`;
    this.deathsDisplay.textContent = `Deaths: ${deaths}`;
  }

  showCombatFeedback(text: string, color: string = '#ffaa00', duration: number = 800): void {
    this.combatFeedback.textContent = text;
    this.combatFeedback.style.color = color;
    this.combatFeedback.style.opacity = '1';
    this.combatFeedback.style.transform = 'translate(-50%, -50%) scale(1)';
    setTimeout(() => {
      this.combatFeedback.style.opacity = '0';
      this.combatFeedback.style.transform = 'translate(-50%, -50%) scale(1.5)';
    }, duration);
  }

  showDamageNumber(x: number, y: number, damage: number, critical: boolean = false): void {
    const el = document.createElement('div');
    el.className = `damage-number ${critical ? 'critical' : 'normal'}`;
    el.textContent = critical ? `⚡${damage}` : `-${damage}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.damageContainer.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  showHealNumber(x: number, y: number, amount: number): void {
    const el = document.createElement('div');
    el.className = 'damage-number heal';
    el.textContent = `+${amount}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.damageContainer.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  showAttackFlash(): void {
    const el = document.createElement('div');
    el.className = 'attack-flash';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 400);
  }

  showHitFlash(): void {
    const el = document.createElement('div');
    el.className = 'hit-flash';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 300);
  }

  showDeathScreen(killedBy: string = 'an enemy'): void {
    this.deathScreen.innerHTML = `
      <h1>YOU DIED</h1>
      <p>Killed by ${killedBy}</p>
      <p>Kills: ${this.kills} | Deaths: ${this.deaths}</p>
      <button class="btn btn-primary" id="respawn-btn">Respawn</button>
    `;
    this.deathScreen.style.display = 'flex';
    document.getElementById('respawn-btn')?.addEventListener('click', () => {
      this.deathScreen.style.display = 'none';
      this.onRespawn?.();
    });
  }

  setOnRespawn(cb: () => void): void {
    this.onRespawn = cb;
  }

  showLeaderboard(entries: ScoreEntry[]): void {
    this.leaderboardEntries = entries;
    this.leaderboardList.innerHTML = entries.map((e, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      return `
        <div class="leaderboard-entry">
          <span class="leaderboard-rank ${rankClass}">#${i + 1}</span>
          <span class="leaderboard-name">${e.name}</span>
          <span class="leaderboard-score">${e.kills - e.deaths}</span>
          <span class="leaderboard-kills">${e.kills}K</span>
          <span class="leaderboard-deaths">${e.deaths}D</span>
        </div>
      `;
    }).join('');
    this.leaderboardEl.style.display = 'block';
  }

  hideLeaderboard(): void {
    this.leaderboardEl.style.display = 'none';
  }

  toggleLeaderboard(): void {
    if (this.leaderboardEl.style.display === 'block') {
      this.hideLeaderboard();
    } else {
      this.showLeaderboard(this.leaderboardEntries);
    }
  }

  get killsCount(): number { return this.kills; }
  get deathsCount(): number { return this.deaths; }
}
