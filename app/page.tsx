import HomeClient from "./HomeClient";
import { readStoredSlides } from "../lib/slider-storage";
import { readHeaderSettings } from "../lib/header-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const [storedSlides, headerSettings] = await Promise.all([readStoredSlides(), readHeaderSettings()]);
  const slides = storedSlides.filter((slide) => slide.active);
  return <HomeClient initialSlides={slides} headerSettings={headerSettings} />;
}

