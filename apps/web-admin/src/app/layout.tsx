import "@/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Web Admin",
  description: "dev",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="admin-gradient min-h-dvh text-slate-900 antialiased">
        {children}
        <div id="portal-root" />
      </body>
    </html>
  );
}
