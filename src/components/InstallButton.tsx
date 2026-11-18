import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  clearDeferredPrompt,
  detectPlatform,
  getDeferredPrompt,
  GUIDES,
  isInstalled,
  subscribeInstall,
  type Platform,
} from "../lib/install";
import { DownloadIcon } from "./Icons";
import { IosInstallHint } from "./IosInstallHint";
import { toast } from "./Toast";

/** "Install app" for every browser: one click where supported, clear steps everywhere else. */
export function InstallButton() {
  const deferred = useSyncExternalStore(subscribeInstall, getDeferredPrompt);
  const [installed, setInstalled] = useState(isInstalled);
  const [help, setHelp] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [platform] = useState<Platform>(() => detectPlatform());

  useEffect(() => subscribeInstall(() => setInstalled(isInstalled())), []);

  if (installed) return null;

  const install = async () => {
    const prompt = getDeferredPrompt();
    if (!prompt) {
      if (platform === "ios") setIosHint(true);
      else setHelp(true);
      return;
    }
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    clearDeferredPrompt();
    if (outcome === "accepted") {
      setInstalled(true);
      toast("DeepOS is installed");
    }
  };

  const guide = GUIDES[platform];
  const others = (Object.keys(GUIDES) as Platform[]).filter(
    (p) => p !== platform && p !== "android-other" && p !== "desktop-other",
  );

  return (
    <>
      <button type="button" className={deferred ? "ghost small install ready" : "ghost small install"} onClick={install}>
        <DownloadIcon />
        <span>Install app</span>
      </button>
      {iosHint && (
        <IosInstallHint
          onClose={() => setIosHint(false)}
          onMore={() => {
            setIosHint(false);
            setHelp(true);
          }}
        />
      )}
      {help &&
        createPortal(
        <div className="overlay" onClick={() => setHelp(false)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setHelp(false);
            }}
          >
            <div className="dialog-head">
              <h2 id="install-title">Install DeepOS</h2>
              <button type="button" className="ghost small" onClick={() => setHelp(false)} autoFocus>
                Close
              </button>
            </div>
            <p className="hint">
              DeepOS installs from your browser in seconds. No app store, no download file, and your data stays on your device.
            </p>
            <div className="guide">
              <h3>{guide.browser}</h3>
              <ol className="steps">
                {guide.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              {guide.note && <p className="guide-note">{guide.note}</p>}
            </div>
            <details className="other-guides">
              <summary>Using a different browser or device?</summary>
              {others.map((p) => (
                <div key={p} className="guide small-guide">
                  <h3>{GUIDES[p].browser}</h3>
                  <ol className="steps">
                    {GUIDES[p].steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </details>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
