import { config } from '../config';

export class InputController {
  keys: Set<string> = new Set();
  mouseDeltaX: number = 0;
  mouseDeltaY: number = 0;
  scrollDelta: number = 0;
  attackClicked: boolean = false;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundWheel: (e: WheelEvent) => void;
  private enabled: boolean = true;
  private callbackAttack: (() => void) | null = null;

  constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundWheel = this.onWheel.bind(this);
  }

  get forward(): boolean { return this.enabled && this.keys.has(config.controls.forward); }
  get backward(): boolean { return this.enabled && this.keys.has(config.controls.backward); }
  get left(): boolean { return this.enabled && this.keys.has(config.controls.left); }
  get right(): boolean { return this.enabled && this.keys.has(config.controls.right); }
  get sprint(): boolean { return this.enabled && this.keys.has(config.controls.sprint); }
  get jump(): boolean { return this.enabled && this.keys.has(config.controls.jump); }
  get interact(): boolean { return this.enabled && this.keys.has(config.controls.interact); }
  get mount(): boolean { return this.enabled && this.keys.has(config.controls.mount); }
  get inventory(): boolean { return this.enabled && this.keys.has(config.controls.inventory); }
  get character(): boolean { return this.enabled && this.keys.has(config.controls.character); }
  get skills(): boolean { return this.enabled && this.keys.has(config.controls.skills); }
  get quests(): boolean { return this.enabled && this.keys.has(config.controls.quests); }
  get party(): boolean { return this.enabled && this.keys.has(config.controls.party); }

  isSkillSlot(slot: number): boolean {
    return this.enabled && slot >= 0 && slot <= 9 && this.keys.has(config.controls.skillBar[slot]);
  }

  setAttackCallback(cb: () => void): void {
    this.callbackAttack = cb;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear();
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  }

  attach(): void {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('wheel', this.boundWheel, { passive: true });
  }

  detach(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mousedown', this.boundMouseDown);
    window.removeEventListener('wheel', this.boundWheel);
  }

  private onKeyDown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
    if (!this.enabled) return;
    this.keys.add(e.code);
    e.preventDefault();
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.enabled && document.pointerLockElement) {
      this.mouseDeltaX += e.movementX;
      this.mouseDeltaY += e.movementY;
    }
  }

  private onMouseDown(_e: MouseEvent): void {
    const target = _e.target as HTMLElement;
    if (target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.closest('#lobby-ui'))) {
      return;
    }
    if (!this.enabled) return;

    if (_e.button === 2) {
      if (!document.pointerLockElement) {
        document.body.requestPointerLock();
      } else {
        document.exitPointerLock();
      }
      return;
    }

    if (_e.button === 0 && document.pointerLockElement) {
      this.attackClicked = true;
      this.callbackAttack?.();
    }
  }

  private onWheel(e: WheelEvent): void {
    if (!this.enabled) return;
    this.scrollDelta += Math.sign(e.deltaY);
  }

  resetDeltas(): void {
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.scrollDelta = 0;
    this.attackClicked = false;
  }

  wasAttackClicked(): boolean {
    const val = this.attackClicked;
    this.attackClicked = false;
    return val;
  }
}
