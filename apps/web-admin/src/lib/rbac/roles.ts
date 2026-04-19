// apps/web-admin/src/lib/rbac/roles.ts
// Definisi Role + helper izin minimal.

import type { Role } from "../api/schemas";

// Definisikan aksi yang relevan di admin v1.
// Tambah di sini kalau ada fitur baru biar konsisten lintas tim FE/BE.
export type Action =
  | "view_dashboard"
  | "view_orders"
  | "verify_order"
  | "mark_cash"
  | "view_products"
  | "edit_products"
  | "view_partners"
  | "view_affiliates"
  | "view_approvals"
  | "approve_item"
  | "view_payouts"
  | "run_payout"
  | "view_reports"
  | "view_settings"
  | "edit_settings";

// Prioritas role untuk fallback check
export function rolePriority(r?: Role): number {
  switch (r) {
    case "SUPER_ADMIN": return 5;
    case "ADMIN":       return 4;
    case "KASIR":       return 3;
    case "SELLER":      return 2;
    case "PARTNER":     return 2;
    case "USER":        return 1;
    case "AFFILIATE":   return 1;
    default:            return 0;
  }
}

// Matriks izin sederhana per role.
// Prinsip:
// - SUPER_ADMIN punya semua
// - ADMIN hampir semua
// - KASIR fokus order & mark cash
// - PARTNER dipertahankan hanya sebagai alias legacy dari SELLER
// - AFFILIATE punya fase aktivasi terpisah
const PERMS: Record<Role, Set<Action>> = {
  SUPER_ADMIN: new Set<Action>([
    "view_dashboard","view_orders","verify_order","mark_cash",
    "view_products","edit_products",
    "view_partners","view_affiliates",
    "view_approvals","approve_item",
    "view_payouts","run_payout",
    "view_reports",
    "view_settings","edit_settings",
  ]),
  ADMIN: new Set<Action>([
    "view_dashboard","view_orders","verify_order","mark_cash",
    "view_products","edit_products",
    "view_partners","view_affiliates",
    "view_approvals","approve_item",
    "view_payouts", // run_payout bisa dibatasi opsional
    "view_reports",
    "view_settings","edit_settings",
  ]),
  KASIR: new Set<Action>([
    "view_dashboard","view_orders","verify_order","mark_cash",
    "view_reports",
  ]),
  SELLER: new Set<Action>([
    "view_dashboard","view_reports",
  ]),
  PARTNER: new Set<Action>([
    "view_dashboard","view_reports",
  ]),
  USER: new Set<Action>([]),
  AFFILIATE: new Set<Action>([
    "view_dashboard","view_reports",
  ]),
};

// Helper API
export function can(role: Role | undefined) {
  return {
    do(action: Action): boolean {
      if (!role) return false;
      if (role === "SUPER_ADMIN") return true;
      return PERMS[role]?.has(action) ?? false;
    },
    // Kadang perlu gabungan beberapa aksi
    any(actions: Action[]): boolean {
      return actions.some((a) => this.do(a));
    },
    all(actions: Action[]): boolean {
      return actions.every((a) => this.do(a));
    },
  };
}

// Utility untuk guard minimum role tanpa spesifik aksi
export function hasMinRole(role: Role | undefined, min: Role): boolean {
  return rolePriority(role) >= rolePriority(min);
}
