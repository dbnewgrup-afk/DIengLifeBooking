"use client";
import { useEffect, useState } from "react";
import { dict } from "./dict";
import { useLang } from "./lang";

export function useI18n() {
  const { lang } = useLang();
  const [, setBump] = useState(0);

  // Dengarkan event perubahan bahasa
  useEffect(() => {
    const h = () => setBump((x) => x + 1);
    window.addEventListener("langchange", h);
    return () => window.removeEventListener("langchange", h);
  }, []);

  const t = (key: keyof typeof dict) => dict[key]?.[lang] ?? String(key);
  return { t, lang };
}
