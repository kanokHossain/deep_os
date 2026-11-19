import { useCallback, useEffect, useState } from "react";

export type Theme = "auto" | "light" | "dark";
const KEY = "deepos.theme";
const ORDER: Theme[] = ["auto", "light", "dark"];

function read(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "auto";
  } catch {
    return "auto";
  }
}

/** Light, dark, or follow the device. Stored per browser; "auto" removes the override. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    try {
      if (theme === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      /* storage unavailable: the choice lasts for this visit */
    }
  }, [theme]);
  const cycle = useCallback(() => setTheme((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]), []);
  return { theme, cycle };
}
