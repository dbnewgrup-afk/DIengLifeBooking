"use client";
import React from "react";

export function TableFrame({
  children,
  minWidth = 760,
}: {
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div
      style={{
        overflowX: "auto",
        overflowY: "hidden",
        borderRadius: 18,
        border: "1px solid rgba(207,227,239,.9)",
        background: "rgba(255,255,255,.92)",
        boxShadow: "0 12px 28px rgba(15,23,42,.08)",
      }}
    >
      <div style={{ width: "max-content", minWidth }}>{children}</div>
    </div>
  );
}

export function BaseTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <table
      style={{
        width: "max-content",
        minWidth: "100%",
        tableLayout: "auto",
        borderCollapse: "separate",
        borderSpacing: 0,
        fontSize: 14,
      }}
    >
      {children}
    </table>
  );
}

export function Th(props: React.ComponentPropsWithoutRef<"th">) {
  return (
    <th
      {...props}
      style={{
        padding: "12px 14px",
        color: "#475569",
        textAlign: "left",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: ".04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        background: "rgba(248,250,252,.96)",
        borderBottom: "1px solid rgba(226,232,240,1)",
        ...(props.style || {}),
      }}
    />
  );
}

export function Td(props: React.ComponentPropsWithoutRef<"td">) {
  return (
    <td
      {...props}
      style={{
        padding: "12px 14px",
        borderTop: "1px solid #e4f0f7",
        color: "#0f172a",
        verticalAlign: "top",
        wordBreak: "break-word",
        ...(props.style || {}),
      }}
    />
  );
}

export function SectionTitle({
  title,
  subtitle,
  aside,
}: {
  title: string;
  subtitle?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#f8fafc" }}>{title}</div>
        {subtitle ? (
          <div style={{ marginTop: 6, maxWidth: 720, fontSize: 14, lineHeight: 1.65, color: "rgba(226,232,240,.88)" }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {aside}
    </div>
  );
}

export function EmptyTableState({ message }: { message: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px dashed rgba(191,219,254,.8)",
        background: "rgba(255,255,255,.78)",
        padding: 24,
        textAlign: "center",
        color: "#64748b",
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}

export function LoadingStateCard({
  title = "Memuat data...",
  message = "Mohon tunggu, data sedang diambil dari backend.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(191,219,254,.8)",
        background: "rgba(255,255,255,.86)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          margin: "0 auto 14px",
          borderRadius: 999,
          border: "3px solid rgba(56,174,204,.18)",
          borderTopColor: "#2AA0C8",
          animation: "spin 1s linear infinite",
        }}
      />
      <div style={{ fontSize: 14, fontWeight: 900, color: "#102a43" }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: "#64748b" }}>{message}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorStateCard({
  title = "Gagal memuat data",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(248,113,113,.36)",
        background: "rgba(255,255,255,.88)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 900, color: "#991b1b" }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: "#7f1d1d" }}>{message}</div>
    </div>
  );
}
