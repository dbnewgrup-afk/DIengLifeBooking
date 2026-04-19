"use client";
import { S } from "../lib/styles";
import { fmtIDR } from "../lib/utils";

export function WithdrawForm({
  available,
  onSubmit,
}: {
  available: number;
  onSubmit: (fd: FormData) => void | Promise<void>;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
        (e.currentTarget as HTMLFormElement).reset();
      }}
    >
      <label style={S.label}>Nominal</label>
      <input name="amount" style={S.inputLight} inputMode="numeric" placeholder="cth. 1500000" />
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6, marginBottom: 10 }}>
        Saldo tersedia: {fmtIDR(available)}
      </div>

      <div style={S.gridAuto(180)}>
        <div>
          <label style={S.label}>Bank</label>
          <select name="bank" style={S.selectLight}>
            <option value="">Pilih bank</option>
            <option>BCA</option>
            <option>BNI</option>
            <option>BRI</option>
            <option>Mandiri</option>
          </select>
        </div>
        <div>
          <label style={S.label}>No Rekening</label>
          <input name="accNo" style={S.inputLight} />
        </div>
        <div>
          <label style={S.label}>Nama Pemilik</label>
          <input name="accName" style={S.inputLight} />
        </div>
      </div>

      <button type="submit" style={{ ...S.btn, marginTop: 12 }}>
        Kirim Permintaan
      </button>
    </form>
  );
}
