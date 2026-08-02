import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ä°yilik Adresim | Ä°yiliÄŸin GÃ¼venilir Adresi",
  description: "DoÄŸrulanmÄ±ÅŸ yardÄ±m Ã§aÄŸrÄ±larÄ±nÄ± destekÃ§ilerle buluÅŸturan ÅŸeffaf dayanÄ±ÅŸma platformu.",
  keywords: ["baÄŸÄ±ÅŸ", "yardÄ±m", "dayanÄ±ÅŸma", "sosyal yardÄ±m", "Ä°yilik Adresim"],
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
