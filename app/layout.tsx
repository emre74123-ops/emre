import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.iyilikadresim.org"),
  title: "İyilik Adresim | İyiliğin Güvenilir Adresi",
  description: "İhtiyaçları destekçilerle buluşturan, şeffaflık ve güven odağında çalışan dayanışma platformu.",
  keywords: ["bağış", "yardım", "dayanışma", "sosyal yardım", "İyilik Adresim"],
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "İyilik Adresim | Bir İyilik, Bir Hayatı Değiştirir",
    description: "İyiliğin güvenilir ve şeffaf adresi.",
    url: "https://www.iyilikadresim.org",
    siteName: "İyilik Adresim",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}

