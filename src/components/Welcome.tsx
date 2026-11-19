import { useEffect, useRef } from "react";
import { LockIcon, LogoMark, PopoutIcon, ThoughtIcon, ClockIcon } from "./Icons";

const SEEN_KEY = "deepos.welcome.seen";

export function welcomeSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markWelcomeSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage unavailable: the welcome may show again next visit */
  }
}

/** A one-screen explanation of DeepOS for first-time visitors. Also opened from "How it works". */
export function WelcomeDialog({ onClose, canPop }: { onClose: () => void; canPop: boolean }) {
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    startRef.current?.focus();
  }, []);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog welcome"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-sub"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <LogoMark size={48} />
        <h2 id="welcome-title">Welcome to DeepOS</h2>
        <p id="welcome-sub" className="welcome-sub">
          A focus timer that also catches the thoughts that pull you away.
        </p>
        <ol className="welcome-steps">
          <li>
            <span className="ws-icon teal">
              <ClockIcon />
            </span>
            <span>
              <b>Pick one task and start the timer.</b>
              <small>15, 25 or 45 minutes, or open-ended.</small>
            </span>
          </li>
          <li>
            <span className="ws-icon amber">
              <ThoughtIcon />
            </span>
            <span>
              <b>A thought pops up? Dump it.</b>
              <small>It waits in your Brain dump, so you can stay on task.</small>
            </span>
          </li>
          <li>
            <span className="ws-icon teal">
              <PopoutIcon />
            </span>
            <span>
              <b>Pop out to keep your task in view.</b>
              <small>
                {canPop
                  ? "A small window floats over every other app."
                  : "On a computer in Chrome, Edge or Brave, a small window floats over every other app."}
              </small>
            </span>
          </li>
        </ol>
        <button ref={startRef} type="button" className="primary welcome-go" onClick={onClose}>
          Let's focus
        </button>
        <p className="welcome-note">
          <LockIcon /> Free, no sign-up. Everything stays in your browser.
        </p>
      </div>
    </div>
  );
}
