import { createAdminClient } from "./supabase/admin";
import { defaultHeaderSettings, type HeaderSettings } from "./header-settings";

const bucket = "slider-images";
const settingsPath = "settings/header.json";

export async function readHeaderSettings(): Promise<HeaderSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return defaultHeaderSettings;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).download(settingsPath);
  if (error || !data) return defaultHeaderSettings;

  try {
    const parsed = JSON.parse(await data.text());
    const legacyFullscreen = parsed.mobileMenuLayout === "fullscreen";
    return {
      ...defaultHeaderSettings,
      ...parsed,
      menuItems: Array.isArray(parsed.menuItems) ? parsed.menuItems : defaultHeaderSettings.menuItems,
      mobileMenuItems: Array.isArray(parsed.mobileMenuItems) ? parsed.mobileMenuItems : defaultHeaderSettings.mobileMenuItems,
      mobileMenuLayout: legacyFullscreen ? "dropdown" : parsed.mobileMenuLayout || defaultHeaderSettings.mobileMenuLayout,
      mobileMenuBackgroundColor: legacyFullscreen ? "#f3f7f6" : parsed.mobileMenuBackgroundColor || defaultHeaderSettings.mobileMenuBackgroundColor,
      mobileMenuTextColor: legacyFullscreen ? "#173b35" : parsed.mobileMenuTextColor || defaultHeaderSettings.mobileMenuTextColor,
    };
  } catch {
    return defaultHeaderSettings;
  }
}

export async function writeHeaderSettings(settings: HeaderSettings) {
  const supabase = createAdminClient();
  await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 5 * 1024 * 1024 }).catch(() => undefined);
  const file = new Blob([JSON.stringify(settings)], { type: "application/json" });
  const { error } = await supabase.storage.from(bucket).upload(settingsPath, file, {
    contentType: "application/json",
    cacheControl: "0",
    upsert: true,
  });
  return { error };
}
