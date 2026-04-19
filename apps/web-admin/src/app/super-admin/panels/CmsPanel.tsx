"use client";
import React, { useState } from "react";
import { Th, Td } from "../ui/Table";
import { Labeled } from "../ui/Labeled";
import { mini } from "../ui/Buttons";
import { timeAgo } from "../lib/utils";
import type { CmsEntry } from "../lib/types";

type Props = {
  rows: CmsEntry[];
  onCreate: (title: string) => void;
  onPublish: (id: string) => void;
};

export default function CmsPanel({ rows, onCreate, onPublish }: Props) {
  const [title, setTitle] = useState("");

  function createDraft() {
    const t = title.trim();
    if (!t) return;
    onCreate(t);
    setTitle("");
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "end" }}>
        <Labeled label="Judul Draft" required>
          <input
            style={{
              width: "100%", height: 42, borderRadius: 12, border: "1px solid #cfe3ef",
              padding: "0 12px", fontSize: 14, outline: "none", background: "#fff",
            }}
            value={title}
            onChange={e => setTitle((e.target as HTMLInputElement).value)}
            placeholder="Mis. Promo Akhir Tahun"
          />
        </Labeled>
        <button type="button" onClick={createDraft} style={{
          borderRadius: 999, padding: "12px 18px", border: "1px solid rgba(255,255,255,.6)",
          background: "linear-gradient(180deg, rgba(56,174,204,.3), rgba(2,95,124,.3))",
          color: "#062a36", fontWeight: 900, cursor: "pointer",
          boxShadow: "0 10px 26px rgba(2,47,64,.18), inset 0 1px 0 rgba(255,255,255,.6)",
        }}>
          Buat Draft
        </button>
      </div>

      <div style={{ marginTop: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 }}>
          <thead>
            <tr>
              <Th>Judul</Th>
              <Th>Status</Th>
              <Th>Diupdate</Th>
              <Th style={{ textAlign: "right" as const }}>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><Td colSpan={4}>Belum ada konten.</Td></tr>
            ) : rows.map(c => (
              <tr key={c.id}>
                <Td>{c.title}</Td>
                <Td>{c.status}</Td>
                <Td>{timeAgo(c.updatedAt)}</Td>
                <Td style={{ textAlign: "right" }}>
                  {c.status === "DRAFT" ? (
                    <button type="button" onClick={() => onPublish(c.id)} style={mini}>Publish</button>
                  ) : (
                    <span style={{ fontSize: 12, color: "#065f46", fontWeight: 800 }}>Live</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
