"use client";
export function Toast({ text }: { text: string }) {
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        background: "rgba(0,0,0,.55)",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: 10,
        fontSize: 13,
        backdropFilter: "blur(4px)",
      }}
    >
      {text}
    </div>
  );
}
