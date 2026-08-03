import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ManagedPageClient from "../ManagedPageClient";
import { readHeaderSettings } from "../../lib/header-storage";
import { readManagedPages } from "../../lib/page-storage";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = (await readManagedPages()).find((item) => item.slug === slug && item.enabled);
  return page ? { title: `${page.title} | İyilik Adresim`, description: `${page.title} - İyilik Adresim` } : {};
}

export default async function ManagedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [pages, headerSettings] = await Promise.all([readManagedPages(), readHeaderSettings()]);
  const page = pages.find((item) => item.slug === slug && item.enabled);
  if (!page) notFound();
  if (page.isHome) redirect("/");
  return <ManagedPageClient page={page} pages={pages} headerSettings={headerSettings} />;
}
