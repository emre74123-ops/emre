import { createAdminClient } from "./supabase/admin";
import { defaultSlides, type Slide } from "./slides";

const bucket = "slider-images";
const settingsPath = "settings/homepage-slides.json";

export async function readStoredSlides(): Promise<Slide[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).download(settingsPath);
  if (error || !data) return defaultSlides;

  try {
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed) && parsed.length ? parsed : defaultSlides;
  } catch {
    return defaultSlides;
  }
}

export async function writeStoredSlides(slides: Slide[]) {
  const supabase = createAdminClient();
  await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
  });

  const file = new Blob([JSON.stringify(slides)], { type: "application/json" });
  const { error } = await supabase.storage.from(bucket).upload(settingsPath, file, {
    contentType: "application/json",
    cacheControl: "0",
    upsert: true,
  });
  return { error };
}

