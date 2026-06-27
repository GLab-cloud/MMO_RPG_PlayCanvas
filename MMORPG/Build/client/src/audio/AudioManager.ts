export class AudioManager {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private bgmPlaying: boolean = false;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private gain(vol: number = 0.3): GainNode {
    const g = this.getCtx().createGain();
    g.gain.value = vol;
    g.connect(this.getCtx().destination);
    return g;
  }

  startLobbyBGM(): void {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.playLobbyBGMLoop();
  }

  startBGM(): void {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.playBGMLoop();
  }

  stopBGM(): void {
    this.bgmPlaying = false;
    if (this.bgmGain) { this.bgmGain.gain.value = 0; this.bgmGain = null; }
  }

  private playLobbyBGMLoop(): void {
    if (!this.bgmPlaying) return;
    const c = this.getCtx();
    const masterGain = c.createGain();
    masterGain.gain.value = 0.06;
    masterGain.connect(c.destination);
    this.bgmGain = masterGain;

    const playNote = (freq: number, start: number, dur: number, vol: number = 0.05, type: OscillatorType = 'triangle') => {
      const o = c.createOscillator(); o.type = type; o.frequency.value = freq;
      const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
      o.connect(g); g.connect(masterGain);
      o.start(c.currentTime + start); o.stop(c.currentTime + start + dur);
    };

    const melody: [number, number, number, number, OscillatorType][] = [
      [330, 0, 0.3, 0.05, 'triangle'],
      [262, 0.3, 0.2, 0.04, 'triangle'],
      [294, 0.5, 0.2, 0.04, 'triangle'],
      [330, 0.7, 0.4, 0.06, 'triangle'],
      [392, 1.1, 0.3, 0.05, 'triangle'],
      [349, 1.4, 0.2, 0.04, 'triangle'],
      [330, 1.6, 0.2, 0.04, 'triangle'],
      [294, 1.8, 0.4, 0.06, 'triangle'],
      [262, 2.2, 0.3, 0.05, 'triangle'],
      [330, 2.5, 0.3, 0.05, 'triangle'],
      [392, 2.8, 0.2, 0.04, 'triangle'],
      [440, 3.0, 0.4, 0.06, 'triangle'],
      [523, 3.4, 0.3, 0.05, 'triangle'],
      [440, 3.7, 0.2, 0.04, 'triangle'],
      [392, 3.9, 0.2, 0.04, 'triangle'],
      [349, 4.1, 0.4, 0.06, 'triangle'],
      [294, 4.5, 0.2, 0.04, 'triangle'],
      [262, 4.7, 0.2, 0.04, 'triangle'],
      [247, 4.9, 0.4, 0.06, 'triangle'],
      [220, 5.3, 0.3, 0.05, 'triangle'],
      [247, 5.6, 0.3, 0.05, 'triangle'],
      [262, 5.9, 0.6, 0.07, 'triangle'],
    ];
    melody.forEach(([freq, start, dur, vol, type]) => playNote(freq, start, dur, vol, type));

    const bassNotes: [number, number, number, number][] = [
      [131, 0, 1.2, 0.03],
      [131, 1.3, 0.5, 0.02],
      [165, 2.0, 1.2, 0.03],
      [165, 3.3, 0.5, 0.02],
      [196, 4.0, 1.2, 0.03],
      [196, 5.3, 0.5, 0.02],
    ];
    bassNotes.forEach(([freq, start, dur, vol]) => playNote(freq, start, dur, vol, 'sine'));

    const totalDuration = 6.5;
    setTimeout(() => {
      if (this.bgmPlaying) this.playLobbyBGMLoop();
    }, totalDuration * 1000);
  }

  private playBGMLoop(): void {
    if (!this.bgmPlaying) return;
    const c = this.getCtx();
    const masterGain = c.createGain();
    masterGain.gain.value = 0.06;
    masterGain.connect(c.destination);
    this.bgmGain = masterGain;

    const playNote = (freq: number, start: number, dur: number, vol: number = 0.04, type: OscillatorType = 'triangle') => {
      const o = c.createOscillator(); o.type = type; o.frequency.value = freq;
      const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
      o.connect(g); g.connect(masterGain);
      o.start(c.currentTime + start); o.stop(c.currentTime + start + dur);
    };

    const melody: [number, number, number, number, OscillatorType][] = [
      [523, 0, 0.4, 0.04, 'triangle'],
      [659, 0.5, 0.4, 0.04, 'triangle'],
      [784, 1.0, 0.6, 0.05, 'triangle'],
      [659, 1.7, 0.3, 0.03, 'triangle'],
      [587, 2.1, 0.4, 0.04, 'triangle'],
      [523, 2.6, 0.6, 0.05, 'triangle'],
      [440, 3.3, 0.4, 0.04, 'triangle'],
      [523, 3.8, 0.8, 0.06, 'triangle'],
      [659, 4.7, 0.4, 0.04, 'triangle'],
      [784, 5.2, 0.6, 0.05, 'triangle'],
      [880, 5.9, 0.4, 0.04, 'triangle'],
      [784, 6.4, 0.3, 0.03, 'triangle'],
      [659, 6.8, 0.4, 0.04, 'triangle'],
      [587, 7.3, 0.6, 0.05, 'triangle'],
      [523, 8.0, 1.0, 0.07, 'triangle'],
    ];
    melody.forEach(([freq, start, dur, vol, type]) => playNote(freq, start, dur, vol, type));

    const bassNotes: [number, number, number, number][] = [
      [262, 0, 1.0, 0.03],
      [294, 2.0, 1.0, 0.03],
      [330, 4.0, 1.0, 0.03],
      [262, 6.0, 1.0, 0.03],
      [247, 8.0, 1.0, 0.03],
    ];
    bassNotes.forEach(([freq, start, dur, vol]) => playNote(freq, start, dur, vol, 'sine'));

    const totalDuration = 9.0;
    setTimeout(() => this.playBGMLoop(), totalDuration * 1000);
  }

  playAttack(): void {
    const c = this.getCtx();
    const g = this.gain(0.1);
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(350, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(120, c.currentTime + 0.06);
    o.connect(g);
    o.start(); o.stop(c.currentTime + 0.08);
    const n = c.createBufferSource();
    const buf = c.createBuffer(1, c.sampleRate * 0.04, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.008));
    n.buffer = buf;
    const ng = this.gain(0.08);
    n.connect(ng);
    n.start();
  }

  playHit(): void {
    const c = this.getCtx();
    const g = this.gain(0.12);
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(250, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.1);
    o.connect(g);
    o.start(); o.stop(c.currentTime + 0.12);
    const n = c.createBufferSource();
    const buf = c.createBuffer(1, c.sampleRate * 0.06, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.01));
    n.buffer = buf;
    const ng = this.gain(0.08);
    n.connect(ng);
    n.start();
  }

  playCritical(): void {
    const c = this.getCtx();
    const g = this.gain(0.16);
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(800, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(1500, c.currentTime + 0.04);
    o.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.18);
    o.connect(g);
    o.start(); o.stop(c.currentTime + 0.22);
  }

  playDeath(): void {
    const c = this.getCtx();
    const g = this.gain(0.2);
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(500, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(20, c.currentTime + 0.8);
    o.connect(g);
    o.start(); o.stop(c.currentTime + 0.9);
  }

  playLevelUp(): void {
    const c = this.getCtx();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const g = this.gain(0.12);
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      o.start(c.currentTime + i * 0.12);
      o.stop(c.currentTime + i * 0.12 + 0.18);
    });
  }

  playPickup(): void {
    const c = this.getCtx();
    const g = this.gain(0.12);
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(500, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(1000, c.currentTime + 0.08);
    o.connect(g);
    o.start(); o.stop(c.currentTime + 0.12);
    const o2 = c.createOscillator();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(700, c.currentTime + 0.06);
    o2.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.14);
    const g2 = this.gain(0.08);
    o2.connect(g2);
    o2.start(c.currentTime + 0.06); o2.stop(c.currentTime + 0.18);
  }

  playEquip(): void {
    const c = this.getCtx();
    [400, 600, 800].forEach((freq, i) => {
      const g = this.gain(0.1);
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      o.connect(g);
      o.start(c.currentTime + i * 0.06);
      o.stop(c.currentTime + i * 0.06 + 0.1);
    });
  }

  playButton(): void {
    const c = this.getCtx();
    const g = this.gain(0.05);
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(700, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.03);
    o.connect(g);
    o.start(); o.stop(c.currentTime + 0.05);
  }

  playRespawn(): void {
    const c = this.getCtx();
    [200, 300, 400, 500, 600].forEach((freq, i) => {
      const g = this.gain(0.08);
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      o.connect(g);
      o.start(c.currentTime + i * 0.08);
      o.stop(c.currentTime + i * 0.08 + 0.08);
    });
  }

  playUiPanelOpen(): void {
    const c = this.getCtx();
    const g = this.gain(0.04);
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(500, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.12);
    o.connect(g); o.start(); o.stop(c.currentTime + 0.15);
  }

  playUiPanelClose(): void {
    const c = this.getCtx();
    const g = this.gain(0.03);
    const o = c.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(600, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.08);
    o.connect(g); o.start(); o.stop(c.currentTime + 0.1);
  }

  playUiMatchCreate(): void {
    const c = this.getCtx();
    [660, 880, 1047].forEach((f, i) => {
      const g = this.gain(0.06);
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      o.connect(g); o.start(c.currentTime + i * 0.1); o.stop(c.currentTime + i * 0.1 + 0.12);
    });
  }

  playUiMatchJoin(): void {
    const c = this.getCtx();
    [700, 900].forEach((f, i) => {
      const g = this.gain(0.05);
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      o.connect(g); o.start(c.currentTime + i * 0.08); o.stop(c.currentTime + i * 0.08 + 0.1);
    });
  }

  playUiMatchLeave(): void {
    const c = this.getCtx();
    const g = this.gain(0.04);
    const o = c.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(400, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.15);
    o.connect(g); o.start(); o.stop(c.currentTime + 0.18);
  }

  playUiMatchStart(): void {
    const c = this.getCtx();
    [440, 554, 659, 880].forEach((f, i) => {
      const g = this.gain(0.08);
      const o = c.createOscillator(); o.type = 'square';
      o.frequency.value = f;
      o.connect(g); o.start(c.currentTime + i * 0.12); o.stop(c.currentTime + i * 0.12 + 0.15);
    });
  }

  playNpcDialog(npcType: string): void {
    const c = this.getCtx();
    switch (npcType) {
      case 'shop': {
        [800, 1000, 1200].forEach((f, i) => {
          const g = this.gain(0.06);
          const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
          o.connect(g); o.start(c.currentTime + i * 0.05); o.stop(c.currentTime + i * 0.05 + 0.08);
        });
        break;
      }
      case 'bank': {
        [600, 400].forEach((f, i) => {
          const g = this.gain(0.07);
          const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
          o.connect(g); o.start(c.currentTime + i * 0.08); o.stop(c.currentTime + i * 0.08 + 0.1);
        });
        break;
      }
      case 'storage': {
        const g = this.gain(0.1);
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 80;
        o.connect(g); o.start(); o.stop(c.currentTime + 0.08);
        break;
      }
      case 'quest': {
        [660, 880].forEach((f, i) => {
          const g = this.gain(0.06);
          const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
          o.connect(g); o.start(c.currentTime + i * 0.1); o.stop(c.currentTime + i * 0.1 + 0.12);
        });
        break;
      }
      case 'skill': {
        [1200, 1500, 1800].forEach((f, i) => {
          const g = this.gain(0.04);
          const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
          o.connect(g); o.start(c.currentTime + i * 0.06); o.stop(c.currentTime + i * 0.06 + 0.15);
        });
        break;
      }
      case 'class': {
        [440, 660, 880].forEach((f, i) => {
          const g = this.gain(0.07);
          const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
          o.connect(g); o.start(c.currentTime + i * 0.08); o.stop(c.currentTime + i * 0.08 + 0.1);
        });
        break;
      }
      case 'transport': {
        const g = this.gain(0.05);
        const o = c.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(200, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.3);
        o.connect(g); o.start(); o.stop(c.currentTime + 0.35);
        break;
      }
      case 'guard': {
        const g = this.gain(0.08);
        const o = c.createOscillator(); o.type = 'square';
        o.frequency.setValueAtTime(400, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.06);
        o.connect(g); o.start(); o.stop(c.currentTime + 0.08);
        break;
      }
      default: {
        const g = this.gain(0.05);
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 700;
        o.connect(g); o.start(); o.stop(c.currentTime + 0.06);
      }
    }
  }

  playMonsterDeath(): void {
    const c = this.getCtx();
    const g = this.gain(0.15);
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(250, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(15, c.currentTime + 0.45);
    o.connect(g);
    o.start(); o.stop(c.currentTime + 0.5);
  }

  playPlayerHit(): void {
    const c = this.getCtx();
    const g = this.gain(0.15);
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(300, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.12);
    o.connect(g);
    o.start(); o.stop(c.currentTime + 0.15);
    const n = c.createBufferSource();
    const buf = c.createBuffer(1, c.sampleRate * 0.07, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.008));
    n.buffer = buf;
    const ng = this.gain(0.08);
    n.connect(ng);
    n.start();
  }

  playXP(): void {
    const c = this.getCtx();
    const g = this.gain(0.08);
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(600, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.06);
    o.connect(g);
    o.start(); o.stop(c.currentTime + 0.1);
    const o2 = c.createOscillator();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(800, c.currentTime + 0.04);
    o2.frequency.exponentialRampToValueAtTime(1400, c.currentTime + 0.1);
    const g2 = this.gain(0.06);
    o2.connect(g2);
    o2.start(c.currentTime + 0.04); o2.stop(c.currentTime + 0.14);
  }
}
