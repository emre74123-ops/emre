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
const choice = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => allowed.includes(value as T) ? value as T : fallback;
const text = (value: unknown, fallback: string, max = 80) => {
  const result = String(value ?? "").trim().slice(0, max);
  return result || fallback;
};

function cleanLower(source: Record<string, unknown> | undefined, defaults: typeof defaultModuleSettings.donation.lowerDesktop) {
  const input = source || {};
  return {
    enabled: input.enabled !== false,
    showHeading: input.showHeading !== false,
    headingEyebrow: text(input.headingEyebrow, defaults.headingEyebrow, 40),
    headingTitle: text(input.headingTitle, defaults.headingTitle, 80),
    layout: choice(input.layout, ["carousel", "grid"], defaults.layout),
    columns: clamp(input.columns, 1, 6, defaults.columns),
    sectionMaxWidth: clamp(input.sectionMaxWidth, 280, 1800, defaults.sectionMaxWidth),
    sectionPadding: clamp(input.sectionPadding, 0, 80, defaults.sectionPadding),
    sectionGap: clamp(input.sectionGap, 0, 100, defaults.sectionGap),
    cardWidth: clamp(input.cardWidth, 180, 700, defaults.cardWidth),
    cardRadius: clamp(input.cardRadius, 0, 60, defaults.cardRadius),
    cardPadding: clamp(input.cardPadding, 0, 60, defaults.cardPadding),
    cardGap: clamp(input.cardGap, 0, 60, defaults.cardGap),
    cardBackground: color(input.cardBackground, defaults.cardBackground),
    cardBorderColor: color(input.cardBorderColor, defaults.cardBorderColor),
    cardBorderWidth: clamp(input.cardBorderWidth, 0, 8, defaults.cardBorderWidth),
    cardShadow: choice(input.cardShadow, ["none", "soft", "medium", "strong"], defaults.cardShadow),
    imageVisible: input.imageVisible !== false,
    imageHeight: clamp(input.imageHeight, 80, 500, defaults.imageHeight),
    imageRadius: clamp(input.imageRadius, 0, 60, defaults.imageRadius),
    imageFit: choice(input.imageFit, ["cover", "contain"], defaults.imageFit),
    titleSize: clamp(input.titleSize, 12, 48, defaults.titleSize),
    titleColor: color(input.titleColor, defaults.titleColor),
    titleWeight: clamp(input.titleWeight, 300, 900, defaults.titleWeight),
    descriptionVisible: input.descriptionVisible !== false,
    descriptionSize: clamp(input.descriptionSize, 9, 24, defaults.descriptionSize),
    descriptionColor: color(input.descriptionColor, defaults.descriptionColor),
    priceButtonHeight: clamp(input.priceButtonHeight, 28, 64, defaults.priceButtonHeight),
    priceButtonRadius: clamp(input.priceButtonRadius, 0, 32, defaults.priceButtonRadius),
    priceBackground: color(input.priceBackground, defaults.priceBackground),
    priceTextColor: color(input.priceTextColor, defaults.priceTextColor),
    selectedPriceBackground: color(input.selectedPriceBackground, defaults.selectedPriceBackground),
    selectedPriceTextColor: color(input.selectedPriceTextColor, defaults.selectedPriceTextColor),
    customAmountVisible: input.customAmountVisible !== false,
    actionButtonText: text(input.actionButtonText, defaults.actionButtonText, 40),
    actionButtonHeight: clamp(input.actionButtonHeight, 34, 72, defaults.actionButtonHeight),
    actionButtonRadius: clamp(input.actionButtonRadius, 0, 36, defaults.actionButtonRadius),
    actionButtonBackground: color(input.actionButtonBackground, defaults.actionButtonBackground),
    actionButtonTextColor: color(input.actionButtonTextColor, defaults.actionButtonTextColor),
    arrowsVisible: input.arrowsVisible !== false,
  };
}

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
      desktopProgressPosition: choice(source.desktopProgressPosition, ["top", "bottom", "both"], "bottom"),
      mobileProgressPosition: choice(source.mobileProgressPosition, ["top", "bottom", "both"], "bottom"),
      desktopProgressGap: clamp(source.desktopProgressGap, 0, 60, 14),
      mobileProgressGap: clamp(source.mobileProgressGap, 0, 50, 12),
      desktopProgressThickness: clamp(source.desktopProgressThickness, 1, 8, 2),
      mobileProgressThickness: clamp(source.mobileProgressThickness, 1, 8, 2),
      desktopProgressExtraSpace: clamp(source.desktopProgressExtraSpace, 0, 160, 0),
      mobileProgressExtraSpace: clamp(source.mobileProgressExtraSpace, 0, 120, 0),
      desktopCategoryAlignment: choice(source.desktopCategoryAlignment, ["left", "center"], "left"),
      desktopAspectRatio: choice(source.desktopAspectRatio, ["custom", "1:1", "4:3", "3:2", "16:9", "3:4", "2:3", "9:16"], "custom"),
      mobileAspectRatio: choice(source.mobileAspectRatio, ["custom", "1:1", "4:3", "3:2", "16:9", "3:4", "2:3", "9:16"], "custom"),
      desktopImageFit: choice(source.desktopImageFit, ["cover", "contain"], "cover"),
      mobileImageFit: choice(source.mobileImageFit, ["cover", "contain"], "cover"),
      desktopImagePosition: choice(source.desktopImagePosition, ["center", "top", "bottom", "left", "right"], "center"),
      mobileImagePosition: choice(source.mobileImagePosition, ["center", "top", "bottom", "left", "right"], "center"),
      desktopBorderRadius: clamp(source.desktopBorderRadius, 0, 80, 12),
      mobileBorderRadius: clamp(source.mobileBorderRadius, 0, 80, 10),
      desktopBorderWidth: clamp(source.desktopBorderWidth, 0, 8, 0),
      mobileBorderWidth: clamp(source.mobileBorderWidth, 0, 8, 0),
      desktopBorderColor: color(source.desktopBorderColor, "#128465"),
      mobileBorderColor: color(source.mobileBorderColor, "#128465"),
      desktopShadow: choice(source.desktopShadow, ["none", "soft", "medium", "strong"], "soft"),
      mobileShadow: choice(source.mobileShadow, ["none", "soft", "medium", "strong"], "soft"),
      desktopImageBackgroundColor: color(source.desktopImageBackgroundColor, "#edf6f2"),
      mobileImageBackgroundColor: color(source.mobileImageBackgroundColor, "#edf6f2"),
      visibleCategories,
      placement: "home-after-slider",
      categoryImages,
      lowerDesktop: cleanLower(source.lowerDesktop as unknown as Record<string, unknown>, defaultModuleSettings.donation.lowerDesktop),
      lowerMobile: cleanLower(source.lowerMobile as unknown as Record<string, unknown>, defaultModuleSettings.donation.lowerMobile),
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

