export const parseISO = (s: string) => new Date(s);
export const clampDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const nightsBetween = (a?: string, b?: string) => {
  if (!a || !b) return 0;
  const d1 = clampDate(new Date(a));
  const d2 = clampDate(new Date(b));
  const ms = d2.getTime() - d1.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};
export const nowISO = () => new Date().toISOString();









