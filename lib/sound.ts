// Web Audio Synthesizer for Florist Order Alerts (Zero external audio files required)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Pre-warms / resumes the AudioContext on user interaction (e.g. PIN click or sound toggle).
 */
export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

/**
 * Plays a pleasant, warm, physical chime tone.
 * - "standard": Dual harmonic bell chime (E5 -> B5)
 * - "rush": Triple ascending alert chime (E5 -> A5 -> C#6)
 */
export function playOrderAlertSound(type: "standard" | "rush" = "standard"): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === "rush") {
      // ⚡ Rush Alert: Triple energetic ascending bell
      const freqs = [659.25, 880.0, 1108.73]; // E5 -> A5 -> C#6
      freqs.forEach((freq, idx) => {
        const startTime = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });

      // Mobile haptic vibration if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([150, 80, 150]);
      }
    } else {
      // 🔔 Standard Alert: Dual warm harmonic bell chime
      const freqs = [659.25, 987.77]; // E5 -> B5
      freqs.forEach((freq, idx) => {
        const startTime = now + idx * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Blend sine with subtle overtone
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.28, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.65);
      });

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([120]);
      }
    }
  } catch (err) {
    console.warn("Audio chime play error:", err);
  }
}

