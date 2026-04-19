"use client";

import React from "react";
import { timeAgo } from "../lib/utils";
import type { AuditItem } from "../lib/types";

export default function AuditsPanel({ rows }: { rows: AuditItem[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {rows.length === 0 ? (
        <li style={{ color: "#6b7280", fontSize: 14 }}>Belum ada log.</li>
      ) : (
        rows.map((audit) => {
          const targetLabel = audit.targetId ? `${audit.targetType}: ${audit.targetId}` : audit.targetType;

          return (
            <li
              key={audit.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #e4f0f7",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "#132c3b" }}>
                  <b>{audit.actorName}</b> - {audit.action}
                  {targetLabel ? (
                    <>
                      {" "}
                      - <span style={{ color: "#64748b" }}>{targetLabel}</span>
                    </>
                  ) : null}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                {timeAgo(audit.createdAt)}
              </div>
            </li>
          );
        })
      )}
    </ul>
  );
}
