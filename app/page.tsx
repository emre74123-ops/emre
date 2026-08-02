import HomeClient from "./HomeClient";
import { readStoredSlides } from "../lib/slider-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const slides = (await readStoredSlides()).filter((slide) => slide.active);
  return <HomeClient initialSlides={slides} />;
}

