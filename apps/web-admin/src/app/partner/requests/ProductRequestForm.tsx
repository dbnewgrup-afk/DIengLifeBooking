"use client";
import { S } from "../lib/styles";
import type { ProductReq } from "../lib/types";

export function ProductRequestForm({ onSubmit }: { onSubmit: (fd: FormData) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
        (e.currentTarget as HTMLFormElement).reset();
      }}
    >
      <div style={S.gridAuto(180)}>
        <div>
          <label style={S.label}>Produk</label>
          <input name="productName" style={S.inputLight} placeholder="cth. Villa Mawar / Jeep Sunrise" />
        </div>
        <div>
          <label style={S.label}>Kategori</label>
          <select name="productType" style={S.selectLight} defaultValue="VILLA">
            <option value="VILLA">VILLA</option>
            <option value="JEEP">JEEP</option>
            <option value="RENT">RENT</option>
            <option value="DOCS">DOCS</option>
          </select>
        </div>
        <div>
          <label style={S.label}>Aksi</label>
          <select name="action" style={S.selectLight} defaultValue="CLOSE">
            <option value="CLOSE">CLOSE (tutup sementara)</option>
            <option value="OPEN">OPEN (buka kembali)</option>
          </select>
        </div>
      </div>

      <label style={{ ...S.label, marginTop: 10 }}>Alasan</label>
      <textarea
        name="reason"
        rows={3}
        style={{ ...S.inputLight, height: 90, paddingTop: 10, paddingBottom: 10, resize: "vertical" }}
        placeholder="Opsional. Jelaskan kenapa perlu di-open/close."
      />

      <button type="submit" style={{ ...S.btn, marginTop: 12 }}>
        Kirim Request
      </button>
    </form>
  );
}
