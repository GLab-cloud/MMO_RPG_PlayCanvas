import { MatchInfo } from '../network/NetworkManager';
import { InputController } from '../controllers/InputController';

export interface HTMLLobbyCallbacks {
  onCreateMatch(name: string, map: string, maxPlayers: number): void;
  onJoinMatch(matchId: string): void;
  onLeaveMatch(matchId: string): void;
  onStartMatch(matchId: string): void;
  onExitGame(): void;
}

export class HTMLLobbyUI {
  private container: HTMLElement | null = null;
  private callbacks: HTMLLobbyCallbacks | null = null;
  private matches: MatchInfo[] = [];
  private myMatchId: string | null = null;
  private isVisible = false;
  private inputController: InputController | null = null;

  constructor(inputController?: InputController) {
    this.container = document.getElementById('lobby-ui');
    this.inputController = inputController || null;
  }

  setCallbacks(cb: HTMLLobbyCallbacks): void {
    this.callbacks = cb;
  }

  setInputController(inputController: InputController): void {
    this.inputController = inputController;
  }

  show(): void {
    if (!this.container) return;
    this.isVisible = true;
    this.inputController?.setEnabled(false);
    this.container.style.display = 'flex';
    this.render();
  }

  hide(): void {
    if (!this.container) return;
    this.isVisible = false;
    this.inputController?.setEnabled(true);
    this.container.style.display = 'none';
  }

  setMyMatchId(id: string | null): void {
    console.log(`[HTMLLobbyUI] setMyMatchId: ${this.myMatchId} → ${id}`);
    this.myMatchId = id;
    if (this.isVisible) {
      console.log(`[HTMLLobbyUI] Lobby visible, re-rendering match list`);
      this.renderMatchList();
    }
  }

  updateMatchList(matches: MatchInfo[]): void {
    console.log(`[HTMLLobbyUI] updateMatchList: received ${matches.length} matches, myMatchId=${this.myMatchId}`);
    matches.forEach(m => console.log(`  - ${m.id}: ${m.name} (${m.playerCount}/${m.maxPlayers}) joined=${this.myMatchId === m.id}`));
    this.matches = matches;
    if (this.isVisible) {
      console.log(`[HTMLLobbyUI] Rendering match list`);
      this.renderMatchList();
    }
  }

  private render(): void {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="lobby-container">
        <div class="lobby-header">
          <h1>FLYFF</h1>
          <p>Fly For Fun Online Game Lobby</p>
        </div>
        <div class="lobby-main">
          <div class="lobby-panel">
            <h2>Available Matches</h2>
            <div class="match-list" id="match-list"></div>
          </div>
          <div class="lobby-panel">
            <h2>Create New Match</h2>
            <form class="create-form" id="create-form">
              <div class="form-group">
                <label for="match-name">Match Name</label>
                <input type="text" id="match-name" placeholder="My Awesome Match" value="My Match" required />
              </div>
              <div class="form-group">
                <label for="map-select">Select Map</label>
                <select id="map-select" required>
                  <option value="Flarine">Flarine (Beginner)</option>
                  <option value="Proper">Proper (Intermediate)</option>
                  <option value="Aibatts">Aibatts (Advanced)</option>
                </select>
              </div>
              <div class="form-group">
                <label for="max-players">Max Players</label>
                <select id="max-players" required>
                  <option value="2">2 Players</option>
                  <option value="4" selected>4 Players</option>
                  <option value="8">8 Players</option>
                  <option value="16">16 Players</option>
                </select>
              </div>
              <div class="button-group">
                <button type="submit" class="btn btn-success">✨ Create Match</button>
                <button type="button" class="btn btn-danger" id="exit-btn">Exit Game</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.renderMatchList();
  }

  private attachEventListeners(): void {
    const form = document.getElementById('create-form') as HTMLFormElement;
    const exitBtn = document.getElementById('exit-btn') as HTMLButtonElement;

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = (document.getElementById('match-name') as HTMLInputElement).value || 'My Match';
        const map = (document.getElementById('map-select') as HTMLSelectElement).value || 'Flarine';
        const maxPlayers = parseInt((document.getElementById('max-players') as HTMLSelectElement).value) || 4;
        this.callbacks?.onCreateMatch(name, map, maxPlayers);
      });
    }

    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this.callbacks?.onExitGame();
      });
    }
  }

  private renderMatchList(): void {
    const listContainer = document.getElementById('match-list');
    if (!listContainer) return;

    if (this.matches.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m0 0h6M6 12a6 6 0 1112 0 6 6 0 01-12 0z" />
          </svg>
          <p>No matches available</p>
          <p style="font-size: 0.75rem; margin-top: 0.5rem;">Create one to get started</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = this.matches
      .map((match) => this.createMatchEntryHTML(match))
      .join('');

    this.matches.forEach((match) => {
      const entryEl = document.getElementById(`match-${match.id}`);
      if (entryEl) {
        this.attachMatchEntryListeners(entryEl, match);
      }
    });
  }

  private createMatchEntryHTML(match: MatchInfo): string {
    const isFull = match.playerCount >= match.maxPlayers;
    const isJoined = this.myMatchId === match.id;
    const playerStatus = `${match.playerCount}/${match.maxPlayers}`;

    console.log(`[Match ${match.id}] myMatchId=${this.myMatchId}, isJoined=${isJoined}, playerCount=${match.playerCount}/${match.maxPlayers}`);

    let actionHTML = '';
    if (isJoined) {
      actionHTML = `
        <div class="match-actions">
          <button class="btn btn-success btn-sm action-btn" data-action="start" style="cursor: pointer;">Start</button>
          <button class="btn btn-danger btn-sm action-btn" data-action="leave" style="cursor: pointer;">Leave</button>
        </div>
      `;
    } else if (!isFull) {
      actionHTML = `
        <div class="match-actions">
          <button class="btn btn-primary btn-sm action-btn" data-action="join" style="cursor: pointer;">Join</button>
        </div>
      `;
    }

    const yourMatchBadge = isJoined ? '👑 ' : '';

    return `
      <div class="match-entry" id="match-${match.id}">
        <div class="match-info">
          <div class="match-name">${yourMatchBadge}${match.name}</div>
          <div class="match-meta">
            <span>Map: ${match.map || 'Flarine'}</span>
            <span class="match-status ${isFull ? 'full' : ''}">
              ${isFull ? '🔴 FULL' : '🟢 OPEN'}
            </span>
          </div>
          <div class="match-meta" style="margin-top: 0.5rem; color: #a1d8ff;">
            👥 ${playerStatus} Players
          </div>
        </div>
        ${actionHTML}
      </div>
    `;
  }

  private attachMatchEntryListeners(entryEl: HTMLElement, match: MatchInfo): void {
    const buttons = entryEl.querySelectorAll('.action-btn') as NodeListOf<HTMLButtonElement>;
    console.log(`[Match ${match.id}] Attaching listeners to ${buttons.length} buttons`);
    
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = btn.dataset.action;
        console.log(`[Match ${match.id}] Button clicked: ${action}`);
        
        if (action === 'join') {
          console.log(`Joining match ${match.id}`);
          this.callbacks?.onJoinMatch(match.id);
        } else if (action === 'leave') {
          console.log(`Leaving match ${match.id}`);
          this.callbacks?.onLeaveMatch(match.id);
        } else if (action === 'start') {
          console.log(`Starting match ${match.id}`);
          this.callbacks?.onStartMatch(match.id);
        }
      });
    });
  }
}
