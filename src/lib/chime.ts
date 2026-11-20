let ctx: AudioContext | null = null;

/** Call from a click handler so the browser allows sound later. */
export function unlockAudio() {
  askNotificationsOnce();
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

/** Asks once, on the first Start, whether DeepOS may show a notification when time is up. */
function askNotificationsOnce() {
  try {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    if (localStorage.getItem("deepos.notify.asked") === "1") return;
    localStorage.setItem("deepos.notify.asked", "1");
    void Notification.requestPermission();
  } catch {
    /* notifications are optional */
  }
}

/** A system notification for time's up, so it reaches you in another app or tab. */
export function notifyTimeUp(task: string, minutes: number) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const n = new Notification("Time's up", {
      body: `${task}: ${minutes} minutes done. Wrap up, or add a little more time.`,
      icon: "/pwa-192.png",
      tag: "deepos-time-up",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* notifications are optional */
  }
}
