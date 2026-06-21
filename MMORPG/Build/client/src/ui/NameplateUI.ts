interface Nameplate {
  el: HTMLElement;
  nameEl: HTMLElement;
  hpBar: HTMLElement;
  hpFill: HTMLElement;
  xpEl: HTMLElement;
}

export class NameplateUI {
  private container: HTMLElement;
  private nameplates: Map<string, Nameplate> = new Map();

  constructor() {
    this.container = document.getElementById('nameplates') || document.body;
  }

  addNameplate(id: string, name: string, isLocal: boolean = false): void {
    if (this.nameplates.has(id)) return;
    const el = document.createElement('div');
    el.className = 'nameplate';
    const nameEl = document.createElement('div');
    nameEl.className = 'nameplate-name';
    nameEl.textContent = name;
    el.appendChild(nameEl);
    const hpBar = document.createElement('div');
    hpBar.className = 'nameplate-hp-bar';
    const hpFill = document.createElement('div');
    hpFill.className = 'nameplate-hp-fill';
    hpBar.appendChild(hpFill);
    el.appendChild(hpBar);
    const xpEl = document.createElement('div');
    xpEl.className = 'nameplate-xp';
    if (isLocal) {
      xpEl.textContent = 'XP: 0/100';
    }
    el.appendChild(xpEl);
    this.container.appendChild(el);
    this.nameplates.set(id, { el, nameEl, hpBar, hpFill, xpEl });
  }

  removeNameplate(id: string): void {
    const np = this.nameplates.get(id);
    if (np) {
      np.el.remove();
      this.nameplates.delete(id);
    }
  }

  updateNameplateName(id: string, name: string): void {
    const np = this.nameplates.get(id);
    if (np) {
      np.nameEl.textContent = name;
    }
  }

  updateNameplateHP(id: string, pct: number): void {
    const np = this.nameplates.get(id);
    if (np) {
      np.hpFill.style.width = `${Math.max(0, Math.min(100, pct * 100))}%`;
    }
  }

  updateNameplateXP(xp: number, xpNext: number): void {
    for (const [, np] of this.nameplates) {
      np.xpEl.textContent = `XP: ${xp}/${xpNext}`;
    }
  }

  updatePositions(
    entities: { id: string; x: number; y: number; z: number }[],
    worldToScreen: (x: number, y: number, z: number) => { x: number; y: number } | null
  ): void {
    for (const e of entities) {
      const np = this.nameplates.get(e.id);
      if (!np) continue;
      const screen = worldToScreen(e.x, e.y, e.z);
      if (screen) {
        np.el.style.display = 'block';
        np.el.style.left = `${screen.x}px`;
        np.el.style.top = `${screen.y}px`;
      } else {
        np.el.style.display = 'none';
      }
    }
  }

  clear(): void {
    for (const [, np] of this.nameplates) {
      np.el.remove();
    }
    this.nameplates.clear();
  }
}
