"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { ApiError, Role } from "@/lib/api/schemas";
import { useSession } from "@/store/session";

type AccessResponse = {
  userId: string;
  role: Role;
  permissions: {
    canManageAccounts: boolean;
    canReviewPasswordResets: boolean;
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "message" in error && typeof (error as ApiError).message === "string") {
    return (error as ApiError).message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function useAccountManagementAccess() {
  const { role } = useSession();
  const [access, setAccess] = useState<AccessResponse | null>(null);
  const [loading, setLoading] = useState(role === "ADMIN" || role === "SUPER_ADMIN");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        setAccess(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get<{ ok: true; item: AccessResponse }>("/account-management/me");
        if (!cancelled) {
          setAccess(response.item);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setAccess(null);
          setError(getErrorMessage(fetchError, "Gagal memuat permission account management."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [role]);

  return {
    access,
    loading,
    error,
    canOpenAccountManagement:
      access?.permissions.canManageAccounts === true ||
      access?.permissions.canReviewPasswordResets === true ||
      access?.role === "SUPER_ADMIN",
    canManageAccounts:
      access?.permissions.canManageAccounts === true || access?.role === "SUPER_ADMIN",
    canReviewPasswordResets:
      access?.permissions.canReviewPasswordResets === true || access?.role === "SUPER_ADMIN",
  };
}
