"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { extractCmsContentEntries } from "../lib/cms-content";
import { timeAgo } from "../lib/utils";
import type { HomepageCmsSection, HomepageSectionKey } from "../lib/homepage-cms";
import ActionButtons from "../ui/ActionButtons";
import DetailModal from "../ui/DetailModal";

type Props = {
  sections: HomepageCmsSection[];
  activeKey: HomepageSectionKey | null;
  draft: HomepageCmsSection | null;
  saving: boolean;
  publishing: boolean;
  focusEntryId?: string | null;
  onSelect: (key: HomepageSectionKey) => void;
  onDraftChange: (next: HomepageCmsSection["draftContent"]) => void;
  onVisibilityChange: (next: boolean) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onDelete: (key: HomepageSectionKey) => void;
};

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    minHeight: 42,
    borderRadius: 12,
    border: "1px solid #cfe3ef",
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
  };
}

function sectionStatus(section: HomepageCmsSection) {
  if (!section.isVisible) return "Disembunyikan";
  if (section.publishedAt) return "Live";
  return "Draft only";
}

export default function HomepageCmsPanel({
  sections,
  activeKey,
  draft,
  saving,
  publishing,
  focusEntryId,
  onSelect,
  onDraftChange,
  onVisibilityChange,
  onSaveDraft,
  onPublish,
  onDelete,
}: Props) {
  const currentPublished = useMemo(() => draft?.publishedContent ?? null, [draft]);
  const [detailKey, setDetailKey] = useState<HomepageSectionKey | null>(null);
  const detailSection = useMemo(
    () => sections.find((section) => section.key === detailKey) ?? null,
    [detailKey, sections]
  );
  const focusedEntry = useMemo(
    () =>
      draft && focusEntryId
        ? extractCmsContentEntries(draft.key, draft.draftContent).find((entry) => entry.id === focusEntryId) ?? null
        : null,
    [draft, focusEntryId]
  );
  const detailEntries = useMemo(
    () =>
      detailSection
        ? extractCmsContentEntries(detailSection.key, detailSection.publishedContent ?? detailSection.draftContent)
        : [],
    [detailSection]
  );

  return (
    <section
      style={{
        marginTop: 12,
        display: "grid",
        gridTemplateColumns: "320px minmax(0,1fr)",
        gap: 14,
      }}
    >
      <div
        style={{
          borderRadius: 18,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "0 12px 30px rgba(2,47,64,.12)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #e6f0f5" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0b1220" }}>CMS Homepage</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#475569" }}>
            Pilih section yang mau diubah. Preview live dipindahkan ke overview supaya halaman CMS fokus untuk edit konten.
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, padding: 12 }}>
          {sections.map((section) => {
            const active = section.key === activeKey;
            return (
              <div
                key={section.key}
                style={{
                  borderRadius: 14,
                  border: active ? "1px solid rgba(56,174,204,.55)" : "1px solid #dbe9f3",
                  background: active ? "rgba(56,174,204,.12)" : "#fff",
                  padding: 14,
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(section.key)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>{section.label}</div>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: 800,
                        color: section.isVisible ? "#065f46" : "#7c2d12",
                        background: section.isVisible ? "rgba(16,185,129,.14)" : "rgba(249,115,22,.14)",
                      }}
                    >
                      {sectionStatus(section)}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                    {section.description || "Section homepage"}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
                    Diupdate {timeAgo(section.updatedAt)}
                  </div>
                </button>
                <div style={{ marginTop: 10 }}>
                  <ActionButtons
                    onView={() => setDetailKey(section.key)}
                    onEdit={() => onSelect(section.key)}
                    onDelete={() => onDelete(section.key)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          borderRadius: 18,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "0 12px 30px rgba(2,47,64,.12)",
          padding: 16,
        }}
      >
        {!draft ? (
          <div style={{ fontSize: 14, color: "#64748b" }}>Pilih section di sebelah kiri untuk mulai mengedit.</div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0b1220" }}>{draft.label}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                  {draft.description}
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                <input
                  type="checkbox"
                  checked={draft.isVisible}
                  onChange={(event) => onVisibilityChange(event.target.checked)}
                />
                Tampilkan di homepage
              </label>
            </div>

            <div style={{ marginTop: 16 }}>{renderEditor(draft.key, draft.draftContent, onDraftChange)}</div>

            {focusedEntry ? (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 14,
                  border: "1px solid rgba(56,174,204,.28)",
                  background: "rgba(56,174,204,.08)",
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#0f3b4c",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  Fokus konten dari overview
                </div>
                <div style={{ marginTop: 4, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                  {focusedEntry.title}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                  {focusedEntry.summary}
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={saving}
                style={{
                  borderRadius: 999,
                  padding: "10px 16px",
                  border: "1px solid rgba(56,174,204,.45)",
                  background: "linear-gradient(180deg, rgba(56,174,204,.14), rgba(56,174,204,.24))",
                  color: "#053343",
                  fontWeight: 800,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Menyimpan..." : "Simpan draft"}
              </button>
              <button
                type="button"
                onClick={onPublish}
                disabled={publishing}
                style={{
                  borderRadius: 999,
                  padding: "10px 16px",
                  border: "1px solid rgba(16,185,129,.45)",
                  background: "linear-gradient(180deg, rgba(16,185,129,.16), rgba(16,185,129,.24))",
                  color: "#065f46",
                  fontWeight: 800,
                  cursor: publishing ? "not-allowed" : "pointer",
                  opacity: publishing ? 0.7 : 1,
                }}
              >
                {publishing ? "Publish..." : "Publish ke homepage"}
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: 12,
              }}
            >
              <MetaCard label="Status" value={sectionStatus(draft)} />
              <MetaCard label="Publish terakhir" value={draft.publishedAt ? timeAgo(draft.publishedAt) : "Belum pernah"} />
              <MetaCard label="Konten aktif" value={currentPublished ? "Sudah ada" : "Masih pakai draft"} />
            </div>
          </>
        )}
      </div>

      <DetailModal
        open={Boolean(detailSection)}
        onClose={() => setDetailKey(null)}
        title={detailSection?.label || "Detail CMS"}
        subtitle={detailSection?.description || "Konten lengkap section homepage."}
        meta={
          detailSection
            ? [
                { label: "Key", value: detailSection.key },
                { label: "Status", value: sectionStatus(detailSection) },
                { label: "Updated", value: timeAgo(detailSection.updatedAt) },
              ]
            : []
        }
        data={detailSection?.publishedContent ?? detailSection?.draftContent ?? {}}
        content={
          detailSection ? (
            <div className="grid gap-3">
              <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                Rincian Konten
              </div>
              {detailEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Belum ada item yang bisa dirinci dari section ini.
                </div>
              ) : (
                detailEntries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div className="text-sm font-bold text-slate-900">{entry.title}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">{entry.summary}</div>
                  </div>
                ))
              )}
            </div>
          ) : null
        }
        footer={
          detailSection ? (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDetailKey(null);
                  onSelect(detailSection.key);
                }}
                className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900"
              >
                Edit konten ini
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailKey(null);
                  onDelete(detailSection.key);
                }}
                className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
              >
                Delete konten
              </button>
            </div>
          ) : null
        }
      />
    </section>
  );
}

