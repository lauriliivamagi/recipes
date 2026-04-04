export function playTimerAlarm(): void {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = i % 2 === 0 ? 880 : 1100;
      gain.gain.setValueAtTime(0.3, now + i * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 0.25);

      osc.start(now + i * 0.3);
      osc.stop(now + i * 0.3 + 0.25);
    }
  } catch {
    // Audio not available
  }
}
