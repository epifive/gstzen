"use client";

import { useSyncExternalStore } from "react";
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
      localStorage.setItem("gstzen:theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button type="button" onClick={toggle} className="btn-ghost px-2.5" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
      {dark ? <IconSun className="size-4" /> : <IconMoon className="size-4" />}
    </button>
  );
}

/** Inline script that applies the saved theme before paint. */
export const themeScript = `(function(){try{var t=localStorage.getItem("gstzen:theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;
