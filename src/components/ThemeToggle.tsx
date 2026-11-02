"use client";

import { useSyncExternalStore } from "react";
import { LEGACY_THEME_KEY, THEME_KEY } from "@/lib/keys";
import { IconMoon, IconSun } from "./icons";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {}
  };
  return (
    <button type="button" onClick={toggle} className="btn-ghost px-2.5" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
      {dark ? <IconSun className="size-4" /> : <IconMoon className="size-4" />}
    </button>
  );
}

/** Inline script that applies the saved theme before paint (and moves a pre-rename theme key once). */
export const themeScript = `(function(){try{var s=localStorage,t=s.getItem("${THEME_KEY}");if(t===null){t=s.getItem("${LEGACY_THEME_KEY}");if(t!==null){s.setItem("${THEME_KEY}",t);s.removeItem("${LEGACY_THEME_KEY}")}}if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;