function renderEditor(
  key: HomepageSectionKey,
  value: any,
  onChange: (next: any) => void
) {
  const style = inputStyle();

  if (key === "hero") {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Field label="Eyebrow">
          <input
            style={style}
            value={value.eyebrow || ""}
            onChange={(event) => onChange({ ...value, eyebrow: event.target.value })}
          />
        </Field>
        <Field label="Title">
          <input
            style={style}
            value={value.title || ""}
            onChange={(event) => onChange({ ...value, title: event.target.value })}
          />
        </Field>
        <Field label="Description">
          <textarea
            style={{ ...style, minHeight: 110 }}
            value={value.description || ""}
            onChange={(event) => onChange({ ...value, description: event.target.value })}
          />
        </Field>
      </div>
    );
  }

  if (key === "promo") {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Field label="Title">
          <input style={style} value={value.title || ""} onChange={(event) => onChange({ ...value, title: event.target.value })} />
        </Field>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
          <Field label="CTA Label">
            <input
              style={style}
              value={value.ctaLabel || ""}
              onChange={(event) => onChange({ ...value, ctaLabel: event.target.value })}
            />
          </Field>
          <Field label="CTA Href">
            <input
              style={style}
              value={value.ctaHref || ""}
              onChange={(event) => onChange({ ...value, ctaHref: event.target.value })}
            />
          </Field>
        </div>
      </div>
    );
  }

  if (key === "recommendations") {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Field label="Title">
          <input style={style} value={value.title || ""} onChange={(event) => onChange({ ...value, title: event.target.value })} />
        </Field>
        <div style={{ display: "grid", gap: 10 }}>
          {(Array.isArray(value.sections) ? value.sections : []).map((section: any, index: number) => (
            <div
              key={`${section.key}-${index}`}
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns: "140px minmax(0,1fr) auto",
                alignItems: "center",
                border: "1px solid #dbe9f3",
                borderRadius: 12,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{section.key}</div>
              <input
                style={style}
                value={section.title || ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    sections: value.sections.map((item: any, itemIndex: number) =>
                      itemIndex === index ? { ...item, title: event.target.value } : item
                    ),
                  })
                }
              />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#334155" }}>
                <input
                  type="checkbox"
                  checked={Boolean(section.enabled)}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      sections: value.sections.map((item: any, itemIndex: number) =>
                        itemIndex === index ? { ...item, enabled: event.target.checked } : item
                      ),
                    })
                  }
                />
                Aktif
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (key === "howTo") {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Field label="Title">
          <input style={style} value={value.title || ""} onChange={(event) => onChange({ ...value, title: event.target.value })} />
        </Field>
        {(Array.isArray(value.steps) ? value.steps : []).map((step: string, index: number) => (
          <Field key={`step-${index}`} label={`Step ${index + 1}`}>
            <input
              style={style}
              value={step}
              onChange={(event) =>
                onChange({
                  ...value,
                  steps: value.steps.map((item: string, itemIndex: number) =>
                    itemIndex === index ? event.target.value : item
                  ),
                })
              }
            />
          </Field>
        ))}
      </div>
    );
  }

  if (key === "reviews") {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Field label="Title">
          <input style={style} value={value.title || ""} onChange={(event) => onChange({ ...value, title: event.target.value })} />
        </Field>
        {(Array.isArray(value.items) ? value.items : []).map((item: any, index: number) => (
          <div
            key={`review-${index}`}
            style={{
              border: "1px solid #dbe9f3",
              borderRadius: 12,
              padding: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "minmax(0,1fr) 100px" }}>
              <input
                style={style}
                value={item.name || ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    items: value.items.map((row: any, rowIndex: number) =>
                      rowIndex === index ? { ...row, name: event.target.value } : row
                    ),
                  })
                }
              />
              <input
                style={style}
                type="number"
                min={1}
                max={5}
                value={item.stars || 5}
                onChange={(event) =>
                  onChange({
                    ...value,
                    items: value.items.map((row: any, rowIndex: number) =>
                      rowIndex === index ? { ...row, stars: Number(event.target.value || 5) } : row
                    ),
                  })
                }
              />
            </div>
            <textarea
              style={{ ...style, minHeight: 90 }}
              value={item.text || ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  items: value.items.map((row: any, rowIndex: number) =>
                    rowIndex === index ? { ...row, text: event.target.value } : row
                  ),
                })
              }
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Field label="Title">
        <input style={style} value={value.title || ""} onChange={(event) => onChange({ ...value, title: event.target.value })} />
      </Field>
      <Field label="Customer Service Title">
        <input
          style={style}
          value={value.supportTitle || ""}
          onChange={(event) => onChange({ ...value, supportTitle: event.target.value })}
        />
      </Field>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
        <Field label="WhatsApp Label">
          <input
            style={style}
            value={value.whatsappLabel || ""}
            onChange={(event) => onChange({ ...value, whatsappLabel: event.target.value })}
          />
        </Field>
        <Field label="WhatsApp Link">
          <input
            style={style}
            value={value.whatsappHref || ""}
            onChange={(event) => onChange({ ...value, whatsappHref: event.target.value })}
          />
        </Field>
      </div>
      <Field label="Email">
        <input style={style} value={value.emailLabel || ""} onChange={(event) => onChange({ ...value, emailLabel: event.target.value })} />
      </Field>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
        <Field label="Hours Title">
          <input
            style={style}
            value={value.hoursTitle || ""}
            onChange={(event) => onChange({ ...value, hoursTitle: event.target.value })}
          />
        </Field>
        <Field label="Hours Text">
          <input
            style={style}
            value={value.hoursText || ""}
            onChange={(event) => onChange({ ...value, hoursText: event.target.value })}
          />
        </Field>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
        <Field label="Office Title">
          <input
            style={style}
            value={value.officeTitle || ""}
            onChange={(event) => onChange({ ...value, officeTitle: event.target.value })}
          />
        </Field>
        <Field label="Office Text">
          <input
            style={style}
            value={value.officeText || ""}
            onChange={(event) => onChange({ ...value, officeText: event.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: "#334155" }}>{label}</span>
      {children}
    </label>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid #dbe9f3",
        background: "#f8fbfd",
        padding: 12,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{value}</div>
    </div>
  );
}
