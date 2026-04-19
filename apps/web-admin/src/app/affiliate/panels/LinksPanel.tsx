"use client";
import { C } from "../lib/styles";
import type { AffiliateProfile, LinksData } from "../lib/types";

export function LinksPanel({
  profile,
  links,
}: {
  profile: AffiliateProfile;
  links: LinksData;
}) {
  return (
    <section style={C.panel}>
      <div style={C.panelTitle}>Links</div>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={C.label}>Link Utama</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
            <input readOnly style={C.input} value={links.main} />
            <button
              type="button"
              style={C.btnPrimary}
              onClick={() => navigator.clipboard.writeText(links.main)}
            >
              Copy
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gap: 12,
          }}
        >
          <div>
            <div style={C.label}>Kode</div>
            <div style={C.mutedSmall}>{profile.code}</div>
          </div>
          <div>
            <div style={C.label}>UTM Template</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
              <input readOnly style={C.input} value={links.utm || ""} />
              <button
                type="button"
                style={C.btnPrimary}
                onClick={() => navigator.clipboard.writeText(links.utm || "")}
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <div style={C.label}>Link Pendek</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
              <input readOnly style={C.input} value={links.short || "-"} />
              <button
                type="button"
                style={{
                  ...C.btnPrimary,
                  cursor: links.short ? "pointer" : "not-allowed",
                  opacity: links.short ? 1 : 0.6,
                }}
                onClick={() => links.short && navigator.clipboard.writeText(links.short)}
                disabled={!links.short}
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 6, ...C.mutedSmall }}>
          Gunakan link utama atau tambahkan query UTM untuk atribusi. Pastikan kode affiliate tersisip.
        </div>
      </div>
    </section>
  );
}
