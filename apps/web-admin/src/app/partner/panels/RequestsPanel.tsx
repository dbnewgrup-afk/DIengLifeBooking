"use client";
import { S } from "../lib/styles";
import type { WithdrawalReq, ProductReq, RequestSubTab, BalanceInfo } from "../lib/types";
import { Card } from "../ui/Card";
import { WithdrawForm } from "../requests/WithdrawForm";
import { WithdrawTable } from "../requests/WithdrawTable";
import { ProductRequestForm } from "../requests/ProductRequestForm";
import { ProductRequestTable } from "../requests/ProductRequestTable";

export function RequestsPanel({
  subtab,
  setSubtab,
  available,
  withdrawRows,
  productRows,
  onSubmitWithdraw,
  onSubmitProduct,
}: {
  subtab: RequestSubTab;
  setSubtab: (t: RequestSubTab) => void;
  available: number;
  withdrawRows: WithdrawalReq[];
  productRows: ProductReq[];
  onSubmitWithdraw: (fd: FormData) => void | Promise<void>;
  onSubmitProduct: (fd: FormData) => void;
}) {
  return (
    <>
      <div style={{ ...S.tabs, position: "static", marginTop: 0 }}>
        {(["WITHDRAW", "PRODUCT"] as RequestSubTab[]).map((k) => {
          const active = subtab === k;
          return (
            <button key={k} type="button" onClick={() => setSubtab(k)} style={{ ...S.tab, ...(active ? S.tabActive : null) }}>
              {k === "WITHDRAW" ? "Withdraw" : "Open/Close Product"}
            </button>
          );
        })}
      </div>

      {subtab === "WITHDRAW" ? (
        <div style={S.gridAuto(320)}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginBottom: 10 }}>Buat Permintaan Tarik Saldo</div>
            <WithdrawForm available={available} onSubmit={onSubmitWithdraw} />
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginBottom: 10 }}>Riwayat Permintaan</div>
            <WithdrawTable rows={withdrawRows} />
          </Card>
        </div>
      ) : (
        <div style={S.gridAuto(320)}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginBottom: 10 }}>Request Open/Close Produk</div>
            <ProductRequestForm onSubmit={onSubmitProduct} />
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginBottom: 10 }}>Riwayat Request Produk</div>
            <ProductRequestTable rows={productRows} />
          </Card>
        </div>
      )}
    </>
  );
}
