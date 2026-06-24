import * as pc from 'playcanvas';
import { App } from './app';
import { NetworkManager } from './network/NetworkManager';
import { UIManager } from './ui/UIManager';
import { SceneManager } from './scenes/SceneManager';
import { PlayerController, NPC_DIALOGS, NPC_INTERACT_RANGE } from './controllers/PlayerController';
import { CameraController } from './controllers/CameraController';
import { InputController } from './controllers/InputController';
import { NameplateUI } from './ui/NameplateUI';
import { AudioManager } from './audio/AudioManager';
import { config } from './config';

export class GameClient {
  app!: App;
  pcApp!: pc.Application;
  network!: NetworkManager;
  ui!: UIManager;
  sceneManager!: SceneManager;
  playerController!: PlayerController;
  cameraController!: CameraController;
  inputController!: InputController;
  private nameplates!: NameplateUI;
  private audio: AudioManager = new AudioManager();
  private activeNpcDialog: string | null = null;
  private lastNpcCheck: number = 0;
  running: boolean = false;
  private playerHp: number = 100;
  private playerMaxHp: number = 100;
  private playerMp: number = 50;
  private playerMaxMp: number = 50;
  private playerXp: number = 0;
  private playerXpNext: number = 100;
  private playerLevel: number = 1;
  private playerAtk: number = 10;
  private playerDef: number = 5;
  private kills: number = 0;
  private deaths: number = 0;
  private leaderboardData: { name: string; kills: number; deaths: number }[] = [];

  private weaponsInventory: { templateId: string; name: string; attack: number; magicAttack: number; critRate: number }[] = [];
  private equippedWeaponIndex: number = -1;
  private currentWeaponType: string = 'fist';

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new App();
    this.app.canvas = canvas;

    this.pcApp = new pc.Application(canvas, {});
    this.app.pcApp = this.pcApp;

    this.inputController = new InputController();
    this.cameraController = new CameraController(this.pcApp, this.inputController);
    this.sceneManager = new SceneManager(this.pcApp);
    this.network = new NetworkManager(this.pcApp, this.sceneManager);
    this.ui = new UIManager();
    this.ui.setInputController(this.inputController);
    this.nameplates = new NameplateUI();

    this.setupLeaderboardClose();

    await this.app.init();

    this.inputController.attach();
    this.inputController.setAttackCallback(() => this.handleAttack());

