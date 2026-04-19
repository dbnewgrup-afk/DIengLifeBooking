const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ??
  "";

function buildApiCandidates(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const withApiPrefix = normalizedPath.startsWith("/api/") ? normalizedPath : `/api${normalizedPath}`;
  return Array.from(new Set([withApiPrefix, normalizedPath])).map((candidate) => `${API_BASE_URL}${candidate}`);
}

export type HomepageHeroContent = {
  eyebrow: string;
  title: string;
  description: string;
};

export type HomepagePromoContent = {
  title: string;
  ctaLabel: string;
  ctaHref: string;
};

export type HomepageRecommendationSection = {
  key: "villa" | "jeep" | "transport" | "dokumentasi";
  title: string;
  enabled: boolean;
};

export type HomepageRecommendationsContent = {
  title: string;
  sections: HomepageRecommendationSection[];
};

export type HomepageHowToContent = {
  title: string;
  steps: string[];
};

export type HomepageReviewItem = {
  name: string;
  text: string;
  stars: 1 | 2 | 3 | 4 | 5;
};

export type HomepageReviewsContent = {
  title: string;
  items: HomepageReviewItem[];
};

export type HomepageContactContent = {
  title: string;
  supportTitle: string;
  whatsappLabel: string;
  whatsappHref: string;
  emailLabel: string;
  hoursTitle: string;
  hoursText: string;
  officeTitle: string;
  officeText: string;
};

export type HomepageCmsContentMap = {
  hero: HomepageHeroContent;
  promo: HomepagePromoContent;
  recommendations: HomepageRecommendationsContent;
  howTo: HomepageHowToContent;
  reviews: HomepageReviewsContent;
  contact: HomepageContactContent;
};

export type HomepageCmsVisibilityMap = Record<keyof HomepageCmsContentMap, boolean>;
export type HomepageCmsResolvedContentMap = {
  [K in keyof HomepageCmsContentMap]: HomepageCmsContentMap[K] | null;
};

export type HomepageCmsState =
  | {
      status: "ready";
      content: HomepageCmsResolvedContentMap;
      visibility: HomepageCmsVisibilityMap;
      error: null;
    }
  | {
      status: "empty" | "error";
      content: HomepageCmsResolvedContentMap;
      visibility: HomepageCmsVisibilityMap;
      error: string | null;
    };

const EMPTY_CONTENT: HomepageCmsResolvedContentMap = {
  hero: null,
  promo: null,
  recommendations: null,
  howTo: null,
  reviews: null,
  contact: null,
};

const EMPTY_VISIBILITY: HomepageCmsVisibilityMap = {
  hero: false,
  promo: false,
  recommendations: false,
  howTo: false,
  reviews: false,
  contact: false,
};

function getHomepageCmsErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Konten homepage gagal dimuat dari CMS.";
}

export async function getHomepageCmsState(): Promise<HomepageCmsState> {
  let payload: unknown = null;
  let lastError: unknown = null;

  for (const url of buildApiCandidates("/cms/homepage/public")) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 30 },
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(4_000),
      });

      if (!res.ok) {
        lastError = new Error(`CMS ${res.status}`);
        continue;
      }

      payload = await res.json().catch(() => null);
      if (payload) break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!payload) {
    return {
      status: "error",
      content: EMPTY_CONTENT,
      visibility: EMPTY_VISIBILITY,
      error: getHomepageCmsErrorMessage(lastError),
    };
  }

  const items = Array.isArray((payload as { items?: unknown[] }).items)
    ? ((payload as { items: unknown[] }).items ?? [])
    : [];

  if (items.length === 0) {
    return {
      status: "empty",
      content: EMPTY_CONTENT,
      visibility: EMPTY_VISIBILITY,
      error: null,
    };
  }

  const mapped: HomepageCmsResolvedContentMap = { ...EMPTY_CONTENT };
  const visibility: HomepageCmsVisibilityMap = { ...EMPTY_VISIBILITY };

  for (const item of items) {
    const row = item as {
      key?: keyof HomepageCmsContentMap;
      content?: HomepageCmsContentMap[keyof HomepageCmsContentMap];
      isVisible?: boolean;
    };
    const key = row.key;
    if (!key || !(key in mapped) || !row.content) {
      continue;
    }

    switch (key) {
      case "hero":
        mapped.hero = row.content as HomepageHeroContent;
        break;
      case "promo":
        mapped.promo = row.content as HomepagePromoContent;
        break;
      case "recommendations":
        mapped.recommendations = row.content as HomepageRecommendationsContent;
        break;
      case "howTo":
        mapped.howTo = row.content as HomepageHowToContent;
        break;
      case "reviews":
        mapped.reviews = row.content as HomepageReviewsContent;
        break;
      case "contact":
        mapped.contact = row.content as HomepageContactContent;
        break;
    }

    visibility[key] = Boolean(row.isVisible ?? true);
  }

  const hasContent = (Object.keys(mapped) as Array<keyof HomepageCmsResolvedContentMap>).some(
    (key) => Boolean(mapped[key]) && visibility[key]
  );

  if (!hasContent) {
    return {
      status: "empty",
      content: mapped,
      visibility,
      error: null,
    };
  }

  return {
    status: "ready",
    content: mapped,
    visibility,
    error: null,
  };
}
