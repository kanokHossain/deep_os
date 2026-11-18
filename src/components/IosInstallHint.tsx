import { createPortal } from "react-dom";
import { iosShareSpot } from "../lib/install";

/** iOS share glyph: a box with an arrow pointing up, as Apple draws it. */
const ShareGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" />
  </svg>
);

/**
 * iPhone and iPad can't be installed from a button, so point straight at the Share button instead.
 * Two short steps, with an arrow that sits right next to where the button is in this browser.
 */
export function IosInstallHint({ onClose, onMore }: { onClose: () => void; onMore: () => void }) {
  const { spot, how } = iosShareSpot();
  return createPortal(
    <div className="ios-hint-layer" onClick={onClose}>
      <div className={`ios-hint ios-${spot}`} role="dialog" aria-label="Add DeepOS to your Home Screen" onClick={(e) => e.stopPropagation()}>
        <div className="ios-arrow" aria-hidden="true" />
        <div className="ios-steps">
          <p>
            <b>1</b>
            <span>
              {how} <span className="ios-glyph"><ShareGlyph /></span>
            </span>
          </p>
          <p>
            <b>2</b>
            <span>
              Tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>
            </span>
          </p>
        </div>
        <div className="ios-actions">
          <button type="button" className="link" onClick={onMore}>
            More help
          </button>
          <button type="button" className="ghost small" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
