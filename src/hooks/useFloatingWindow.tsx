import { useCallback, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MiniWindow } from "../components/MiniWindow";

interface DocumentPictureInPicture {
  requestWindow(opts: { width: number; height: number }): Promise<Window>;
  window: Window | null;
}
declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

/** Copy every stylesheet into the floating window so it looks like the app. */
function copyStyles(target: Window) {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const css = Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
      const style = target.document.createElement("style");
      style.textContent = css;
      target.document.head.appendChild(style);
    } catch {
      // Cross-origin sheet (Google Fonts): link it instead.
      if (sheet.href) {
        const link = target.document.createElement("link");
        link.rel = "stylesheet";
        link.href = sheet.href;
        target.document.head.appendChild(link);
      }
    }
  }
  const theme = document.documentElement.getAttribute("data-theme");
  if (theme) target.document.documentElement.setAttribute("data-theme", theme);
}

/**
 * An always-on-top mini timer using the Document Picture-in-Picture API
 * (Chrome, Edge, Brave and other Chromium browsers, version 116+). It stays above every other app while you work.
 */
export function useFloatingWindow() {
  const supported = typeof window !== "undefined" && "documentPictureInPicture" in window;
  const [isOpen, setOpen] = useState(false);

  const close = useCallback(() => {
    window.documentPictureInPicture?.window?.close();
  }, []);

  const open = useCallback(async () => {
    if (!window.documentPictureInPicture) return false;
    if (window.documentPictureInPicture.window) return true;
    try {
      const pip = await window.documentPictureInPicture.requestWindow({ width: 340, height: 260 });
      copyStyles(pip);
      pip.document.title = "DeepOS";
      pip.document.body.classList.add("mini-body");
      const mount = pip.document.createElement("div");
      pip.document.body.appendChild(mount);
      const root: Root = createRoot(mount);
      root.render(<MiniWindow win={pip} onClose={() => pip.close()} />);
      setOpen(true);
      pip.addEventListener("pagehide", () => {
        root.unmount();
        setOpen(false);
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => close, [close]);

  return { supported, isOpen, open, close };
}
