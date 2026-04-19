import "./globals.css";
import "react-day-picker/dist/style.css";
import "@/styles/hero.css"; // penting: untuk gradient

import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LangProvider } from "@/components/i18n/lang";
import AppProviders from "./providers"; // ⬅️ tambahkan ini

export const metadata: Metadata = {
  title: { default: "Dieng Life Villas — Booking", template: "%s — Dieng Life Villas" },
  description: "Villa, Jeep, Rent, Dokumentasi — satu checkout",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col antialiased has-sticky bg-white text-slate-900">
        <LangProvider>
          {/* Provider client (Cart, dst) harus membungkus konten */}
          <AppProviders>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </AppProviders>
        </LangProvider>
      </body>
    </html>
  );
}
