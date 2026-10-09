// Web Audio API Synthesizer - 100% self-contained, zero external audio assets

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private ambientInterval: number | null = null;
  private isAmbientPlaying: boolean = false;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbient();
    }
    return this.isMuted;
  }

  // Subtle tactile button tap sound
  public playButtonTap() {
    this.playClick();
  }

  // Rich mechanical locking tumble followed by resonant golden chime for vault unlocking
  public playVaultUnlock() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      
      // Part 1: Heavy brass tumbler mechanism click-clack
      [0, 0.06, 0.12].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + idx * 80, ctx.currentTime + offset);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + offset + 0.05);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.05);
      });

      // Part 2: Golden resonance chime
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const startTime = ctx.currentTime + 0.18 + index * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.9);
      });
    } catch {}
  }

  // Fizzy celebratory pop sound with pitch sweep and glitter burst
  public playConfettiPop() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      
      // Dual festive pops
      [0, 0.08].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, ctx.currentTime + offset);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + offset + 0.08);

        gain.gain.setValueAtTime(0.25, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.08);
      });

      // High glitter sizzle
      const bufferSize = Math.floor(ctx.sampleRate * 0.3);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.25;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2500, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  // Tactile mechanical vault key click
  public playClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Error buzz for incorrect PIN
  public playErrorBuzz() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(130, ctx.currentTime);
      osc2.frequency.setValueAtTime(136, ctx.currentTime); // detuned

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch {}
  }

  // Magical sparkling chime for vault unlock and golden flare
  public playMagicalChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6

      notes.forEach((freq, index) => {
        const startTime = ctx.currentTime + index * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.8);
      });
    } catch {}
  }

  // Wind blow sound for blowing candles (gentle slow breeze)
  public playWindBlow() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const duration = 3.2;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate soft pink/white breeze noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.35;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(280, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 1.2);
      filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 3.0);
      filter.Q.setValueAtTime(2.0, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1.0);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 2.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + duration);
    } catch {}
  }

  // Cheers and celebration fanfare
  public playCheers() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      // Fanfare chords: C Major arpeggios + sustained cheer roar
      const chordNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];

      chordNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + 1.8);
      });

      // Crowd excitement shimmer
      const bufferSize = ctx.sampleRate * 2.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 2.2);
    } catch {}
  }

  // Metallic cake knife slice sound
  public playKnifeSlice() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  // Delicious cute bite sound with sweet sparkle pop
  public playCakeBite() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const t = ctx.currentTime;
      
      // Soft crispy nibble pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.08);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);

      // Cute sweet resonance chime
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(1318.51, t + 0.04); // E6
      chimeGain.gain.setValueAtTime(0.15, t + 0.04);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(t + 0.04);
      chime.stop(t + 0.4);
    } catch {}
  }

  // Adorable sweet cat meow and gentle purring sound
  public playCatPurrMeow() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const t = ctx.currentTime;

      // 1. Sweet Meow Vocal Pitch Sweep (440Hz -> 720Hz -> 520Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(720, t + 0.15);
      osc.frequency.exponentialRampToValueAtTime(500, t + 0.42);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t);
      filter.frequency.linearRampToValueAtTime(2400, t + 0.15);
      filter.frequency.exponentialRampToValueAtTime(900, t + 0.42);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);

      // 2. Soft Purring Vibration (Low frequency rumble)
      const purrOsc = ctx.createOscillator();
      const purrGain = ctx.createGain();
      purrOsc.type = 'sine';
      purrOsc.frequency.setValueAtTime(28, t);
      purrGain.gain.setValueAtTime(0.14, t);
      purrGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      purrOsc.connect(purrGain);
      purrGain.connect(ctx.destination);
      purrOsc.start(t);
      purrOsc.stop(t + 0.5);

      // 3. Gentle magical starlight sparkle chime
      [880, 1174.66, 1396.91].forEach((freq, i) => {
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq, t + 0.1 + i * 0.06);
        chimeGain.gain.setValueAtTime(0.06, t + 0.1 + i * 0.06);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4 + i * 0.06);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chimeOsc.start(t + 0.1 + i * 0.06);
        chimeOsc.stop(t + 0.4 + i * 0.06);
      });
    } catch {}
  }

  // Play gentle celesta Happy Birthday melody
  public playHappyBirthdayMelody() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      // Notes: G4, G4, A4, G4, C5, B4 | G4, G4, A4, G4, D5, C5
      const melody = [
        { f: 392.00, d: 0.35, pause: 0.05 }, // G4
        { f: 392.00, d: 0.35, pause: 0.05 }, // G4
        { f: 440.00, d: 0.55, pause: 0.05 }, // A4
        { f: 392.00, d: 0.55, pause: 0.05 }, // G4
        { f: 523.25, d: 0.55, pause: 0.05 }, // C5
        { f: 493.88, d: 0.90, pause: 0.15 }, // B4

        { f: 392.00, d: 0.35, pause: 0.05 }, // G4
        { f: 392.00, d: 0.35, pause: 0.05 }, // G4
        { f: 440.00, d: 0.55, pause: 0.05 }, // A4
        { f: 392.00, d: 0.55, pause: 0.05 }, // G4
        { f: 587.33, d: 0.55, pause: 0.05 }, // D5
        { f: 523.25, d: 0.95, pause: 0.20 }, // C5
      ];

      let curTime = ctx.currentTime + 0.05;
      melody.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, curTime);

        // Add soft warm bell envelope
        gain.gain.setValueAtTime(0.14, curTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, curTime + note.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(curTime);
        osc.stop(curTime + note.d);

        curTime += note.d + note.pause;
      });
    } catch {}
  }

  // Soft ambient piano chords loop
  public startAmbient() {
    if (this.isMuted || this.isAmbientPlaying) return;
    this.isAmbientPlaying = true;

    const chords = [
      [349.23, 440.00, 523.25, 659.25], // Fmaj7
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [196.00, 246.94, 293.66, 392.00], // G
    ];
    let chordIdx = 0;

    const playNextChord = () => {
      if (!this.isAmbientPlaying || this.isMuted) return;
      try {
        const ctx = this.initContext();
        const chord = chords[chordIdx % chords.length];
        chordIdx++;

        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 3.2);
        });
      } catch {}
    };

    playNextChord();
    this.ambientInterval = window.setInterval(playNextChord, 3500);
  }

  public stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }
}

export const sound = new SoundEngine();
