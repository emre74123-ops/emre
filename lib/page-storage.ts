import { createAdminClient } from "./supabase/admin";
import { defaultManagedPages, type ManagedPage } from "./page-settings";

const bucket = "slider-images";
const settingsPath = "settings/pages.json";

export async function readManagedPages(): Promise<ManagedPage[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return defaultManagedPages;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).download(settingsPath);
  if (error || !data) return defaultManagedPages;
  try {
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed) && parsed.length ? parsed : defaultManagedPages;
  } catch {
    return defaultManagedPages;
  }
}

export async function writeManagedPages(pages: ManagedPage[]) {
  const supabase = createAdminClient();
  await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 5 * 1024 * 1024 }).catch(() => undefined);
  const file = new Blob([JSON.stringify(pages)], { type: "application/json" });
  return supabase.storage.from(bucket).upload(settingsPath, file, {
    contentType: "application/json",
    cacheControl: "0",
    upsert: true,
  });
}
