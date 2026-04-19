"use client";
import { S } from "../lib/styles";
import type { ReactNode } from "react";

export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        {head}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
