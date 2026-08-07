import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { defaultModuleSettings, normalizeDonationCategoryId, normalizeModuleSettings, type DonationCategory, type ModuleSettings } from "../../../../lib/module-settings";
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
    enabled: true,
    showHeading: input.showHeading !== false,
    headingEyebrow: text(input.headingEyebrow, defaults.headingEyebrow, 40),
    headingTitle: text(input.headingTitle, defaults.headingTitle, 80),
    layout: choice(input.layout, ["carousel", "grid"], defaults.layout),
    columns: clamp(input.columns, 1, 6, defaults.columns),
    sectionMaxWidth: clamp(input.sectionMaxWidth, 280, 1800, defaults.sectionMaxWidth),
    sectionPadding: clamp(input.sectionPadding, 0, 80, defaults.sectionPadding),
    sectionGap: clamp(input.sectionGap, 0, 100, defaults.sectionGap),
    headingGap: clamp(input.headingGap, 0, 100, defaults.headingGap),
    sectionBottomGap: clamp(input.sectionBottomGap, 0, 160, defaults.sectionBottomGap),
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
    titleVisible: input.titleVisible !== false,
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
    leftArrowVisible: input.leftArrowVisible !== false,
    rightArrowVisible: input.rightArrowVisible !== false,
    arrowIcon: choice(input.arrowIcon, ["thin", "chevron", "bold", "long", "triangle"], defaults.arrowIcon),
    arrowSize: clamp(input.arrowSize, 28, 72, defaults.arrowSize),
    arrowIconSize: clamp(input.arrowIconSize, 12, 40, defaults.arrowIconSize),
    arrowOffset: clamp(input.arrowOffset, -36, 36, defaults.arrowOffset),
    arrowVerticalPosition: clamp(input.arrowVerticalPosition, 10, 90, defaults.arrowVerticalPosition),
    arrowRadius: clamp(input.arrowRadius, 0, 50, defaults.arrowRadius),
    arrowBackground: color(input.arrowBackground, defaults.arrowBackground),
    arrowColor: color(input.arrowColor, defaults.arrowColor),
    arrowOpacity: clamp(input.arrowOpacity, 10, 100, defaults.arrowOpacity),
    arrowBorderWidth: clamp(input.arrowBorderWidth, 0, 6, defaults.arrowBorderWidth),
    arrowBorderColor: color(input.arrowBorderColor, defaults.arrowBorderColor),
    arrowShadow: choice(input.arrowShadow, ["none", "soft", "medium", "strong"], defaults.arrowShadow),
  };
}

