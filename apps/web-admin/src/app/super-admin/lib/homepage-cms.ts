export type HomepageSectionKey =
  | "hero"
  | "promo"
  | "recommendations"
  | "howTo"
  | "reviews"
  | "contact";

export type HomepageCmsSection = {
  id: string;
  key: HomepageSectionKey;
  label: string;
  description?: string | null;
  draftContent: any;
  publishedContent: any | null;
  isVisible: boolean;
  sortOrder: number;
  publishedAt?: string | null;
  updatedAt: string;
};
