"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { extractCmsContentEntries, removeCmsContentEntry, type CmsContentEntry } from "../lib/cms-content";
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
  onDeleteEntry: (entry: CmsContentEntry, nextDraft: HomepageCmsSection["draftContent"]) => void | Promise<void>;
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

function statusBadge(isLive: boolean): CSSProperties {
  return {
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 800,
    color: isLive ? "#065f46" : "#92400e",
    background: isLive ? "rgba(16,185,129,.14)" : "rgba(245,158,11,.14)",
  };
}

function surfaceButtonStyle(tone: "neutral" | "primary" | "success" = "neutral"): CSSProperties {
  if (tone === "primary") {
    return {
      borderRadius: 999,
      padding: "10px 16px",
      border: "1px solid rgba(56,174,204,.45)",
      background: "linear-gradient(180deg, rgba(56,174,204,.14), rgba(56,174,204,.24))",
      color: "#053343",
      fontWeight: 800,
      cursor: "pointer",
    };
  }

  if (tone === "success") {
    return {
      borderRadius: 999,
      padding: "10px 16px",
      border: "1px solid rgba(16,185,129,.45)",
      background: "linear-gradient(180deg, rgba(16,185,129,.16), rgba(16,185,129,.24))",
      color: "#065f46",
      fontWeight: 800,
      cursor: "pointer",
    };
  }

  return {
    borderRadius: 999,
    padding: "8px 14px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
  };
}

