export const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export const toMinor = (n: number) => Math.round(n); // sennya nihil, jadi integer rupiah

export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);









