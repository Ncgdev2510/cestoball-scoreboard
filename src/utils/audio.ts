export type AlarmType = 'buzzer' | 'whistle-short' | 'whistle-long';

function createBuzzer(ctx: AudioContext, volume: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 1.2);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1.4);
}

function createWhistle(ctx: AudioContext, volume: number, isShort = false): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2400, ctx.currentTime);
  osc.frequency.setValueAtTime(2600, ctx.currentTime + 0.1);
  osc.frequency.setValueAtTime(2400, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
  
  const duration = isShort ? 0.4 : 0.8;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function createHorn(ctx: AudioContext, volume: number): void {
  const frequencies = [220, 440, 880];
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime((volume * 0.3) / (i + 1), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2);
  });
}

const SOUND_FILES: Record<AlarmType, string> = {
  'buzzer': '/sounds/buzzer.wav',
  'whistle-short': '/sounds/whistle-short.wav',
  'whistle-long': '/sounds/whistle.wav',
};

export function playAlarm(type: AlarmType, volume: number): void {
  const v = volume / 100;
  
  // Intentar reproducir archivo de audio
  const audio = new Audio(SOUND_FILES[type]);
  audio.volume = v;
  
  audio.play().catch(() => {
    // Si falla (ej: archivo no existe), usar respaldo sintético
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (type === 'buzzer') createBuzzer(ctx, v);
      else if (type === 'whistle-short') createWhistle(ctx, v, true);
      else if (type === 'whistle-long') createWhistle(ctx, v, false);
    } catch (e) {
      console.error('Error playing sound backup:', e);
    }
  });
}
