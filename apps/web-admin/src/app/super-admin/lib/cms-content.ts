/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HomepageSectionKey } from "./homepage-cms";

export type CmsContentEntry = {
  id: string;
  title: string;
  summary: string;
  data: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function shorten(value: string, max = 140) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}...`;
}

function pushEntry(
  entries: CmsContentEntry[],
  id: string,
  title: string,
  summary: string,
  data: unknown
) {
  entries.push({
    id,
    title,
    summary: shorten(summary || "Konten tersedia."),
    data,
  });
}

export function extractCmsContentEntries(key: HomepageSectionKey, content: any): CmsContentEntry[] {
  const entries: CmsContentEntry[] = [];
  if (!content || typeof content !== "object") return entries;

  if (key === "hero") {
    if (text(content.eyebrow)) pushEntry(entries, "hero-eyebrow", "Eyebrow", text(content.eyebrow), content.eyebrow);
    if (text(content.title)) pushEntry(entries, "hero-title", "Title", text(content.title), content.title);
    if (text(content.description)) {
      pushEntry(entries, "hero-description", "Description", text(content.description), content.description);
    }
    return entries;
  }

  if (key === "promo") {
    if (text(content.title)) pushEntry(entries, "promo-title", "Title", text(content.title), content.title);
    if (text(content.ctaLabel) || text(content.ctaHref)) {
      pushEntry(
        entries,
        "promo-cta",
        "CTA",
        [text(content.ctaLabel), text(content.ctaHref)].filter(Boolean).join(" -> "),
        { ctaLabel: content.ctaLabel, ctaHref: content.ctaHref }
      );
    }
    return entries;
  }

  if (key === "recommendations") {
    if (text(content.title)) {
      pushEntry(entries, "recommendations-title", "Judul section", text(content.title), content.title);
    }
    (Array.isArray(content.sections) ? content.sections : []).forEach((section: any, index: number) => {
      pushEntry(
        entries,
        `recommendations-section-${index}`,
        section?.key ? `Kategori ${section.key}` : `Kategori ${index + 1}`,
        [text(section?.title), section?.enabled ? "Aktif" : "Nonaktif"].filter(Boolean).join(" • "),
        section
      );
    });
    return entries;
  }

  if (key === "howTo") {
    if (text(content.title)) pushEntry(entries, "howto-title", "Judul section", text(content.title), content.title);
    (Array.isArray(content.steps) ? content.steps : []).forEach((step: unknown, index: number) => {
      const label = text(step);
      if (!label) return;
      pushEntry(entries, `howto-step-${index}`, `Step ${index + 1}`, label, step);
    });
    return entries;
  }

  if (key === "reviews") {
    if (text(content.title)) pushEntry(entries, "reviews-title", "Judul section", text(content.title), content.title);
    (Array.isArray(content.items) ? content.items : []).forEach((item: any, index: number) => {
      const stars = Number(item?.stars || 0);
      pushEntry(
        entries,
        `reviews-item-${index}`,
        item?.name ? `Review ${item.name}` : `Review ${index + 1}`,
        [stars ? `${stars}/5 bintang` : "", text(item?.text)].filter(Boolean).join(" • "),
        item
      );
    });
    return entries;
  }

  if (key === "contact") {
    if (text(content.title)) pushEntry(entries, "contact-title", "Judul section", text(content.title), content.title);
    if (text(content.supportTitle)) {
      pushEntry(entries, "contact-support", "Customer service", text(content.supportTitle), content.supportTitle);
    }
    if (text(content.whatsappLabel) || text(content.whatsappHref)) {
      pushEntry(
        entries,
        "contact-whatsapp",
        "WhatsApp",
        [text(content.whatsappLabel), text(content.whatsappHref)].filter(Boolean).join(" • "),
        { whatsappLabel: content.whatsappLabel, whatsappHref: content.whatsappHref }
      );
    }
    if (text(content.emailLabel)) pushEntry(entries, "contact-email", "Email", text(content.emailLabel), content.emailLabel);
    if (text(content.hoursTitle) || text(content.hoursText)) {
      pushEntry(
        entries,
        "contact-hours",
        "Jam operasional",
        [text(content.hoursTitle), text(content.hoursText)].filter(Boolean).join(" • "),
        { hoursTitle: content.hoursTitle, hoursText: content.hoursText }
      );
    }
    if (text(content.officeTitle) || text(content.officeText)) {
      pushEntry(
        entries,
        "contact-office",
        "Alamat / kantor",
        [text(content.officeTitle), text(content.officeText)].filter(Boolean).join(" • "),
        { officeTitle: content.officeTitle, officeText: content.officeText }
      );
    }
    return entries;
  }

  Object.entries(content).forEach(([field, value]) => {
    if (typeof value === "string" && value.trim()) {
      pushEntry(entries, `${key}-${field}`, field, value.trim(), value);
    }
  });

  return entries;
}

export function summarizeCmsSectionContent(key: HomepageSectionKey, content: any) {
  const entries = extractCmsContentEntries(key, content);
  if (entries.length === 0) return "Konten aktif tersedia.";
  return entries[0]?.summary || `${entries.length} konten aktif.`;
}

export function removeCmsContentEntry(key: HomepageSectionKey, content: any, entryId: string) {
  if (!content || typeof content !== "object") return content;

  if (key === "hero") {
    if (entryId === "hero-eyebrow") return { ...content, eyebrow: "" };
    if (entryId === "hero-title") return { ...content, title: "" };
    if (entryId === "hero-description") return { ...content, description: "" };
    return content;
  }

  if (key === "promo") {
    if (entryId === "promo-title") return { ...content, title: "" };
    if (entryId === "promo-cta") return { ...content, ctaLabel: "", ctaHref: "" };
    return content;
  }

  if (key === "recommendations") {
    if (entryId === "recommendations-title") return { ...content, title: "" };
    if (entryId.startsWith("recommendations-section-")) {
      const index = Number(entryId.replace("recommendations-section-", ""));
      return {
        ...content,
        sections: (Array.isArray(content.sections) ? content.sections : []).filter((_: unknown, idx: number) => idx !== index),
      };
    }
    return content;
  }

  if (key === "howTo") {
    if (entryId === "howto-title") return { ...content, title: "" };
    if (entryId.startsWith("howto-step-")) {
      const index = Number(entryId.replace("howto-step-", ""));
      return {
        ...content,
        steps: (Array.isArray(content.steps) ? content.steps : []).filter((_: unknown, idx: number) => idx !== index),
      };
    }
    return content;
  }

  if (key === "reviews") {
    if (entryId === "reviews-title") return { ...content, title: "" };
    if (entryId.startsWith("reviews-item-")) {
      const index = Number(entryId.replace("reviews-item-", ""));
      return {
        ...content,
        items: (Array.isArray(content.items) ? content.items : []).filter((_: unknown, idx: number) => idx !== index),
      };
    }
    return content;
  }

  if (key === "contact") {
    if (entryId === "contact-title") return { ...content, title: "" };
    if (entryId === "contact-support") return { ...content, supportTitle: "" };
    if (entryId === "contact-whatsapp") return { ...content, whatsappLabel: "", whatsappHref: "" };
    if (entryId === "contact-email") return { ...content, emailLabel: "" };
    if (entryId === "contact-hours") return { ...content, hoursTitle: "", hoursText: "" };
    if (entryId === "contact-office") return { ...content, officeTitle: "", officeText: "" };
    return content;
  }

  return content;
}
