export const langs = ["id", "en"] as const;
export type Lang = (typeof langs)[number];
export const isLang = (v: string): v is Lang => (langs as readonly string[]).includes(v as Lang);

// Kamus teks
export const dict: Record<string, { id: string; en: string }> = {
  // Navbar
  nav_booking: { id: "Pesanan", en: "Bookings" },
  nav_partner: { id: "Kemitraan", en: "Partnership" },
  nav_help: { id: "Bantuan", en: "Support" },
  nav_login: { id: "Masuk", en: "Login" },
  nav_dashboard: { id: "Dashboard", en: "Dashboard" },
  nav_logout: { id: "Keluar", en: "Logout" },
  nav_logging_out: { id: "Keluar...", en: "Logging out..." },
  lang_toggle_to_en: { id: "EN", en: "EN" },
  lang_toggle_to_id: { id: "ID", en: "ID" },

  // Menu utama
  menu_villa: { id: "Villa", en: "Villa" },
  menu_jeep: { id: "Jeep", en: "Jeep" },
  menu_rent: { id: "Rent", en: "Car Rental" },
  menu_docs: { id: "Dokumentasi", en: "Photography" },
  menu_promo: { id: "Promo", en: "Deals" },

  // Hero
  hero_title: { id: "Pilihan terbaik untuk liburanmu", en: "The best choice for your holiday" },
  hero_sub: {
    id: "Villa cantik, jeep seru, transport aman, dokumentasi estetik.",
    en: "Beautiful villas, fun jeeps, safe transport, aesthetic photography.",
  },

  // Promo
  promo_home_subtitle: {
    id: "Empat promo terbaru yang tampil di homepage.",
    en: "The four latest deals featured on the homepage.",
  },
  promo_view: { id: "Lihat promo", en: "View deal" },
  promo_apply: { id: "Pakai promo", en: "Use deal" },

  // Buyer login
  buyer_login_title: { id: "Masuk", en: "Log In" },
  buyer_login_intro: {
    id: "Masukkan email aktif dan password akun buyer kamu.",
    en: "Enter your active email and your buyer account password.",
  },
  buyer_login_badge_email: { id: "Email aktif", en: "Active email" },
  buyer_login_badge_password: { id: "Password akun", en: "Account password" },
  buyer_login_email_placeholder: { id: "Masukkan email aktif", en: "Enter your active email" },
  buyer_login_password_placeholder: { id: "Masukkan password", en: "Enter your password" },
  buyer_login_show: { id: "Tampilkan", en: "Show" },
  buyer_login_hide: { id: "Sembunyikan", en: "Hide" },
  buyer_login_submit: { id: "Masuk ke akun buyer", en: "Log In to Buyer Account" },
  buyer_login_create_account: { id: "Buat akun buyer", en: "Create buyer account" },

  // Form pencarian
  field_where: { id: "Kota, tujuan, atau nama tempat", en: "City, destination, or place" },
  field_dates: { id: "Check-In & Check-out", en: "Check-In & Check-out Dates" },
  field_guests: { id: "Tamu & Kamar", en: "Guests & Rooms" },
  btn_search: { id: "Cari", en: "Search" },

  // Cart/booking
  cart: { id: "Keranjang", en: "Cart" },
  done: { id: "Selesai", en: "Done" },

  // Errors
  error_generic: { id: "Terjadi kesalahan.", en: "Something went wrong." },
  error_404: { id: "Halaman tidak ditemukan", en: "Page not found" },
};