export default function HomepageCmsPanelList({
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
  onDeleteEntry,
}: Props) {
  const [detailEntry, setDetailEntry] = useState<CmsContentEntry | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(focusEntryId ?? null);

  useEffect(() => {
    setEditingEntryId(focusEntryId ?? null);
  }, [focusEntryId, activeKey]);

  const draftEntries = useMemo(
    () => (draft ? extractCmsContentEntries(draft.key, draft.draftContent) : []),
    [draft]
  );
  const publishedEntries = useMemo(
    () => (draft ? extractCmsContentEntries(draft.key, draft.publishedContent ?? {}) : []),
    [draft]
  );
  const editingEntry = useMemo(
    () => draftEntries.find((entry) => entry.id === editingEntryId) ?? null,
    [draftEntries, editingEntryId]
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
          <div style={{ marginTop: 4, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
            Klik kategori untuk melihat daftar kontennya. Aksi view, edit, dan delete sekarang pindah ke tiap item konten.
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, padding: 12 }}>
          {sections.map((section) => {
            const active = section.key === activeKey;
            const totalEntries = extractCmsContentEntries(section.key, section.draftContent).length;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => onSelect(section.key)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  borderRadius: 14,
                  border: active ? "1px solid rgba(56,174,204,.55)" : "1px solid #dbe9f3",
                  background: active ? "rgba(56,174,204,.12)" : "#fff",
                  padding: 14,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>{section.label}</div>
                  <span style={statusBadge(section.isVisible && Boolean(section.publishedAt))}>{sectionStatus(section)}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                  {section.description || "Section homepage"}
                </div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Diupdate {timeAgo(section.updatedAt)}</span>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "4px 8px",
                      background: "rgba(15,23,42,.06)",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#334155",
                    }}
                  >
                    {totalEntries} item
                  </span>
                </div>
              </button>
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
          <div style={{ fontSize: 14, color: "#64748b" }}>Pilih kategori CMS di sebelah kiri untuk melihat daftar konten.</div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0b1220" }}>{draft.label}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{draft.description}</div>
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

            <div
              style={{
                marginTop: 16,
                borderRadius: 18,
                border: "1px solid #dbe9f3",
                background: "#fff",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #e6f0f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>List konten {draft.label}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                    Pilih item untuk lihat detail, edit konten, atau hapus item tertentu.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={statusBadge(Boolean(draft.publishedAt) && draft.isVisible)}>{sectionStatus(draft)}</span>
                  <span style={{ ...statusBadge(false), color: "#0f172a", background: "rgba(15,23,42,.06)" }}>
                    {draftEntries.length} item draft
                  </span>
                </div>
              </div>

              {draftEntries.length === 0 ? (
                <div style={{ padding: 18, fontSize: 14, color: "#64748b" }}>Belum ada item konten di kategori ini.</div>
              ) : (
                <div style={{ display: "grid" }}>
                  {draftEntries.map((entry, index) => {
                    const isLive = publishedEntries.some((item) => item.id === entry.id);
                    const isEditing = editingEntryId === entry.id;
                    return (
                      <div
                        key={entry.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0,1fr) auto auto",
                          gap: 14,
                          alignItems: "center",
                          padding: "14px 16px",
                          borderTop: index === 0 ? "none" : "1px solid #eef4f7",
                          background: isEditing ? "rgba(56,174,204,.08)" : "#fff",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{entry.title}</div>
                          <div style={{ marginTop: 4, fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{entry.summary}</div>
                        </div>
                        <span style={statusBadge(isLive)}>{isLive ? "Live" : "Draft"}</span>
                        <ActionButtons
                          onView={() => setDetailEntry(entry)}
                          onEdit={() => setEditingEntryId(entry.id)}
                          onDelete={async () => {
                            if (!draft) return;
                            const confirmed =
                              typeof window === "undefined"
                                ? true
                                : window.confirm(`Yakin ingin menghapus konten "${entry.title}"?`);
                            if (!confirmed) return;
                            const nextDraft = removeCmsContentEntry(draft.key, draft.draftContent, entry.id);
                            await onDeleteEntry(entry, nextDraft);
                            if (editingEntryId === entry.id) {
                              setEditingEntryId(null);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
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
              <MetaCard label="Konten live" value={`${publishedEntries.length} item`} />
            </div>
          </>
        )}
      </div>

      <DetailModal
        open={Boolean(detailEntry)}
        onClose={() => setDetailEntry(null)}
        title={detailEntry?.title || "Detail konten"}
        subtitle={detailEntry?.summary || "Rincian konten CMS"}
        meta={
          detailEntry && draft
            ? [
                { label: "Kategori", value: draft.label },
                { label: "Entry ID", value: detailEntry.id },
                { label: "Updated", value: timeAgo(draft.updatedAt) },
              ]
            : []
        }
        data={detailEntry?.data}
        content={
          detailEntry ? (
            <div className="grid gap-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Ringkasan</div>
              <div className="text-sm leading-6 text-slate-700">{detailEntry.summary}</div>
            </div>
          ) : null
        }
        footer={
          detailEntry ? (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDetailEntry(null);
                  setEditingEntryId(detailEntry.id);
                }}
                className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900"
              >
                Edit konten ini
              </button>
            </div>
          ) : null
        }
      />

      <DetailModal
        open={Boolean(editingEntry && draft)}
        onClose={() => setEditingEntryId(null)}
        title={editingEntry ? `Edit ${editingEntry.title}` : "Edit konten"}
        subtitle={
          editingEntry && draft ? `Kategori ${draft.label} • perubahan langsung tersimpan ke draft section ini.` : undefined
        }
        meta={
          editingEntry && draft
            ? [
                { label: "Entry ID", value: editingEntry.id },
                { label: "Kategori", value: draft.label },
                { label: "Status draft", value: sectionStatus(draft) },
              ]
            : []
        }
        size="xl"
        content={
          editingEntry && draft ? (
            <div className="grid gap-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Editor konten</div>
              <div>{renderEditor(draft.key, draft.draftContent, onDraftChange, editingEntry.id)}</div>
            </div>
          ) : null
        }
        footer={
          editingEntry && draft ? (
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setEditingEntryId(null)} style={surfaceButtonStyle("neutral")}>
                Tutup editor
              </button>
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={saving}
                style={{ ...surfaceButtonStyle("primary"), opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving ? "Menyimpan..." : "Simpan draft"}
              </button>
              <button
                type="button"
                onClick={onPublish}
                disabled={publishing}
                style={{ ...surfaceButtonStyle("success"), opacity: publishing ? 0.7 : 1, cursor: publishing ? "not-allowed" : "pointer" }}
              >
                {publishing ? "Publish..." : "Publish ke homepage"}
              </button>
            </div>
          ) : null
        }
      />
    </section>
  );
}

function isFocused(activeId: string | null | undefined, ids: string | string[]) {
  const normalized = Array.isArray(ids) ? ids : [ids];
  return Boolean(activeId && normalized.includes(activeId));
}

function focusWrap(active: boolean): CSSProperties | undefined {
  if (!active) return undefined;
  return {
    borderRadius: 14,
    border: "1px solid rgba(56,174,204,.34)",
    background: "rgba(56,174,204,.08)",
    padding: 10,
  };
}

function renderEditor(
  key: HomepageSectionKey,
  value: any,
  onChange: (next: any) => void,
  focusedEntryId?: string | null
) {
  const style = inputStyle();

  if (key === "hero") {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Field label="Eyebrow" active={isFocused(focusedEntryId, "hero-eyebrow")}>
          <input
            style={style}
            value={value.eyebrow || ""}
            onChange={(event) => onChange({ ...value, eyebrow: event.target.value })}
          />
        </Field>
        <Field label="Title" active={isFocused(focusedEntryId, "hero-title")}>
          <input
            style={style}
            value={value.title || ""}
            onChange={(event) => onChange({ ...value, title: event.target.value })}
          />
        </Field>
        <Field label="Description" active={isFocused(focusedEntryId, "hero-description")}>
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
        <Field label="Title" active={isFocused(focusedEntryId, "promo-title")}>
          <input style={style} value={value.title || ""} onChange={(event) => onChange({ ...value, title: event.target.value })} />
        </Field>
        <div style={{ ...focusWrap(isFocused(focusedEntryId, "promo-cta")), display: "grid", gap: 12, gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
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
        <Field label="Title" active={isFocused(focusedEntryId, "recommendations-title")}>
          <input style={style} value={value.title || ""} onChange={(event) => onChange({ ...value, title: event.target.value })} />
        </Field>
        <div style={{ display: "grid", gap: 10 }}>
          {(Array.isArray(value.sections) ? value.sections : []).map((section: any, index: number) => (
            <div
              key={`${section.key}-${index}`}
              style={{
                ...focusWrap(isFocused(focusedEntryId, `recommendations-section-${index}`)),
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
        <Field label="Title" active={isFocused(focusedEntryId, "howto-title")}>
          <input style={style} value={value.title || ""} onChange={(event) => onChange({ ...value, title: event.target.value })} />
        </Field>
        {(Array.isArray(value.steps) ? value.steps : []).map((step: string, index: number) => (
          <Field key={`step-${index}`} label={`Step ${index + 1}`} active={isFocused(focusedEntryId, `howto-step-${index}`)}>
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
        <Field label="Title" active={isFocused(focusedEntryId, "reviews-title")}>
          <input style={style} value={value.title || ""} onChange={(event) => onChange({ ...value, title: event.target.value })} />
        </Field>
        {(Array.isArray(value.items) ? value.items : []).map((item: any, index: number) => (
          <div
            key={`review-${index}`}
            style={{
              ...focusWrap(isFocused(focusedEntryId, `reviews-item-${index}`)),
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
      <Field label="Title" active={isFocused(focusedEntryId, "contact-title")}>
        <input style={style} value={value.title || ""} onChange={(event) => onChange({ ...value, title: event.target.value })} />
      </Field>
      <Field label="Customer Service Title" active={isFocused(focusedEntryId, "contact-support")}>
        <input
          style={style}
          value={value.supportTitle || ""}
          onChange={(event) => onChange({ ...value, supportTitle: event.target.value })}
        />
      </Field>
      <div style={{ ...focusWrap(isFocused(focusedEntryId, "contact-whatsapp")), display: "grid", gap: 12, gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
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
      <Field label="Email" active={isFocused(focusedEntryId, "contact-email")}>
        <input style={style} value={value.emailLabel || ""} onChange={(event) => onChange({ ...value, emailLabel: event.target.value })} />
      </Field>
      <div style={{ ...focusWrap(isFocused(focusedEntryId, "contact-hours")), display: "grid", gap: 12, gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
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
      <div style={{ ...focusWrap(isFocused(focusedEntryId, "contact-office")), display: "grid", gap: 12, gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
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

function Field({
  label,
  children,
  active = false,
}: {
  label: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: 6, ...focusWrap(active) }}>
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