function clean(input: Partial<ModuleSettings>): ModuleSettings {
  const source = normalizeModuleSettings(input).donation;
  const usedCategoryIds = new Set<string>();
  const categories = source.categories.slice(0, 100).map((category, index): DonationCategory => {
    const baseId = normalizeDonationCategoryId(category.id, `kategori-${index + 1}`);
    let id = baseId;
    let suffix = 2;
    while (usedCategoryIds.has(id)) {
      id = `${baseId.slice(0, Math.max(1, 63 - String(suffix).length))}-${suffix}`;
      suffix += 1;
    }
    usedCategoryIds.add(id);
    const label = text(category.label, "Yeni kategori", 100);
    return {
      id,
      label,
      description: String(category.description || "").trim().slice(0, 300),
      imageTitle: String(category.imageTitle || "").trim().slice(0, 140),
      imageAlt: String(category.imageAlt || "").trim().slice(0, 180),
    };
  });
  const categoryIds = categories.map((category) => category.id);
  const validIds = new Set<string>(categoryIds);
  const cleanCategorySubset = (value: unknown, fallback: readonly string[]) => {
    if (!Array.isArray(value)) return [...fallback];
    return [...new Set(value
      .map((id) => normalizeDonationCategoryId(id))
      .filter((id) => id && validIds.has(id)))];
  };
  const cleanCategoryOrder = (value: unknown) => {
    const selected = cleanCategorySubset(value, []);
    return [...selected, ...categoryIds.filter((id) => !selected.includes(id))];
  };
  const legacyVisibleCategories = cleanCategorySubset(
    source.visibleCategories,
    defaultModuleSettings.donation.visibleCategories,
  );
  const desktopVisibleCategories = cleanCategorySubset(
    source.desktopVisibleCategories,
    legacyVisibleCategories,
  );
  const mobileVisibleCategories = cleanCategorySubset(
    source.mobileVisibleCategories,
    legacyVisibleCategories,
  );
  const desktopCategoryOrder = cleanCategoryOrder(source.desktopCategoryOrder);
  const mobileCategoryOrder = cleanCategoryOrder(source.mobileCategoryOrder);
  const visibleCategories = categoryIds.filter(
    (id) => desktopVisibleCategories.includes(id) || mobileVisibleCategories.includes(id),
  );
  const allCategoryId = source.allCategoryId && validIds.has(source.allCategoryId)
    ? source.allCategoryId
    : "";
  const safeUrl = (value: unknown) => {
    const url = String(value ?? "").trim();
    if (!url) return "";
    return (url.startsWith("/") && !url.startsWith("//")) || /^https:\/\/[a-z0-9.-]+(?:[/:?#].*)?$/i.test(url) ? url.slice(0, 1500) : "";
  };
  const categoryImages = Object.fromEntries(categories.map(({ id }) => {
    const candidate = source.categoryImages?.[id];
    return [id, {
      desktop: safeUrl(candidate?.desktop),
      mobile: safeUrl(candidate?.mobile),
    }];
  }));
  return {
    donation: {
      enabled: source.enabled !== false,
      autoScroll: source.autoScroll !== false,
      autoScrollSpeed: clamp(source.autoScrollSpeed, .25, 4, 1),
      desktopEdgeScrollPadding: clamp(source.desktopEdgeScrollPadding, 0, 160, 32),
      mobileEdgeScrollPadding: clamp(source.mobileEdgeScrollPadding, 0, 100, 20),
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
      categories,
      allCategoryId,
      visibleCategories,
      desktopVisibleCategories,
      mobileVisibleCategories,
      desktopCategoryOrder,
      mobileCategoryOrder,
      placement: "home-after-slider",
      categoryImages,
      projects: source.projects.slice(0, 100).map((project) => ({
        ...project,
        id: text(project.id, `project-${Date.now()}`, 80).replace(/[^a-z0-9-]/gi, "-").toLowerCase(),
        category: normalizeDonationCategoryId(project.category),
        title: text(project.title, "Yeni bağış", 100),
        description: String(project.description || "").slice(0, 500),
        badge: String(project.badge || "").slice(0, 60),
        showInAllDesktop: project.showInAllDesktop !== false,
        showInAllMobile: project.showInAllMobile !== false,
        allOrderDesktop: clamp(project.allOrderDesktop, 0, 9999, 0),
        allOrderMobile: clamp(project.allOrderMobile, 0, 9999, 0),
        fixedPrice: clamp(project.fixedPrice, 0, 100000000, 0),
        suggested: project.suggested.slice(0, 12).map((value) => clamp(value, 1, 100000000, 1)),
        desktopMedia: (project.desktopMedia || []).slice(0, 20).map((media) => ({
          id: text(media.id, crypto.randomUUID(), 100),
          type: choice(media.type, ["image", "video"], "image"),
          url: String(media.url || "").slice(0, 1000),
          path: String(media.path || "").slice(0, 500),
          poster: String(media.poster || "").slice(0, 1000),
          posterPath: String(media.posterPath || "").slice(0, 500),
          alt: String(media.alt || "").slice(0, 160),
        })).filter((media) => media.url),
        mobileMedia: (project.mobileMedia || []).slice(0, 20).map((media) => ({
          id: text(media.id, crypto.randomUUID(), 100),
          type: choice(media.type, ["image", "video"], "image"),
          url: String(media.url || "").slice(0, 1000),
          path: String(media.path || "").slice(0, 500),
          poster: String(media.poster || "").slice(0, 1000),
          posterPath: String(media.posterPath || "").slice(0, 500),
          alt: String(media.alt || "").slice(0, 160),
        })).filter((media) => media.url),
        desktop: {
          ...project.desktop,
          useSharedImageDesign: project.desktop.useSharedImageDesign !== false,
          imageVisible: project.desktop.imageVisible !== false,
          imageFit: choice(project.desktop.imageFit, ["cover", "contain"] as const, "cover"),
        },
        mobile: {
          ...project.mobile,
          useSharedImageDesign: project.mobile.useSharedImageDesign !== false,
          imageVisible: project.mobile.imageVisible !== false,
          imageFit: choice(project.mobile.imageFit, ["cover", "contain"] as const, "cover"),
        },
      })),
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
