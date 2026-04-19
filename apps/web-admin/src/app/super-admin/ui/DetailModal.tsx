"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  meta?: Array<{ label: string; value: string }>;
  data?: unknown;
  content?: ReactNode;
  showRawData?: boolean;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
};

export default function DetailModal({
  open,
  onClose,
  title,
  subtitle,
  meta = [],
  data,
  content,
  showRawData = false,
  footer,
  size = "lg",
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const maxWidth = modalWidth(size);

  return (
    createPortal(
      <div style={overlayStyle}>
        <div style={backdropStyle} onClick={onClose} aria-hidden="true" />
        <div style={viewportStyle}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            style={{ ...modalStyle, maxWidth }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={accentBarStyle} />
            <div style={ambientGlowTopStyle} aria-hidden="true" />
            <div style={ambientGlowBottomStyle} aria-hidden="true" />
            <div style={headerStyle}>
              <div style={headerBadgeStyle}>Super Admin Detail</div>
              <div style={{ paddingRight: 52, position: "relative", zIndex: 1 }}>
                <h2 style={titleStyle}>{title}</h2>
                {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
              </div>
              <button type="button" onClick={onClose} aria-label="Tutup popup" style={closeButtonStyle}>
                &#10005;
              </button>
            </div>

            <div style={bodyStyle}>
              <div className="grid gap-5">
                {meta.length ? (
                  <div style={sectionCardStyle}>
                    <div style={sectionEyebrowStyle}>Quick Facts</div>
                    <div style={metaGridStyle}>
                      {meta.map((item) => (
                        <div key={item.label} style={metaCardStyle}>
                          <div style={metaLabelStyle}>{item.label}</div>
                          <div style={metaValueStyle}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {content ? <div style={contentWrapStyle}>{content}</div> : null}

                {showRawData ? (
                  <div style={rawDataWrapStyle}>
                    <div style={rawDataTitleStyle}>Raw Payload</div>
                    <pre style={rawPreStyle}>
                      {typeof data === "string" ? data : JSON.stringify(data ?? {}, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            </div>

            {footer ? <div style={footerStyle}>{footer}</div> : null}
          </div>
        </div>
      </div>,
      document.body
    )
  );
}

function modalWidth(size: "sm" | "md" | "lg" | "xl") {
  if (size === "sm") return 520;
  if (size === "md") return 720;
  if (size === "xl") return 1120;
  return 960;
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1200,
};

const backdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(2, 6, 23, 0.56)",
  backdropFilter: "blur(8px)",
};

const viewportStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  padding: 16,
};

const modalStyle: CSSProperties = {
  position: "relative",
  width: "min(100%, 960px)",
  maxHeight: "calc(100vh - 32px)",
  overflow: "hidden",
  borderRadius: 32,
  border: "1px solid rgba(255,255,255,0.58)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 52%, rgba(241,245,249,0.98) 100%)",
  boxShadow: "0 34px 96px rgba(15,23,42,0.36)",
};

const headerStyle: CSSProperties = {
  position: "relative",
  padding: "20px 22px 18px",
  borderBottom: "1px solid rgba(148,163,184,0.16)",
  background:
    "radial-gradient(circle at top right, rgba(56,189,248,0.22), transparent 28%), linear-gradient(135deg, #0f172a 0%, #0f3b74 58%, #0f766e 100%)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#f8fafc",
  fontSize: 24,
  fontWeight: 900,
  lineHeight: 1.2,
  letterSpacing: "-0.03em",
};

const subtitleStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "rgba(226,232,240,0.88)",
  fontSize: 14,
  lineHeight: 1.6,
};

const closeButtonStyle: CSSProperties = {
  position: "absolute",
  top: 16,
  right: 16,
  zIndex: 2,
  width: 42,
  height: 42,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.24)",
  background: "rgba(255,255,255,0.12)",
  color: "#f8fafc",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  backdropFilter: "blur(12px)",
  boxShadow: "0 10px 24px rgba(15,23,42,0.16)",
};

const bodyStyle: CSSProperties = {
  position: "relative",
  maxHeight: "calc(100vh - 222px)",
  overflowY: "auto",
  overflowX: "hidden",
  padding: "22px",
  background:
    "radial-gradient(circle at top left, rgba(191,219,254,0.28), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.4), rgba(248,250,252,0.82))",
};

const footerStyle: CSSProperties = {
  borderTop: "1px solid rgba(148,163,184,0.18)",
  background: "linear-gradient(180deg, rgba(248,250,252,0.84), rgba(241,245,249,0.96))",
  padding: "16px 22px",
};

const accentBarStyle: CSSProperties = {
  position: "absolute",
  inset: "0 0 auto 0",
  height: 4,
  background: "linear-gradient(90deg, #38bdf8 0%, #22c55e 55%, #facc15 100%)",
};

const ambientGlowTopStyle: CSSProperties = {
  position: "absolute",
  top: -82,
  right: -54,
  width: 220,
  height: 220,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(56,189,248,0.08) 48%, transparent 72%)",
  pointerEvents: "none",
};

const ambientGlowBottomStyle: CSSProperties = {
  position: "absolute",
  bottom: -120,
  left: -60,
  width: 240,
  height: 240,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 46%, transparent 72%)",
  pointerEvents: "none",
};

const headerBadgeStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "inline-flex",
  alignItems: "center",
  marginBottom: 12,
  borderRadius: 999,
  padding: "6px 10px",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(226,232,240,0.94)",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: ".14em",
  textTransform: "uppercase",
};

const sectionCardStyle: CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(203,213,225,0.62)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))",
  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
  padding: 18,
};

const sectionEyebrowStyle: CSSProperties = {
  marginBottom: 14,
  color: "#0f766e",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: ".16em",
  textTransform: "uppercase",
};

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const metaCardStyle: CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(186,230,253,0.9)",
  background: "linear-gradient(180deg, rgba(239,246,255,0.92), rgba(248,250,252,0.96))",
  padding: "14px 15px",
  minHeight: 92,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.72)",
};

const metaLabelStyle: CSSProperties = {
  marginBottom: 10,
  color: "#64748b",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: ".14em",
  textTransform: "uppercase",
};

const metaValueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const contentWrapStyle: CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(226,232,240,0.94)",
  background: "rgba(255,255,255,0.84)",
  boxShadow: "0 16px 36px rgba(15,23,42,0.06)",
  padding: 18,
};

const rawDataWrapStyle: CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(15,23,42,0.08)",
  background:
    "linear-gradient(180deg, rgba(2,6,23,0.98) 0%, rgba(15,23,42,0.98) 100%)",
  boxShadow: "0 24px 48px rgba(15,23,42,0.18)",
  padding: 18,
};

const rawDataTitleStyle: CSSProperties = {
  marginBottom: 12,
  color: "#67e8f9",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: ".16em",
  textTransform: "uppercase",
};

const rawPreStyle: CSSProperties = {
  maxHeight: 420,
  overflow: "auto",
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  color: "#e2e8f0",
  fontSize: 12,
  lineHeight: 1.75,
  fontFamily: "Consolas, 'Courier New', monospace",
};
