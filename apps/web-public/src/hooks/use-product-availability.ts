"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getProductAvailabilityMonth,
  getPublicApiErrorMessage,
  type PublicAvailabilityDay,
} from "@/data/api";
import { mapAvailabilityByDate } from "@/lib/availability";

export function useProductAvailability(
  productId: string,
  months: string | string[] | null
) {
  const [items, setItems] = useState<PublicAvailabilityDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedMonths = useMemo(() => {
    const values = Array.isArray(months) ? months : months ? [months] : [];
    return [...new Set(values.filter(Boolean))];
  }, [months]);

  useEffect(() => {
    if (!productId || normalizedMonths.length === 0) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const monthResults = await Promise.all(
          normalizedMonths.map((month) => getProductAvailabilityMonth(productId, month))
        );
        const nextItems = monthResults.flat();
        if (!cancelled) {
          setItems(nextItems);
        }
      } catch (cause) {
        if (!cancelled) {
          setItems([]);
          setError(
            getPublicApiErrorMessage(cause, "Availability produk belum bisa dimuat dari server.")
          );
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
  }, [normalizedMonths, productId]);

  const byDate = useMemo(() => mapAvailabilityByDate(items), [items]);

  return {
    items,
    byDate,
    loading,
    error,
  };
}
