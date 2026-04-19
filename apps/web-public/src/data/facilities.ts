// src/data/facilities.ts
export type Lang = "id" | "en";

type FacilityDict = {
  icon: string;
  id: string;
  en: string;
};

export const FACILITIES: FacilityDict[] = [
  // Properti
  { icon: "restaurant", id: "Restoran", en: "Restaurant" },
  { icon: "reception", id: "Resepsionis 24 Jam", en: "24-hour Reception" },
  { icon: "wifi", id: "WiFi", en: "WiFi" },
  { icon: "lift", id: "Lift", en: "Elevator" },
  { icon: "pool", id: "Kolam Renang", en: "Swimming Pool" },
  { icon: "spa", id: "Spa & Pijat", en: "Spa & Massage" },
  { icon: "gym", id: "Pusat Kebugaran", en: "Gym" },
  { icon: "bar", id: "Bar / Lounge", en: "Bar / Lounge" },
  { icon: "parking", id: "Parkir Gratis", en: "Free Parking" },
  { icon: "shuttle", id: "Antar-jemput Bandara", en: "Airport Shuttle" },
  { icon: "meeting", id: "Ruang Meeting / Banquet", en: "Meeting / Banquet Room" },

  // Kamar
  { icon: "ac", id: "AC", en: "Air Conditioning" },
  { icon: "tv", id: "TV Layar Datar", en: "Flat-screen TV" },
  { icon: "minibar", id: "Kulkas / Minibar", en: "Fridge / Minibar" },
  { icon: "toiletries", id: "Peralatan Mandi Lengkap", en: "Toiletries" },
  { icon: "shower", id: "Shower Air Panas/Dingin", en: "Hot/Cold Shower" },
  { icon: "balcony", id: "Balkon / Teras", en: "Balcony / Terrace" },
  { icon: "safe", id: "Brankas", en: "Safe" },
];

/** Helper untuk ambil list sesuai bahasa */
export function getFacilities(lang: Lang) {
  return FACILITIES.map((f) => ({
    icon: f.icon,
    label: lang === "en" ? f.en : f.id,
  }));
}
