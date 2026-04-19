"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dict, type Lang, isLang } from "@/components/i18n/dict";

export type LangContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** t("id text", "en text") atau t("dictionary.key") */
  t: {
    (key: string): string;
    (id: string, en: string): string;
  };
  /** ambil dari kamus pakai key apa adanya; fallback: key */
  tr: (key: string) => string;
};

const LangCtx = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  // Hydrate awal dari localStorage/cookie/navigator
  useEffect(() => {
    let initial: string | null = null;
    try {
      initial = localStorage.getItem("lang");
    } catch {}
    if (!initial) {
      const fromCookie = document.cookie.match(/(?:^|;\\s*)lang=([^;]+)/)?.[1] ?? "";
      initial = fromCookie;
    }
    if (!initial) {
      initial = navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
    }
    setLangState(isLang(initial) ? (initial as Lang) : "id");
  }, []);

  // Persist & update <html lang>
  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch {}
    document.cookie = `lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang);
    }
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("langchange"));
    }
  };

  // t() overloading: t("key") atau t("Indo","English")
  const t: LangContextType["t"] = useCallback(((a: string, b?: string) => {
    if (typeof b === "string") {
      return lang === "en" ? b : a;
    }
    // single-arg -> cari di kamus
    const table = dict[lang] ?? {};
    return (table as Record<string, string>)[a] ?? a;
  }) as LangContextType["t"], [lang]);

  const tr: LangContextType["tr"] = useCallback((key) => {
    const table = dict[lang] ?? {};
    return (table as Record<string, string>)[key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, tr }), [lang, t, tr]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
