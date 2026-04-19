"use client";

import { useEffect, useState } from "react";
import SellerDashboardPage from "./SellerDashboardPage";
import AffiliateDashboardPage from "./AffiliateDashboardPage";
import { getRole } from "@/lib/auth/session";

export default function SellerRoutePage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getRole() ?? null);
  }, []);

  if (role === "AFFILIATE") {
    return <AffiliateDashboardPage />;
  }

  return <SellerDashboardPage />;
}
