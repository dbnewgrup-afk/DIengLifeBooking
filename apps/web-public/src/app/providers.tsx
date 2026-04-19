"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CartProvider } from "@/store/cart";
import { captureAffiliateAttribution } from "@/lib/affiliate-attribution";

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const searchParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();

    void captureAffiliateAttribution({
      pathname,
      searchParams,
    });
  }, [pathname]);

  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}

export default AppProviders;
