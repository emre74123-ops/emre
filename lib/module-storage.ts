import { createAdminClient } from "./supabase/admin";
import { defaultModuleSettings, normalizeModuleSettings, type ModuleSettings } from "./module-settings";

const bucket = "slider-images";
const settingsPath = "settings/modules.json";

export async function readModuleSettings(): Promise<ModuleSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return defaultModuleSettings;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).download(settingsPath);
  if (error || !data) return defaultModuleSettings;
  try {
    const parsed = JSON.parse(await data.text());
    return normalizeModuleSettings(parsed);
  } catch {
    return defaultModuleSettings;
  }
}

export async function writeModuleSettings(settings: ModuleSettings) {
  const supabase = createAdminClient();
  await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 5 * 1024 * 1024 }).catch(() => undefined);
  const file = new Blob([JSON.stringify(normalizeModuleSettings(settings))], { type: "application/json" });
  const { error } = await supabase.storage.from(bucket).upload(settingsPath, file, {
    contentType: "application/json",
    cacheControl: "0",
    upsert: true,
  });
  return { error };
}
