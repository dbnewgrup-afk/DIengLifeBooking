"use client";

import type { CSSProperties, MouseEvent } from "react";

type Props = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  disableEdit?: boolean;
  disableDelete?: boolean;
  compact?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
};

const baseButton: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,.35)",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 800,
  cursor: "pointer",
};

function buttonStyle(compact: boolean, tone: "view" | "edit" | "delete", disabled = false): CSSProperties {
  const palette =
    tone === "view"
      ? { border: "rgba(56,174,204,.35)", background: "rgba(56,174,204,.12)", color: "#0f3b4c" }
      : tone === "edit"
        ? { border: "rgba(59,130,246,.32)", background: "rgba(59,130,246,.12)", color: "#1d4ed8" }
        : { border: "rgba(248,113,113,.32)", background: "rgba(248,113,113,.12)", color: "#991b1b" };

  return {
    ...baseButton,
    border: `1px solid ${palette.border}`,
    background: palette.background,
    color: palette.color,
    padding: compact ? "6px 10px" : "8px 12px",
    fontSize: compact ? 11 : 12,
    opacity: disabled ? 0.45 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

export default function ActionButtons({
  onView,
  onEdit,
  onDelete,
  disableEdit = false,
  disableDelete = false,
  compact = true,
  showEdit = true,
  showDelete = true,
}: Props) {
  function handleClick(handler?: () => void) {
    return (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handler?.();
    };
  }

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 6 }}>
      <button type="button" onClick={handleClick(onView)} style={buttonStyle(compact, "view")}>
        View
      </button>
      {showEdit ? (
        <button
          type="button"
          onClick={disableEdit ? undefined : handleClick(onEdit)}
          disabled={disableEdit}
          style={buttonStyle(compact, "edit", disableEdit)}
          title={disableEdit ? "Edit belum tersedia langsung dari panel ini." : "Edit data"}
        >
          Edit
        </button>
      ) : null}
      {showDelete ? (
        <button
          type="button"
          onClick={disableDelete ? undefined : handleClick(onDelete)}
          disabled={disableDelete}
          style={buttonStyle(compact, "delete", disableDelete)}
          title={disableDelete ? "Delete belum tersedia langsung dari panel ini." : "Delete data"}
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}
