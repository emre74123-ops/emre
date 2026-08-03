import HomeClient from "./HomeClient";
import { readStoredSlides } from "../lib/slider-storage";
import { readHeaderSettings } from "../lib/header-storage";
import { readManagedPages } from "../lib/page-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const [storedSlides, headerSettings, managedPages] = await Promise.all([readStoredSlides(), readHeaderSettings(), readManagedPages()]);
  const slides = storedSlides.filter((slide) => slide.active);
  return <HomeClient initialSlides={slides} headerSettings={headerSettings} managedPages={managedPages} />;
}
