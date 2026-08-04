import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { defaultDonationCategoryImages, defaultModuleSettings, donationCategoryOptions, type ModuleSettings } from "../../../../lib/module-settings";
import { readModuleSettings, writeModuleSettings } from "../../../../lib/module-storage";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  return Boolean(data);
}

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};
const color = (value: unknown, fallback: string) => /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value) : fallback;

function clean(input: Partial<ModuleSettings>): ModuleSettings {
  const source = input.donation || defaultModuleSettings.donation;
  const validIds = new Set(donationCategoryOptions.map(([id]) => id));
  const visibleCategories = Array.isArray(source.visibleCategories)
    ? source.visibleCategories.filter((id) => validIds.has(id as typeof donationCategoryOptions[number][0]))
    : defaultModuleSettings.donation.visibleCategories;
  const categoryImages = Object.fromEntries(donationCategoryOptions.map(([id]) => {
    const candidate = source.categoryImages?.[id];
    const fallback = defaultDonationCategoryImages[id];
    const safeUrl = (value: unknown, defaultValue: string) => {
      const url = String(value || "");
      return url.startsWith("/") || /^https:\/\/[a-z0-9.-]+\/.+/i.test(url) ? url : defaultValue;
    };
    return [id, {
      desktop: safeUrl(candidate?.desktop, fallback.desktop),
      mobile: safeUrl(candidate?.mobile, fallback.mobile),
    }];
  }));
  return {
    donation: {
      enabled: source.enabled !== false,
      autoScroll: source.autoScroll !== false,
      autoScrollSpeed: clamp(source.autoScrollSpeed, .25, 4, 1),
      showProgress: source.showProgress !== false,
      desktopOverlap: clamp(source.desktopOverlap, 0, 100, 28),
      mobileOverlap: clamp(source.mobileOverlap, 0, 60, 10),
      desktopCardWidth: clamp(source.desktopCardWidth, 60, 500, 190),
      desktopCardHeight: clamp(source.desktopCardHeight, 60, 500, 150),
      mobileCardWidth: clamp(source.mobileCardWidth, 50, 320, 118),
      mobileCardHeight: clamp(source.mobileCardHeight, 50, 400, 115),
      desktopCardGap: clamp(source.desktopCardGap, 0, 60, 10),
      mobileCardGap: clamp(source.mobileCardGap, 0, 40, 8),
      desktopContentGap: clamp(source.desktopContentGap, 0, 120, 38),
      mobileContentGap: clamp(source.mobileContentGap, 0, 100, 30),
      desktopProgressStartColor: color(source.desktopProgressStartColor, "#128465"),
      desktopProgressEndColor: color(source.desktopProgressEndColor, "#ee7047"),
      desktopProgressTrackColor: color(source.desktopProgressTrackColor, "#e1ebe7"),
      mobileProgressStartColor: color(source.mobileProgressStartColor, "#128465"),
      mobileProgressEndColor: color(source.mobileProgressEndColor, "#ee7047"),
      mobileProgressTrackColor: color(source.mobileProgressTrackColor, "#e1ebe7"),
      visibleCategories,
      placement: "home-after-slider",
      categoryImages,
    },
  };
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  return NextResponse.json({ settings: await readModuleSettings() });
}

export async function PUT(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const settings = clean(await request.json());
  const { error } = await writeModuleSettings(settings);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  return NextResponse.json({ settings });
}
