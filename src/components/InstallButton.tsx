import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/** "Install app" in the top bar: one click on Chrome/Edge/Android, short steps on iPhone. */
export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!deferred && !isIOS())) return null;

  return (
    <>
      <button
        type="button"
        className="ghost small install"
        onClick={async () => {
          if (deferred) {
            await deferred.prompt();
            const { outcome } = await deferred.userChoice;
            if (outcome === "accepted") setInstalled(true);
            setDeferred(null);
          } else {
            setIosHelp(true);
          }
        }}
      >
        Install app
      </button>
      {iosHelp && (
        <div className="overlay" onClick={() => setIosHelp(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="ios-title" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-head">
              <h2 id="ios-title">Add DeepOS to your Home Screen</h2>
              <button type="button" className="ghost small" onClick={() => setIosHelp(false)}>
                Close
              </button>
            </div>
            <ol className="steps">
              <li>Tap the Share button at the bottom of Safari.</li>
              <li>Choose “Add to Home Screen”.</li>
              <li>Tap Add. DeepOS opens full screen, like any app.</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
