export const C: Record<string, any> = {
  page: {
    minHeight: "100svh",
    background:
      "radial-gradient(60% 50% at 15% -10%, rgba(56,174,204,.18), transparent 60%), radial-gradient(55% 40% at 90% -10%, rgba(124,58,237,.18), transparent 60%), linear-gradient(180deg, #0b2a3a 0%, #3b28a0 100%)",
  },
  container: { maxWidth: 1200, margin: "0 auto", padding: "16px 16px 28px" },

  header: {
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  title: { color: "#fff", fontSize: 28, fontWeight: 900, margin: 0 },
  subtitle: { color: "rgba(255,255,255,.88)", fontSize: 14, marginTop: 2 },

  tabsWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,.40)",
    border: "1px solid rgba(255,255,255,.45)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 5,
  },
  tab: {
    borderRadius: 999,
    padding: "8px 14px",
    border: "1px solid rgba(255,255,255,.55)",
    background: "transparent",
    color: "rgba(255,255,255,.9)",
    fontWeight: 800,
    cursor: "pointer",
  },
  tabActive: {
    background: "rgba(255,255,255,.88)",
    border: "1px solid rgba(255,255,255,.9)",
    color: "#002b3f",
  },
  badge: {
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "6px 10px",
    background:
      "linear-gradient(180deg, rgba(16,185,129,.14), rgba(16,185,129,.20))",
    border: "1px solid #a7f3d0",
    color: "#065f46",
    fontSize: 12,
    fontWeight: 800,
  },

  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: 12,
    marginTop: 12,
  },
  statCard: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    background: "rgba(255,255,255,0.86)",
    border: "1px solid rgba(255,255,255,0.70)",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 12px 30px rgba(2,47,64,.20)",
    color: "#0f172a",
  },

  panel: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.99))",
    border: "1px solid #d1e5f0",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 26px rgba(2,47,64,.12)",
    marginTop: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#102a43",
    marginBottom: 10,
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },

  label: {
    fontSize: 12,
    color: "#244a5b",
    fontWeight: 800,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(2,47,64,0.15)",
    background: "rgba(255,255,255,0.92)",
    fontSize: 14,
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(2,47,64,0.15)",
    background: "rgba(255,255,255,0.92)",
    fontSize: 14,
    outline: "none",
    appearance: "none",
    backgroundImage:
      "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.86))",
  },
  mutedSmall: { color: "#4b6475", fontSize: 12 },

  btnPrimary: {
    borderRadius: 999,
    padding: "12px 18px",
    border: "1px solid rgba(255,255,255,.6)",
    background:
      "linear-gradient(180deg, rgba(56,174,204,.35), rgba(2,95,124,.35))",
    color: "#062a36",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 10px 26px rgba(2,47,64,.18), inset 0 1px 0 rgba(255,255,255,.6)",
  },

  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 },
  th: {
    textAlign: "left",
    color: "#244a5b",
    fontWeight: 900,
    borderBottom: "1px solid #e4f0f7",
    padding: "10px 12px",
  },
  td: { padding: "10px 12px", borderBottom: "1px solid #eef5fa" },

  chip: (color: "green" | "orange" | "red") => ({
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
    color:
      color === "green"
        ? "#065f46"
        : color === "orange"
        ? "#7c2d12"
        : "#7f1d1d",
    background:
      color === "green"
        ? "linear-gradient(180deg, rgba(16,185,129,.14), rgba(16,185,129,.20))"
        : color === "orange"
        ? "linear-gradient(180deg, rgba(251,191,36,.20), rgba(251,146,60,.18))"
        : "linear-gradient(180deg, rgba(244,63,94,.14), rgba(244,63,94,.20))",
    border:
      color === "green"
        ? "1px solid #a7f3d0"
        : color === "orange"
        ? "1px solid #fde68a"
        : "1px solid #fecdd3",
  }),
};
