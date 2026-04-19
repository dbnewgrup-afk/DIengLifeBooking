import type { CSSProperties } from "react";

const GAP = 16;
const GAP_L = 20;
const PAD_CARD = 20;

const inputBase: CSSProperties = {
  width: "100%",
  height: 42,
  borderRadius: 12,
  padding: "0 12px",
  fontSize: 14,
  outline: "none",
  border: "1px solid #cfe3ef",
};
const inputLight: CSSProperties = { ...inputBase, background: "#fff", color: "#0f172a" };
const selectLight: CSSProperties = { ...inputLight, padding: "0 10px" };
const inputDark: CSSProperties = {
  ...inputBase,
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.28)",
  color: "#e6f7ff",
  boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset",
};

export const S: Record<string, CSSProperties | any> = {
  page: {
    minHeight: "100svh",
    background:
      "radial-gradient(60% 50% at 15% -10%, rgba(56,174,204,.18), transparent 60%), radial-gradient(55% 40% at 90% -10%, rgba(124,58,237,.18), transparent 60%), linear-gradient(180deg, #0b2a3a 0%, #3b28a0 100%)",
  },
  container: { maxWidth: 1200, margin: "0 auto", padding: `20px 20px 32px` },

  header: {
    display: "flex",
    gap: GAP,
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 14,
    padding: PAD_CARD,
    marginBottom: GAP,
  },
  title: { color: "#fff", fontSize: 28, fontWeight: 900, margin: 0, lineHeight: 1.2 },

  tabs: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    gap: GAP,
    padding: 8,
    borderRadius: 999,
    background: "linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.16))",
    border: "1px solid rgba(255,255,255,.40)",
    backdropFilter: "blur(12px)",
    margin: `${GAP}px 0 ${GAP_L}px`,
    flexWrap: "wrap",
  },
  tab: {
    borderRadius: 999,
    padding: "10px 16px",
    border: "1px solid rgba(255,255,255,.40)",
    background: "transparent",
    color: "#eef9ff",
    fontWeight: 800,
    cursor: "pointer",
    transition: "background 120ms, color 120ms, border-color 120ms",
  },
  tabActive: { background: "rgba(255,255,255,.88)", border: "1px solid rgba(255,255,255,.9)", color: "#053343" },

  gridAuto: (min = 220) =>
    ({ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: GAP_L } as CSSProperties),

  card: {
    background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.99))",
    border: "1px solid #d1e5f0",
    borderRadius: 16,
    padding: PAD_CARD,
    boxShadow: "0 10px 26px rgba(2,47,64,.12)",
  },
  kpiNumber: { fontSize: 28, fontWeight: 900, color: "#0f172a" },
  kpiLabel: { fontSize: 12, color: "#6b7280", marginTop: 4 },

  meterTrack: { height: 12, borderRadius: 999, background: "#e6f1f7", overflow: "hidden", border: "1px solid #d1e5f0" },
  meterFill: { height: "100%", background: "#38AECC", borderRadius: 999 },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 },
  th: { padding: 10, textAlign: "left", color: "#5c7086", fontSize: 12, background: "rgba(248,252,255,.7)" },
  td: { padding: 10, borderTop: "1px solid #e4f0f7" },

  badge: (tone: "info" | "good" | "warn" | "danger") => ({
    display: "inline-flex",
    borderRadius: 999,
    padding: "3px 10px",
    fontSize: 11,
    border: "1px solid",
    ...(tone === "good"
      ? { background: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0" }
      : tone === "warn"
      ? { background: "#fffbeb", color: "#92400e", borderColor: "#fde68a" }
      : tone === "danger"
      ? { background: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }
      : { background: "#f0f9ff", color: "#0369a1", borderColor: "#bae6fd" }),
  }),

  label: { display: "block", fontSize: 12, fontWeight: 800, color: "#244a5b", marginBottom: 6 },

  inputLight,
  selectLight,
  inputDark,

  btn: {
    borderRadius: 999,
    padding: "12px 16px",
    border: "1px solid rgba(16,185,129,.6)",
    background: "linear-gradient(180deg, rgba(16,185,129,.28), rgba(5,122,85,.28))",
    color: "#062a36",
    fontWeight: 900,
    cursor: "pointer",
  },

  toast: (ok: boolean): CSSProperties => ({
    marginTop: GAP,
    borderRadius: 12,
    padding: "12px 14px",
    border: ok ? "1px solid #a7f3d0" : "1px solid #fecdd3",
    color: ok ? "#065f46" : "#7f1d1d",
    background: ok
      ? "linear-gradient(180deg, rgba(16,185,129,.12), rgba(16,185,129,.18))"
      : "linear-gradient(180deg, rgba(244,63,94,.12), rgba(244,63,94,.18))",
  }),
};
