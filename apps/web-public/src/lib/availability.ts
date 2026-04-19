import type { PublicAvailabilityDay } from "@/data/api";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseYMD(ymd?: string): Date {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return new Date(NaN);
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toYMDUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toAvailabilityMonth(value?: string) {
  const date = parseYMD(value);
  if (Number.isNaN(+date)) {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function daysBetween(start?: string, end?: string): number {
  const s = parseYMD(start);
  const e = parseYMD(end);
  if (Number.isNaN(+s) || Number.isNaN(+e)) return 0;
  const diff = Math.ceil((e.getTime() - s.getTime()) / DAY_MS);
  return Math.max(diff, 0);
}

export function* eachDate(start?: string, end?: string) {
  const s = parseYMD(start);
  const e = parseYMD(end);
  if (Number.isNaN(+s) || Number.isNaN(+e) || s >= e) return;

  for (let d = s; d.getTime() < e.getTime(); d = new Date(d.getTime() + DAY_MS)) {
    yield toYMDUTC(d);
  }
}

export type SlotType = "jeep" | "transport" | "dokumentasi";
export type Slot = { time: string; available: boolean };

const DEFAULT_SLOT_START = 6;
const DEFAULT_SLOT_END = 17;
const DEFAULT_STEP_MIN = 60;

function timeStr(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getSlotsFor(
  date: string,
  _type: SlotType,
  opts?: { startHour?: number; endHour?: number; stepMinutes?: number; dateAvailable?: boolean }
): Slot[] {
  if (!date) return [];

  const startHour = opts?.startHour ?? DEFAULT_SLOT_START;
  const endHour = opts?.endHour ?? DEFAULT_SLOT_END;
  const step = opts?.stepMinutes ?? DEFAULT_STEP_MIN;
  const dateAvailable = opts?.dateAvailable ?? true;

  const out: Slot[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += step) {
      out.push({
        time: timeStr(h, m),
        available: dateAvailable,
      });
    }
  }
  return out;
}

export function mapAvailabilityByDate(items: PublicAvailabilityDay[]) {
  return new Map(items.map((item) => [item.date, item] as const));
}

export function isAvailabilityDayOpen(item?: PublicAvailabilityDay | null) {
  if (!item) return false;
  return item.isAvailable && !item.soldOut && item.remainingStock > 0;
}

export function isDateAvailable(
  date: string | undefined,
  availabilityMap: Map<string, PublicAvailabilityDay>
) {
  if (!date) return null;
  return isAvailabilityDayOpen(availabilityMap.get(date));
}

export function isRangeAvailable(
  start: string | undefined,
  end: string | undefined,
  availabilityMap: Map<string, PublicAvailabilityDay>
) {
  if (!start || !end) return null;
  if (daysBetween(start, end) <= 0) return false;

  for (const date of eachDate(start, end)) {
    if (!isAvailabilityDayOpen(availabilityMap.get(date))) {
      return false;
    }
  }

  return true;
}
