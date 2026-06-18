import { config } from '../config.js';

interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  attack: boolean;
  interact: boolean;
  inventory: boolean;
  character: boolean;
  skillPanel: boolean;
  questPanel: boolean;
  partyPanel: boolean;
  mount: boolean;
  skill0: boolean;
  skill1: boolean;
  skill2: boolean;
  skill3: boolean;
  skill4: boolean;
  skill5: boolean;
  skill6: boolean;
  skill7: boolean;
  skill8: boolean;
  skill9: boolean;
  targetId: string | null;
  mouseX: number;
  mouseY: number;
  mouseDeltaX: number;
  mouseDeltaY: number;
  scrollDelta: number;
}

export class InputController {
  private app: pc.Application;
  private state: InputState;

  constructor(app: pc.Application) {
    this.app = app;
    this.state = this.createDefaultState();
    this.setupListeners();
  }

  private createDefaultState(): InputState {
    return {
      forward: false, backward: false, left: false, right: false,
      sprint: false, jump: false, attack: false, interact: false,
      inventory: false, character: false, skillPanel: false,
      questPanel: false, partyPanel: false, mount: false,
      skill0: false, skill1: false, skill2: false, skill3: false,
      skill4: false, skill5: false, skill6: false, skill7: false,
      skill8: false, skill9: false,
      targetId: null,
      mouseX: 0, mouseY: 0, mouseDeltaX: 0, mouseDeltaY: 0,
      scrollDelta: 0,
    };
  }

  private setupListeners(): void {
    if (!this.app.mouse || !this.app.keyboard) return;

    this.app.mouse.on(pc.EVENT_MOUSEMOVE, (event: { dx: number; dy: number }) => {
      this.state.mouseDeltaX = event.dx;
      this.state.mouseDeltaY = event.dy;
    });

    this.app.mouse.on(pc.EVENT_MOUSEWHEEL, (event: { delta: number }) => {
      this.state.scrollDelta = event.delta;
    });

    this.app.mouse.on(pc.EVENT_MOUSEDOWN, (event: { button: number }) => {
      if (event.button === 0) this.state.attack = true;
    });

    this.app.mouse.on(pc.EVENT_MOUSEUP, (event: { button: number }) => {
      if (event.button === 0) this.state.attack = false;
    });

    this.app.keyboard.on(pc.EVENT_KEYDOWN, (event: { key: number }) => {
      const mapping: Record<number, keyof InputState> = {
        [pc.KEY_W]: 'forward', [pc.KEY_S]: 'backward',
        [pc.KEY_A]: 'left', [pc.KEY_D]: 'right',
        [pc.KEY_SHIFT]: 'sprint', [pc.KEY_SPACE]: 'jump',
        [pc.KEY_F]: 'interact', [pc.KEY_I]: 'inventory',
        [pc.KEY_C]: 'character', [pc.KEY_K]: 'skillPanel',
        [pc.KEY_L]: 'questPanel', [pc.KEY_P]: 'partyPanel',
        [pc.KEY_R]: 'mount',
        [pc.KEY_1]: 'skill1', [pc.KEY_2]: 'skill2',
        [pc.KEY_3]: 'skill3', [pc.KEY_4]: 'skill4',
        [pc.KEY_5]: 'skill5', [pc.KEY_6]: 'skill6',
        [pc.KEY_7]: 'skill7', [pc.KEY_8]: 'skill8',
        [pc.KEY_9]: 'skill9', [pc.KEY_0]: 'skill0',
      };

      const mapped = mapping[event.key];
      if (mapped) {
        (this.state[mapped] as boolean) = true;
      }
    });

    this.app.keyboard.on(pc.EVENT_KEYUP, (event: { key: number }) => {
      const mapping: Record<number, keyof InputState> = {
        [pc.KEY_W]: 'forward', [pc.KEY_S]: 'backward',
        [pc.KEY_A]: 'left', [pc.KEY_D]: 'right',
        [pc.KEY_SHIFT]: 'sprint', [pc.KEY_SPACE]: 'jump',
        [pc.KEY_F]: 'interact', [pc.KEY_I]: 'inventory',
        [pc.KEY_C]: 'character', [pc.KEY_K]: 'skillPanel',
        [pc.KEY_L]: 'questPanel', [pc.KEY_P]: 'partyPanel',
        [pc.KEY_R]: 'mount',
      };

      const mapped = mapping[event.key];
      if (mapped) {
        (this.state[mapped] as boolean) = false;
      }
    });
  }

  getInput(): InputState {
    const current = { ...this.state };
    this.state.mouseDeltaX = 0;
    this.state.mouseDeltaY = 0;
    this.state.scrollDelta = 0;
    return current;
  }
}
