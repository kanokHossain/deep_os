import { trackEvent } from "./analytics";

/**
 * Install support for every browser.
 * Chrome, Edge, Samsung Internet, Opera and Brave fire `beforeinstallprompt`, often before React
 * mounts, so we catch it here as soon as the page loads. Other browsers get step-by-step help.
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    trackEvent("App installed");
    deferred = null;
    installedFlag = true;
    notify();
  });
}

let installedFlag = false;

export function getDeferredPrompt() {
  return deferred;
}
export function clearDeferredPrompt() {
  deferred = null;
  notify();
}
export function subscribeInstall(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function isInstalled(): boolean {
  if (installedFlag) return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type Platform =
  | "ios"
  | "android-chrome"
  | "android-samsung"
  | "android-firefox"
  | "android-other"
  | "mac-safari"
  | "desktop-chrome"
  | "desktop-edge"
  | "desktop-opera"
  | "desktop-firefox"
  | "desktop-other";

export function detectPlatform(ua = navigator.userAgent): Platform {
  const iPadOS = /Macintosh/.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  if (/Android/.test(ua)) {
    if (/SamsungBrowser/.test(ua)) return "android-samsung";
    if (/Firefox/.test(ua)) return "android-firefox";
    if (/Chrome/.test(ua)) return "android-chrome";
    return "android-other";
  }
  if (/Edg\//.test(ua)) return "desktop-edge";
  if (/OPR\//.test(ua)) return "desktop-opera";
  if (/Firefox\//.test(ua)) return "desktop-firefox";
  if (/Chrome\//.test(ua)) return "desktop-chrome";
  if (/Safari\//.test(ua) && /Macintosh/.test(ua)) return "mac-safari";
  return "desktop-other";
}

export interface InstallGuide {
  browser: string;
  steps: string[];
  note?: string;
}

export const GUIDES: Record<Platform, InstallGuide> = {
  ios: {
    browser: "iPhone and iPad (Safari, Chrome or Edge)",
    steps: [
      "Tap the Share button (the square with an arrow pointing up).",
      "Scroll down and tap “Add to Home Screen”.",
      "Tap Add. DeepOS now opens full screen from your Home Screen.",
    ],
    note: "In Chrome or Edge on iPhone, the Share button is in the address bar. Needs iOS 16.4 or later.",
  },
  "android-chrome": {
    browser: "Chrome on Android",
    steps: ["Tap the ⋮ menu at the top right.", "Tap “Install app” (or “Add to Home screen”).", "Tap Install."],
  },
  "android-samsung": {
    browser: "Samsung Internet",
    steps: ["Tap the ☰ menu at the bottom.", "Tap “Add page to”, then “Home screen”.", "Tap Add."],
  },
  "android-firefox": {
    browser: "Firefox on Android",
    steps: ["Tap the ⋮ menu.", "Tap “Install” (or “Add to Home screen”).", "Tap Add."],
  },
  "android-other": {
    browser: "Your Android browser",
    steps: ["Open the browser menu.", "Look for “Install app” or “Add to Home screen”.", "Confirm to add DeepOS."],
  },
  "mac-safari": {
    browser: "Safari on Mac",
    steps: ["In the menu bar, choose File → “Add to Dock…”.", "Click Add.", "Open DeepOS from your Dock or Launchpad, like any app."],
    note: "Needs macOS Sonoma (14) or later. You can also use the Share button → “Add to Dock”.",
  },
  "desktop-chrome": {
    browser: "Chrome on your computer",
    steps: [
      "Click the install icon at the right end of the address bar (a screen with a down arrow).",
      "Click Install.",
      "No icon? Open the ⋮ menu → “Cast, save, and share” → “Install page as app…”.",
    ],
  },
  "desktop-edge": {
    browser: "Microsoft Edge",
    steps: [
      "Click the “App available” icon in the address bar.",
      "Click Install.",
      "No icon? Open the ⋯ menu → Apps → “Install this site as an app”.",
    ],
  },
  "desktop-opera": {
    browser: "Opera or Brave",
    steps: ["Click the install icon in the address bar, or open the browser menu.", "Choose “Install DeepOS”.", "Click Install."],
  },
  "desktop-firefox": {
    browser: "Firefox on your computer",
    steps: [
      "Firefox on desktop can't install web apps yet.",
      "Open deepos-ashy.vercel.app in Chrome, Edge or Safari and install it from there.",
      "Or keep using DeepOS right here in Firefox. Everything works the same.",
    ],
  },
  "desktop-other": {
    browser: "Your browser",
    steps: [
      "Open the browser menu and look for “Install app” or “Add to Dock / Home screen”.",
      "If there's no such option, open DeepOS in Chrome, Edge or Safari to install it.",
    ],
  },
};

/** Where the Share button is on iPhone/iPad, so the hint can point right at it. */
export type IosSpot = "top-right" | "bottom-center" | "bottom-right";
export function iosShareSpot(ua = navigator.userAgent): { spot: IosSpot; how: string } {
  const iPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1);
  if (/CriOS|EdgiOS/.test(ua)) return { spot: "top-right", how: "Tap Share in the address bar" };
  if (/FxiOS/.test(ua)) return { spot: "bottom-right", how: "Tap the menu, then Share" };
  if (iPad) return { spot: "top-right", how: "Tap Share at the top" };
  return { spot: "bottom-center", how: "Tap Share below (or ••• then Share)" };
}
