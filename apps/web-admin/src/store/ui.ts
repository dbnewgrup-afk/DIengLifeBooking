// apps/web-admin/src/store/ui.ts
// Store ringan untuk state UI global: sidebar, theme, busy overlay.

"use client";

import { useSyncExternalStore } from "react";

export type Theme = "system" | "light" | "dark";

type UIState = {
  sidebarOpen: boolean;
  theme: Theme;
  busy: boolean; // indikator proses global (fetch besar, route change, dsb.)
};

let state: UIState = {
  sidebarOpen: true,
  theme: "system",
  busy: false,
};

const subs = new Set<() => void>();

function emit() {
  for (const cb of Array.from(subs)) cb();
}
function getSnapshot(): UIState {
  return state;
}
function subscribe(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}

// Actions
export function toggleSidebar(next?: boolean) {
  state = { ...state, sidebarOpen: typeof next === "boolean" ? next : !state.sidebarOpen };
  emit();
}
export function setTheme(theme: Theme) {
  state = { ...state, theme };
  // opsional: sync ke <html data-theme="..."> atau localStorage
  try {
    document.documentElement.dataset.theme = theme;
  } catch { /* noop */ }
  emit();
}
export function setBusy(b: boolean) {
  state = { ...state, busy: b };
  emit();
}

// Hook publik
export function useUI() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    sidebarOpen: snap.sidebarOpen,
    theme: snap.theme,
    busy: snap.busy,
    // actions
    toggleSidebar,
    setTheme,
    setBusy,
  };
}
