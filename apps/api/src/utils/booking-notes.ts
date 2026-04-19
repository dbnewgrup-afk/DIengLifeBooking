export type BookingAddonSnapshot = {
  key: string;
  label: string;
  price: number;
  enabled: boolean;
};

export type BookingCustomerSnapshot = {
  name?: string;
  email?: string;
  phone?: string | null;
  identityNumber?: string | null;
};

export type BookingNotesSnapshot = {
  source?: string;
  channel?: string;
  customer?: BookingCustomerSnapshot;
  booking?: {
    notes?: string | null;
    guestCount?: number | null;
    quantity?: number | null;
    durationUnits?: number | null;
    chargeUnits?: number | null;
    baseSubtotal?: number | null;
    addonTotal?: number | null;
    addons?: BookingAddonSnapshot[];
    schedule?: {
      time?: string | null;
      hours?: number | null;
      route?: string | null;
      unitLabel?: string | null;
    } | null;
  };
  promo?: Record<string, unknown> | null;
  [key: string]: unknown;
};

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parseBookingNotes(notes?: string | null): BookingNotesSnapshot {
  if (!notes) {
    return {};
  }

  try {
    const parsed = JSON.parse(notes) as unknown;
    return asObject(parsed) ?? {};
  } catch {
    return {};
  }
}

export function mergeBookingNotes(
  notes: string | null | undefined,
  patch: Record<string, unknown>
) {
  return JSON.stringify({
    ...parseBookingNotes(notes),
    ...patch,
  });
}

export function getBookingCustomerSnapshot(
  snapshot?: BookingNotesSnapshot | null
): BookingCustomerSnapshot | null {
  const customer = asObject(snapshot?.customer);
  if (!customer) {
    return null;
  }

  return {
    name: typeof customer.name === "string" ? customer.name : undefined,
    email: typeof customer.email === "string" ? customer.email : undefined,
    phone:
      typeof customer.phone === "string" || customer.phone === null
        ? (customer.phone as string | null)
        : undefined,
    identityNumber:
      typeof customer.identityNumber === "string" || customer.identityNumber === null
        ? (customer.identityNumber as string | null)
        : undefined,
  };
}

export function getBookingNoteText(
  snapshot?: BookingNotesSnapshot | null
): string | null {
  const booking = asObject(snapshot?.booking);
  if (!booking) {
    return null;
  }

  return typeof booking.notes === "string" && booking.notes.trim()
    ? booking.notes.trim()
    : null;
}

export function getEnabledBookingAddons(
  snapshot?: BookingNotesSnapshot | null
): BookingAddonSnapshot[] {
  const booking = asObject(snapshot?.booking);
  const rawAddons = Array.isArray(booking?.addons) ? booking.addons : [];
  const addons: BookingAddonSnapshot[] = [];

  for (const addon of rawAddons) {
    const value = asObject(addon);
    if (!value) {
      continue;
    }

    const key = typeof value.key === "string" ? value.key.trim() : "";
    const label = typeof value.label === "string" ? value.label.trim() : "";
    const priceValue =
      typeof value.price === "number" ? value.price : Number(value.price);
    const enabled =
      typeof value.enabled === "boolean"
        ? value.enabled
        : Boolean(value.enabled);

    if (!key || !label || !Number.isFinite(priceValue) || priceValue < 0 || !enabled) {
      continue;
    }

    addons.push({
      key,
      label,
      price: Math.round(priceValue),
      enabled: true,
    });
  }

  return addons;
}

export function getBookingAddonTotal(
  snapshot?: BookingNotesSnapshot | null
) {
  const booking = asObject(snapshot?.booking);
  const addonTotalValue =
    typeof booking?.addonTotal === "number"
      ? booking.addonTotal
      : Number(booking?.addonTotal ?? 0);

  if (Number.isFinite(addonTotalValue) && addonTotalValue > 0) {
    return Math.round(addonTotalValue);
  }

  return getEnabledBookingAddons(snapshot).reduce(
    (sum, addon) => sum + addon.price,
    0
  );
}
