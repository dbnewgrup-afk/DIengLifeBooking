"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AdminTab } from "../ui/Tabs";

export const DEFAULT_ADMIN_TAB: AdminTab = "OVERVIEW";

const VALID_TABS = new Set<AdminTab>([
  "OVERVIEW",
  "CONTROL",
  "PRODUCTS",
  "PROMOTIONS",
  "SELLERS",
  "TRANSACTIONS",
  "REPORTS",
]);

export function normalizeAdminTab(value?: string | null): AdminTab {
  if (!value) return DEFAULT_ADMIN_TAB;
  return VALID_TABS.has(value as AdminTab) ? (value as AdminTab) : DEFAULT_ADMIN_TAB;
}

export function useAdminTabState() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSearch(window.location.search.replace(/^\?/, ""));
  }, [pathname]);

  const activeTab = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    return normalizeAdminTab(searchParams.get("tab"));
  }, [search]);

  const setActiveTab = useCallback(
    (nextTab: AdminTab) => {
      const nextParams = new URLSearchParams(search);
      if (nextTab === DEFAULT_ADMIN_TAB) {
        nextParams.delete("tab");
      } else {
        nextParams.set("tab", nextTab);
      }

      const query = nextParams.toString();
      setSearch(query);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, search]
  );

  return { activeTab, setActiveTab };
}
