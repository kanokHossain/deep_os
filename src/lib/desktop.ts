/** Bridge exposed by the DeepOS desktop app (see desktop/preload.cjs). Absent in a normal browser. */
interface DesktopBridge {
  toggleMini: () => void;
  platform: string;
}
declare global {
  interface Window {
    deeposDesktop?: DesktopBridge;
  }
}
export const desktop = typeof window !== "undefined" ? window.deeposDesktop : undefined;
