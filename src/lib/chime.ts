let ctx: AudioContext | null = null;

/** Call from a click handler so the browser allows sound later. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** A soft three-note chime, synthesized so the app ships no audio files. */
export function playChime() {
  if (!ctx) return;
  const notes = [659.25, 783.99, 1046.5];
  const t0 = ctx.currentTime;
  notes.forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = t0 + i * 0.22;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(t);
    osc.stop(t + 1.2);
  });
}
