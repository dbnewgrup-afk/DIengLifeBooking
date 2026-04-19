export const tokens = {
  bg:
    "radial-gradient(60% 50% at 15% -10%, rgba(56,174,204,.18), transparent 60%), radial-gradient(55% 40% at 90% -10%, rgba(124,58,237,.18), transparent 60%), linear-gradient(180deg, #0b2a3a 0%, #3b28a0 100%)",
};

export const layout = {
  page: {
    minHeight: "100svh",
    background: tokens.bg,
  } as React.CSSProperties,
  container: { maxWidth: 1200, margin: "0 auto", padding: "16px 16px 28px" } as React.CSSProperties,
  header: {
    display: "flex",
    gap: 9,
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 9,
  } as React.CSSProperties,
  title: { color: "#fff", fontSize: 28, fontWeight: 900, margin: 0 } as React.CSSProperties,
  subtitle: { color: "rgba(255,255,255,.88)", fontSize: 14, marginTop: 4 } as React.CSSProperties,
};

export const tabs = {
  wrap: {
    position: "sticky",
    top: 0,
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    padding: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,.40)",
    border: "1px solid rgba(255,255,255,.45)",
    backdropFilter: "blur(12px)",
  } as React.CSSProperties,
  tab: {
    borderRadius: 999,
    padding: "8px 14px",
    border: "1px solid rgba(255,255,255,.55)",
    background: "transparent",
    color: "rgba(255,255,255,.9)",
    fontWeight: 800,
    cursor: "pointer",
  } as React.CSSProperties,
  active: {
    background: "rgba(255,255,255,.88)",
    border: "1px solid rgba(255,255,255,.9)",
    color: "#002b3f",
  } as React.CSSProperties,
  badgeSuccess: {
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "6px 10px",
    background: "linear-gradient(180deg, rgba(16,185,129,.14), rgba(16,185,129,.20))",
    border: "1px solid #a7f3d0",
    color: "#065f46",
    fontSize: 12,
    fontWeight: 800,
  } as React.CSSProperties,
};

export const grid = {
  three: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginTop: 12 } as React.CSSProperties,
};

export const card = {
  stat: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    background: "rgba(255,255,255,0.86)",
    border: "1px solid rgba(255,255,255,0.70)",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 12px 30px rgba(2,47,64,.20)",
    backdropFilter: "blur(8px)",
    color: "#0f172a",
  } as React.CSSProperties,
  panel: {
    background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.99))",
    border: "1px solid #d1e5f0",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 26px rgba(2,47,64,.12)",
  } as React.CSSProperties,
  panelTitle: { fontSize: 14, fontWeight: 900, color: "#102a43", marginBottom: 10 } as React.CSSProperties,
  rightSticky: { position: "sticky", top: 12, alignSelf: "start" } as React.CSSProperties,
  totalBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    background: "linear-gradient(180deg, rgba(56,174,204,.08), rgba(56,174,204,.14))",
    border: "1px solid rgba(56,174,204,.35)",
  } as React.CSSProperties,
};

export const form = {
  grid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) 360px",
    gap: 12,
  } as React.CSSProperties,
  field: { marginBottom: 12 } as React.CSSProperties,
  label: { display: "block", fontSize: 12, fontWeight: 800, color: "#244a5b", marginBottom: 6 } as React.CSSProperties,
  input: {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: "1px solid #cfe3ef",
    padding: "0 12px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
  } as React.CSSProperties,
  select: {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: "1px solid #cfe3ef",
    padding: "0 10px",
    fontSize: 14,
    background: "#fff",
    outline: "none",
  } as React.CSSProperties,
  hint: { fontSize: 12, color: "#6b7280", marginTop: 4 } as React.CSSProperties,
  qtyRow: { display: "flex", gap: 8, alignItems: "center" } as React.CSSProperties,
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1px solid #cfe3ef",
    background: "linear-gradient(180deg, #ffffff, #f6fbff)",
    cursor: "pointer",
    fontWeight: 900,
    color: "#073047",
  } as React.CSSProperties,
  footer: {
    position: "sticky",
    bottom: -16,
    marginTop: 14,
    paddingTop: 8,
    background: "linear-gradient(180deg, transparent, rgba(255,255,255,.85))",
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  } as React.CSSProperties,
  primary: {
    borderRadius: 999,
    padding: "12px 18px",
    border: "1px solid rgba(255,255,255,.6)",
    background: "linear-gradient(180deg, rgba(56,174,204,.3), rgba(2,95,124,.3))",
    color: "#062a36",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 26px rgba(2,47,64,.18), inset 0 1px 0 rgba(255,255,255,.6)",
  } as React.CSSProperties,
};

export const misc = {
  line: { height: 1, background: "#e4f0f7", margin: "10px 0" } as React.CSSProperties,
  row: { display: "flex", justifyContent: "space-between", fontSize: 14, margin: "6px 0" } as React.CSSProperties,
  rowMuted: { color: "#334155" } as React.CSSProperties,
};

export const toast = (ok: boolean): React.CSSProperties => ({
  marginTop: 12,
  borderRadius: 12,
  padding: "10px 12px",
  border: `1px solid ${ok ? "rgba(16,185,129,.5)" : "rgba(244,63,94,.45)"}`,
  color: ok ? "#065f46" : "#7f1d1d",
  background: ok
    ? "linear-gradient(180deg, rgba(16,185,129,.12), rgba(16,185,129,.18))"
    : "linear-gradient(180deg, rgba(244,63,94,.12), rgba(244,63,94,.18))",
});
