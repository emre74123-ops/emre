import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "İyilik Adresim | İyiliğin Güvenilir Adresi",
  description: "Doğrulanmış yardım çağrılarını destekçilerle buluşturan şeffaf dayanışma platformu.",
  keywords: ["bağış", "yardım", "dayanışma", "sosyal yardım", "İyilik Adresim"],
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
