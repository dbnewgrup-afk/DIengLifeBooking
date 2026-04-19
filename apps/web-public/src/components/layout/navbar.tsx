"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/components/i18n/lang";
import { useI18n } from "@/components/i18n/useI18n";
import { clearPublicSession, getPublicRole, getPublicToken, resolvePublicSession } from "@/lib/auth";
import { appendPublicReturnTo } from "@/lib/public-redirect";

type Key = "villa" | "jeep" | "rent" | "dokumentasi";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [solid, setSolid] = useState(false);
  const [hasBuyerSession, setHasBuyerSession] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [queryString, setQueryString] = useState("");

  const { lang, setLang } = useLang();
  const { t } = useI18n();

  // Solid ketika bukan home, atau saat scroll > 24px
  useEffect(() => {
    const shouldSolidInitial = pathname !== "/";
    const onScroll = () => setSolid(shouldSolidInitial || window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    const hasStoredBuyerSession = Boolean(getPublicToken()) && getPublicRole() === "USER";

    if (!hasStoredBuyerSession) {
      setHasBuyerSession(false);
      return;
    }

    let active = true;

    void resolvePublicSession("USER")
      .then((session) => {
        if (active) {
          setHasBuyerSession(Boolean(session));
        }
      })
      .catch(() => {
        if (active) {
          setHasBuyerSession(false);
        }
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setQueryString(window.location.search.replace(/^\?/, ""));
  }, [pathname]);

  async function handleBuyerLogout() {
    if (logoutLoading) {
      return;
    }

    setLogoutLoading(true);

    try {
      await clearPublicSession();
      setHasBuyerSession(false);
      router.replace("/login/user");
      router.refresh();
    } finally {
      setLogoutLoading(false);
    }
  }

  // Aktif untuk 4 menu utama
  const active = useMemo<Key | undefined>(() => {
    const segs = pathname.split("/").filter(Boolean);
    if (segs[0] === "product" && segs[1]) {
      const t = segs[1];
      if (t === "villa" || t === "jeep" || t === "dokumentasi") return t;
      if (t === "transport") return "rent";
    }
    const first = segs[0];
    if (first === "villa" || first === "jeep" || first === "dokumentasi") return first;
    if (first === "rent") return "rent";
    return undefined;
  }, [pathname]);

  const isPromo = pathname.startsWith("/promo");
  const loginHref = useMemo(() => {
    const isAuthArea = pathname.startsWith("/login") || pathname.startsWith("/register");
    if (isAuthArea) {
      return "/login/user";
    }

    const returnTo = `${pathname}${queryString ? `?${queryString}` : ""}`;
    return appendPublicReturnTo("/login/user", returnTo);
  }, [pathname, queryString]);

  const toggleLang = () => {
    const nextLang = lang === "id" ? "en" : "id";
    setLang(nextLang);
    router.refresh();
  };

  const pill = (size: "lg" | "sm", isActive = false) => {
    const sizeCls = size === "lg" ? "px-5 py-2 text-base md:text-lg" : "px-4 py-1.5 text-sm";
    const base = `${sizeCls} rounded-full font-semibold transition-colors`;
    if (solid) {
      return isActive
        ? `${base} bg-white text-[var(--text)] border border-[var(--line)]`
        : `${base} bg-[rgba(0,0,0,.06)] text-[var(--text)] hover:bg-[rgba(0,0,0,.09)] ring-1 ring-[rgba(0,0,0,.05)]`;
    }
    return isActive
      ? `${base} bg-white/95 text-[var(--text)]`
      : `${base} bg-white/15 text-white hover:bg-white/25 ring-1 ring-white/20 backdrop-blur-[1px]`;
  };

  return (
    <header
      id="site-navbar"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300
        ${solid ? "navbar-solid" : "navbar-transparent"}
        ${solid ? "backdrop-blur supports-[backdrop-filter]:bg-white/75 border-b" : ""}
      `}
      style={solid ? { borderColor: "var(--brand-50)" } : undefined}
      aria-label="Navigasi utama"
    >
      <div className="container-page">
        {/* BARIS 1 */}
        <div className="h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="Beranda">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={180}
              height={52}
              priority
              className="h-auto w-[180px] object-contain"
            />
          </Link>

          <nav className="flex items-center gap-3" aria-label="Aksi utama">
            <Link
              href="/booking"
              className={pill("sm", pathname.startsWith("/booking"))}
              aria-current={pathname.startsWith("/booking") ? "page" : undefined}
            >
              {t("nav_booking")}
            </Link>
            <button
              type="button"
              onClick={toggleLang}
              className={pill("sm")}
              aria-label={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
            >
              {lang === "id" ? t("lang_toggle_to_en") : t("lang_toggle_to_id")}
            </button>
          </nav>
        </div>

        {/* BARIS 2 */}
        <div className="h-14 flex items-center justify-between">
          <nav className="flex flex-wrap items-center gap-3 md:gap-4" aria-label="Menu utama">
            <Link href="/villa" className={pill("lg", active === "villa")} aria-current={active === "villa" ? "page" : undefined}>
              {t("menu_villa")}
            </Link>
            <Link href="/jeep" className={pill("lg", active === "jeep")} aria-current={active === "jeep" ? "page" : undefined}>
              {t("menu_jeep")}
            </Link>
            <Link href="/rent" className={pill("lg", active === "rent")} aria-current={active === "rent" ? "page" : undefined}>
              {t("menu_rent")}
            </Link>
            <Link href="/dokumentasi" className={pill("lg", active === "dokumentasi")} aria-current={active === "dokumentasi" ? "page" : undefined}>
              {t("menu_docs")}
            </Link>
            <Link href="/promo" className={pill("lg", isPromo)} aria-current={isPromo ? "page" : undefined}>
              {t("menu_promo")}
            </Link>
          </nav>

          <nav className="flex items-center gap-3" aria-label="Menu sekunder">
            {hasBuyerSession ? (
              <>
                <Link href="/dashboard" className={pill("sm", pathname.startsWith("/dashboard"))}>
                  {t("nav_dashboard")}
                </Link>
                <button
                  type="button"
                  onClick={handleBuyerLogout}
                  disabled={logoutLoading}
                  className={`${pill("sm")} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {logoutLoading ? t("nav_logging_out") : t("nav_logout")}
                </button>
              </>
            ) : (
              <Link href={loginHref} className={pill("sm", pathname.startsWith("/login"))}>
                {t("nav_login")}
              </Link>
            )}
            <Link href="/bantuan" className={pill("sm")}>
              {t("nav_help")}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
