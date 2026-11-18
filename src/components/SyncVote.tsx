import { useState } from "react";
import { trackEvent } from "../lib/analytics";
import { CheckIcon, LayersIcon } from "./Icons";

const KEY = "deepos.syncVote";

function hasVoted() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** A one-tap, honest vote: sync isn't built yet, this counts who would use it. One vote per device. */
export function SyncVote({ compact }: { compact?: boolean }) {
  const [voted, setVoted] = useState(hasVoted);

  const vote = () => {
    trackEvent("Sync vote");
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* still thank them */
    }
    setVoted(true);
  };

  return (
    <section className={compact ? "sync-vote compact" : "card sync-vote"} aria-labelledby="sync-title">
      <div className="sync-icon" aria-hidden="true">
        <LayersIcon />
      </div>
      <div className="sync-body">
        <h2 id="sync-title">Want DeepOS on all your devices?</h2>
        <p>
          Sync isn't available yet. Vote if you'd use it. If we build it, it will be end-to-end encrypted, so only you can read your
          tasks.
        </p>
      </div>
      {voted ? (
        <span className="sync-done" role="status">
          <CheckIcon /> Thanks, your vote is counted
        </span>
      ) : (
        <button type="button" className="primary small" onClick={vote}>
          Vote for sync
        </button>
      )}
    </section>
  );
}
