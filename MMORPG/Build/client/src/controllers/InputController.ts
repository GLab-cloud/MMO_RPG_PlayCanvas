import { config } from '../config';

export class InputController {
  keys: Set<string> = new Set();
  mouseDeltaX: number = 0;
  mouseDeltaY: number = 0;
  scrollDelta: number = 0;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundWheel: (e: WheelEvent) => void;

  constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundWheel = this.onWheel.bind(this);
  }

  get forward(): boolean { return this.keys.has(config.controls.forward); }
  get backward(): boolean { return this.keys.has(config.controls.backward); }
  get left(): boolean { return this.keys.has(config.controls.left); }
  get right(): boolean { return this.keys.has(config.controls.right); }
  get sprint(): boolean { return this.keys.has(config.controls.sprint); }
  get jump(): boolean { return this.keys.has(config.controls.jump); }
  get interact(): boolean { return this.keys.has(config.controls.interact); }
  get mount(): boolean { return this.keys.has(config.controls.mount); }
  get inventory(): boolean { return this.keys.has(config.controls.inventory); }
  get character(): boolean { return this.keys.has(config.controls.character); }
  get skills(): boolean { return this.keys.has(config.controls.skills); }
  get quests(): boolean { return this.keys.has(config.controls.quests); }
  get party(): boolean { return this.keys.has(config.controls.party); }

  isSkillSlot(slot: number): boolean {
    return slot >= 0 && slot <= 9 && this.keys.has(config.controls.skillBar[slot]);
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
    this.keys.add(e.code);
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  private onMouseMove(e: MouseEvent): void {
    if (document.pointerLockElement) {
      this.mouseDeltaX += e.movementX;
      this.mouseDeltaY += e.movementY;
    }
  }

  private onMouseDown(_e: MouseEvent): void {
    document.body.requestPointerLock();
  }

  private onWheel(e: WheelEvent): void {
    this.scrollDelta += Math.sign(e.deltaY);
  }

  resetDeltas(): void {
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.scrollDelta = 0;
  }
}