    this.sceneManager.registerScene('Flarine', {
      name: 'Flarine',
      terrainSize: 200,
      playerSpawn: { x: 0, y: 0, z: 0 },
      bounds: { min: -100, max: 100 },
      monsters: [],
      npcs: [],
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) this.audio.playButton();
    });
    this.setupNetworkCallbacks();
    this.setupNameplateCallbacks();
    this.ui.showLobby({
      onCreateMatch: (name, map, maxPlayers, playerName) => {
        this.ui.setPlayerName(playerName);
        this.network.sendToLobby('create_match', { name, map, maxPlayers });
      },
      onJoinMatch: (matchId, playerName) => {
        this.ui.setPlayerName(playerName);
        this.network.sendToLobby('join_match', { matchId });
      },
      onLeaveMatch: (matchId) => this.network.sendToLobby('leave_match', { matchId }),
      onStartMatch: (matchId) => this.network.sendToLobby('start_match', { matchId }),
      onExitGame: () => this.exitGame(),
    });

    this.network.setOnPlayerLeft((id) => {
      this.leaderboardData = this.leaderboardData.filter(e => e.name !== id);
    });

    this.network.setCombatCallbacks({
      onDamageDealt: (monsterId, damage, critical) => {
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 60;
        const y = window.innerHeight / 2 + (Math.random() - 0.5) * 40;
        this.ui.showDamageNumber(x, y, damage, critical);
        this.ui.showCombatFeedback(critical ? 'CRITICAL!' : `Hit! -${damage}`, critical ? '#ff4444' : '#ffaa00');
        this.ui.showAttackFlash();
        (critical ? this.audio.playCritical() : this.audio.playAttack());
      },
      onMonsterKilled: (monsterId, xp) => {
        this.playerXp += xp;
        this.audio.playMonsterDeath();
        this.audio.playXP();
        this.ui.showCombatFeedback(`+${xp} XP`, '#44ff44', 1000);
        if (this.playerXp >= this.playerXpNext) {
          this.playerXp -= this.playerXpNext;
          this.playerLevel++;
          this.playerXpNext = Math.floor(this.playerXpNext * 1.3);
          this.playerHp = this.playerMaxHp;
          this.playerMp = this.playerMaxMp;
          this.audio.playLevelUp();
          this.ui.showCombatFeedback(`LEVEL UP! Lv.${this.playerLevel}`, '#44ff44', 1500);
        }
        this.kills++;
        this.ui.updateScore(this.kills, this.deaths);
        this.updateLeaderboard();
      },
      onScoreUpdate: (players) => {
        this.leaderboardData = players.map(p => ({
          name: p.name,
          kills: p.kills,
          deaths: p.deaths,
        }));
        this.ui.showLeaderboard(this.leaderboardData);
      },
      onPlayerKilled: (_attackerId, _targetId) => {
        this.kills++;
        this.ui.updateScore(this.kills, this.deaths);
        this.updateLeaderboard();
      },
      onPlayerDamage: (attackerId, targetId, damage, critical) => {
        const localId = this.network.getStateSync().localPlayerId;
        if (targetId !== localId) {
          if (attackerId === localId) {
            this.ui.showAttackFlash();
            this.ui.showCombatFeedback(critical ? 'CRITICAL!' : `Hit! -${damage}`, critical ? '#ff4444' : '#ffaa00');
            this.audio.playAttack();
          }
          this.ui.showDamageNumber(
            window.innerWidth / 2 + (Math.random() - 0.5) * 60,
            window.innerHeight / 2 + (Math.random() - 0.5) * 40,
            damage, critical
          );
          return;
        }
        if (this.playerHp <= 0) return;
        this.playerHp -= damage;
        this.audio.playPlayerHit();
        this.ui.showHitFlash();
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 40;
        const y = window.innerHeight / 2 + (Math.random() - 0.5) * 30;
        this.ui.showDamageNumber(x, y, damage, critical);
        this.ui.showCombatFeedback(critical ? 'CRITICAL HIT!' : `-${damage} HP`, '#ff4444');

        if (this.playerHp <= 0) {
          this.playerHp = 0;
          this.audio.playDeath();
          this.deaths++;
          this.ui.updateScore(this.kills, this.deaths);
          this.updateLeaderboard();
          const killedBy = attackerId === localId ? 'yourself' : attackerId.startsWith('monster_') ? 'a monster' : `player ${attackerId.slice(-4)}`;
          this.ui.showDeathScreen(killedBy);
          this.playerController.die();
        }
      },
    });

    document.getElementById('npc-dialog-close')?.addEventListener('click', () => {
      this.activeNpcDialog = null;
      const el = document.getElementById('npc-dialog');
      if (el) el.style.display = 'none';
    });

    document.getElementById('inventory-close')?.addEventListener('click', () => {
      const overlay = document.getElementById('inventory-overlay');
      if (overlay) overlay.style.display = 'none';
    });

    this.pcApp.on('update', (dt: number) => {
      if (this.running) this.update(dt);
    });

    this.running = true;
  }

  private setupLeaderboardClose(): void {
    document.getElementById('leaderboard-close')?.addEventListener('click', () => this.ui.hideLeaderboard());
  }

  private handleAttack(): void {
    if (this.playerController) {
      this.playerController.doAttack();
    }
  }

  private setupNameplateCallbacks(): void {
    const stateSync = this.network.getStateSync();
    stateSync.onPlayerAdded = (id, name) => {
      this.nameplates.addNameplate(id, name);
    };
    stateSync.onPlayerRemoved = (id) => {
      this.nameplates.removeNameplate(id);
    };
    stateSync.onPlayerRenamed = (id, name) => {
      this.nameplates.updateNameplateName(id, name);
    };
    stateSync.onPlayerHPUpdate = (id, hp, maxHp) => {
      const pct = maxHp > 0 ? hp / maxHp : 1;
      this.nameplates.updateNameplateHP(id, pct);
      const localId = this.network.getStateSync().localPlayerId;
      if (id === localId) {
        this.nameplates.updateNameplateHP('local', pct);
      } else {
        if (hp <= 0) stateSync['playerDied'](id);
        else if (maxHp > 0 && stateSync['deadPlayers']?.has(id)) stateSync['playerRevived'](id);
      }
    };
    stateSync.onPlayerXPUpdate = (id, xp, xpNext) => {
      this.nameplates.updateNameplateXP(id, xp, xpNext);
    };
  }

  private setupMonsterNameplateCallbacks(): void {
    const stateSync = this.network.getStateSync();
    stateSync.onMonsterAdded = (id, name) => {
      this.nameplates.addMonsterNameplate(id, name);
    };
    stateSync.onMonsterRemoved = (id) => {
      this.nameplates.removeMonsterNameplate(id);
    };
    stateSync.onMonsterHPUpdate = (id, hp, maxHp) => {
      const pct = maxHp > 0 ? hp / maxHp : 1;
      this.nameplates.updateNameplateHP(id, pct);
    };
  }

  private setupNetworkCallbacks(): void {
    this.network.setCallbacks({
      onMatchList: (matches) => this.ui.updateMatchList(matches),
      onMatchCreated: (matchId) => {
        console.log('Match created:', matchId);
        this.ui.setMyMatchId(matchId);
      },
      onMatchJoined: (matchId) => {
        console.log('Joined match:', matchId);
        this.ui.setMyMatchId(matchId);
      },
      onMatchStarting: (matchId) => this.onMatchStarting(matchId),
      onError: (message) => console.error('Network error:', message),
      onLobbyConnected: () => {
        console.log('Lobby connected');
        this.audio.startLobbyBGM();
      },
      onWorldConnected: () => console.log('World connected'),
      onDisconnected: () => {
        console.log('Disconnected');
        this.audio.stopBGM();
        this.audio.startLobbyBGM();
      },
    });
  }

  private async onMatchStarting(matchId: string): Promise<void> {
    const name = this.ui.getPlayerName();
    this.ui.setPlayerName(name);
    this.ui.showWorld();
    this.playerController = new PlayerController(
      this.pcApp, this.network, this.inputController, this.cameraController
    );
    this.playerController.onCombatFeedback = (text, color, duration) => this.ui.showCombatFeedback(text, color, duration);
    this.playerController.setPanelToggleCallback((panel: string) => {
      if (panel === 'leaderboard') {
        this.ui.toggleLeaderboard();
        this.updateLeaderboard();
      } else if (panel === 'inventory') {
        this.toggleInventory();
      }
    });
    this.setupMonsterNameplateCallbacks();

    this.network.onWeaponPickup = (data) => {
      const localId = this.network.getStateSync().localPlayerId;
      if (data.playerId !== localId) return;
      this.weaponsInventory.push({
        templateId: data.templateId,
        name: data.name,
        attack: data.attack,
        magicAttack: data.magicAttack,
        critRate: data.critRate,
      });
      this.audio.playPickup();
      this.ui.showCombatFeedback(`Picked up ${data.name}!`, '#44aaff', 1000);
      if (this.equippedWeaponIndex === -1) {
        this.equipWeapon(this.weaponsInventory.length - 1);
      }
    };

    this.ui.setOnRespawn(() => {
      this.audio.playRespawn();
      this.playerController.respawn();
      this.playerHp = this.playerMaxHp;
      this.playerMp = this.playerMaxMp;
      this.network.sendToWorld('player:respawn', {});
    });
    this.network.onRespawnedCallback = (x, z) => {
      this.playerController.getPlayer().setLocalPosition(x, 2, z);
    };

    this.sceneManager.loadScene('Flarine');
    this.nameplates.addNameplate('local', this.ui.getPlayerName(), true);
    await this.network.joinWorldRoom(matchId);
    this.audio.stopBGM();
    this.audio.startBGM();
    this.sendPlayerName(name);
  }

  private sendPlayerName(name: string): void {
    this.network.sendToWorld('player:set_name', { name });
  }

  private updateLeaderboard(): void {
    this.leaderboardData = [
      { name: this.ui.getPlayerName(), kills: this.kills, deaths: this.deaths },
    ];
    this.ui.showLeaderboard(this.leaderboardData);
  }

  private exitGame(): void {
    this.network.disconnect();
  }

  connectToServer(_token: string): void {
    this.network.connectToLobby(config.serverUrl);
  }

  update(dt: number): void {
    if (this.network.state === 'world' && this.playerController) {
      this.playerController.update(dt);
      this.cameraController.update(dt);
      this.network.update(dt);
      this.sceneManager.update(dt);

      this.ui.updateHUD(
        this.playerHp, this.playerMaxHp,
        this.playerMp, this.playerMaxMp,
        this.playerXp, this.playerXpNext,
        this.playerLevel,
        this.playerAtk, this.playerDef
      );

      this.updateNpcDialog();
      this.updateWeaponPickupHint();
      this.updateNameplates();
    }
    this.inputController.resetDeltas();
  }

  private updateNpcDialog(): void {
    this.lastNpcCheck += 1;
    if (this.lastNpcCheck % 10 !== 0) return;
    const dialogEl = document.getElementById('npc-dialog');
    const nameEl = document.getElementById('npc-dialog-name');
    const textEl = document.getElementById('npc-dialog-text');
    if (!dialogEl || !nameEl || !textEl) return;

    const nearestNpc = this.playerController.getNearestNPC();
    if (nearestNpc) {
      const messages = NPC_DIALOGS[nearestNpc];
      if (messages) {
        this.activeNpcDialog = nearestNpc;
        nameEl.textContent = nearestNpc;
        textEl.textContent = messages[Math.floor(Math.random() * messages.length)];
        dialogEl.style.display = 'block';
      }
    } else if (this.activeNpcDialog) {
      this.activeNpcDialog = null;
      dialogEl.style.display = 'none';
    }
  }

  private toggleInventory(): void {
    const overlay = document.getElementById('inventory-overlay');
    if (!overlay) return;
    if (overlay.style.display === 'none') {
      this.renderInventory();
      overlay.style.display = 'flex';
    } else {
      overlay.style.display = 'none';
    }
  }

  private renderInventory(): void {
    const list = document.getElementById('inventory-list');
    if (!list) return;
    if (this.weaponsInventory.length === 0) {
      list.innerHTML = '<div class="inv-empty">No weapons collected</div>';
      return;
    }
    list.innerHTML = this.weaponsInventory.map((w, i) => {
      const colors: Record<string, string> = {
        sword: '#94a3b8', gun: '#64748b', axe: '#b91c1c',
        staff: '#3b82f6', dagger: '#65a30d',
      };
      const icons: Record<string, string> = {
        sword: '\u2694\uFE0F', gun: '\uD83D\uDD2B', axe: '\uD83E\uDE93',
        staff: '\uD83E\uDE84', dagger: '\uD83D\uDDE1\uFE0F',
      };
      const color = colors[w.templateId] || '#94a3b8';
      const icon = icons[w.templateId] || '\u2694\uFE0F';
      const isEquipped = i === this.equippedWeaponIndex;
      let stats = `<div class="inv-item-stat">ATK <span>${w.attack}</span></div>`;
      if (w.magicAttack > 0) stats += `<div class="inv-item-stat">MATK <span>${w.magicAttack}</span></div>`;
      if (w.critRate > 0) stats += `<div class="inv-item-stat">CRIT <span>${(w.critRate * 100).toFixed(0)}%</span></div>`;
      return `<div class="inv-item ${isEquipped ? 'inv-equipped' : ''}" data-index="${i}">
        <div class="inv-item-icon" style="background:${color}22;color:${color}">${icon}</div>
        <div class="inv-item-info">
          <div class="inv-item-name">${w.name}${isEquipped ? ' (Equipped)' : ''}</div>
          <div class="inv-item-stats">${stats}</div>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('.inv-item').forEach((el) => {
      el.addEventListener('click', () => {
        const index = parseInt(el.getAttribute('data-index') || '0', 10);
        this.equipWeapon(index);
      });
    });
  }

  private equipWeapon(index: number): void {
    if (index < 0 || index >= this.weaponsInventory.length) return;
    if (this.equippedWeaponIndex >= 0 && this.equippedWeaponIndex < this.weaponsInventory.length) {
      const oldWeapon = this.weaponsInventory[this.equippedWeaponIndex];
      this.playerAtk -= oldWeapon.attack;
    }
    this.equippedWeaponIndex = index;
    const weapon = this.weaponsInventory[index];
    this.playerAtk += weapon.attack;
    this.currentWeaponType = weapon.templateId;
    this.playerController.setWeaponType(weapon.templateId);
    this.network.sendToWorld('player:equip_weapon', { templateId: weapon.templateId });
    this.audio.playEquip();
    this.ui.showCombatFeedback(`Equipped ${weapon.name}!`, '#ffaa00', 1000);
    this.renderInventory();
  }

  private updateWeaponPickupHint(): void {
    const hintEl = document.getElementById('weapon-pickup-hint');
    if (!hintEl) return;
    const weapon = this.playerController.getNearestWeapon();
    if (weapon) {
      const name = weapon.templateId.charAt(0).toUpperCase() + weapon.templateId.slice(1);
      hintEl.textContent = `Press F to pick up ${name}`;
      hintEl.style.display = 'block';
    } else {
      hintEl.style.display = 'none';
    }
  }

  private updateNameplates(): void {
    const cameraEntity = this.cameraController.getCamera();
    if (!cameraEntity?.camera) return;
    const stateSync = this.network.getStateSync();
    const positions = stateSync.getAllPlayerPositions();

    const localPos = this.playerController.getPlayer().getLocalPosition();
    positions.push({ id: 'local', x: localPos.x, y: localPos.y + 2.8, z: localPos.z });
    this.nameplates.updateNameplateXP('local', this.playerXp, this.playerXpNext);
    this.nameplates.updateNameplateHP('local', this.playerMaxHp > 0 ? this.playerHp / this.playerMaxHp : 1);

    const monsterPositions = stateSync.getAllMonsterPositions();
    positions.push(...monsterPositions);

    const cam = cameraEntity.camera!;
    this.nameplates.updatePositions(positions, (x, y, z) => {
      const screen = cam.worldToScreen(new pc.Vec3(x, y, z));
      if (screen) {
        return { x: screen.x, y: screen.y };
      }
      return null;
    });
  }
}
