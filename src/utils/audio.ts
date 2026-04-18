export type AlarmType = 'buzzer' | 'whistle' | 'horn';

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

function createWhistle(ctx: AudioContext, volume: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2400, ctx.currentTime);
  osc.frequency.setValueAtTime(2600, ctx.currentTime + 0.1);
  osc.frequency.setValueAtTime(2400, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.8);
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

export function playAlarm(type: AlarmType, volume: number): void {
  try {
    const ctx = new AudioContext();
    const v = volume / 100;
    if (type === 'buzzer') createBuzzer(ctx, v);
    else if (type === 'whistle') createWhistle(ctx, v);
    else createHorn(ctx, v);
  } catch {
    // ignore
  }
}
