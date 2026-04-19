"use client";
import { C } from "../lib/styles";
import type { WithdrawReq } from "../lib/types";
import { WithdrawForm, type WithdrawFormData } from "../payout/WithdrawForm";
import { WithdrawTable } from "../payout/WithdrawTable";

export function PayoutPanel({
  balance,
  rows,
  onSubmit,
}: {
  balance: number;
  rows: WithdrawReq[];
  onSubmit: (v: WithdrawFormData) => void;
}) {
  return (
    <section style={C.panel}>
      <div style={{ ...C.panelTitle, marginBottom: 14 }}>Payout</div>
      <div style={C.twoCol}>
        <WithdrawForm balance={balance} onSubmit={onSubmit} />
        <WithdrawTable rows={rows} />
      </div>
    </section>
  );
}
