export type DonationCategoryId = string;

export type DonationCategory = {
  id: DonationCategoryId;
  label: string;
  description: string;
  imageTitle: string;
  imageAlt: string;
};

export type DonationModuleSettings = {
  enabled: boolean;
  autoScroll: boolean;
  autoScrollSpeed: number;
  desktopEdgeScrollPadding: number;
  mobileEdgeScrollPadding: number;
  showProgress: boolean;
  desktopOverlap: number;
  mobileOverlap: number;
  desktopCardWidth: number;
  desktopCardHeight: number;
  mobileCardWidth: number;
  mobileCardHeight: number;
  desktopCardGap: number;
  mobileCardGap: number;
  desktopContentGap: number;
  mobileContentGap: number;
  desktopProgressStartColor: string;
  desktopProgressEndColor: string;
  desktopProgressTrackColor: string;
  mobileProgressStartColor: string;
  mobileProgressEndColor: string;
  mobileProgressTrackColor: string;
  desktopProgressPosition: "top" | "bottom" | "both";
  mobileProgressPosition: "top" | "bottom" | "both";
  desktopProgressGap: number;
  mobileProgressGap: number;
  desktopProgressThickness: number;
  mobileProgressThickness: number;
  desktopProgressExtraSpace: number;
  mobileProgressExtraSpace: number;
  desktopCategoryAlignment: "left" | "center";
  desktopAspectRatio: string;
  mobileAspectRatio: string;
  desktopImageFit: "cover" | "contain";
  mobileImageFit: "cover" | "contain";
  desktopImagePosition: string;
  mobileImagePosition: string;
  desktopBorderRadius: number;
  mobileBorderRadius: number;
  desktopBorderWidth: number;
  mobileBorderWidth: number;
  desktopBorderColor: string;
  mobileBorderColor: string;
  desktopShadow: "none" | "soft" | "medium" | "strong";
  mobileShadow: "none" | "soft" | "medium" | "strong";
  desktopImageBackgroundColor: string;
  mobileImageBackgroundColor: string;
  categories: DonationCategory[];
  allCategoryId: DonationCategoryId;
  visibleCategories: DonationCategoryId[];
  desktopVisibleCategories: DonationCategoryId[];
  mobileVisibleCategories: DonationCategoryId[];
  desktopCategoryOrder: DonationCategoryId[];
  mobileCategoryOrder: DonationCategoryId[];
  placement: "home-after-slider";
  categoryImages: Record<string, { desktop: string; mobile: string }>;
  lowerDesktop: DonationLowerDeviceSettings;
  lowerMobile: DonationLowerDeviceSettings;
  projects: DonationProject[];
};

export type DonationProject = {
  id: string;
  category: DonationCategoryId;
  enabled: boolean;
  showInAllDesktop?: boolean;
  showInAllMobile?: boolean;
  allOrderDesktop?: number;
  allOrderMobile?: number;
  title: string;
  description: string;
  image: string;
  badge: string;
  desktopMedia?: DonationProjectMedia[];
  mobileMedia?: DonationProjectMedia[];
  pricingMode: "amount" | "quantity";
  fixedPrice: number;
  suggested: number[];
  customAmountEnabled: boolean;
  desktop: DonationProjectDesign;
  mobile: DonationProjectDesign;
};

export type DonationProjectMedia = {
  id: string;
  type: "image" | "video";
  url: string;
  path?: string;
  width?: number;
  height?: number;
  size?: number;
  originalName?: string;
  poster?: string;
  posterPath?: string;
  posterWidth?: number;
  posterHeight?: number;
  posterSize?: number;
  posterOriginalName?: string;
  alt?: string;
};

export type DonationProjectDesign = {
  useSharedDesign: boolean;
  useSharedImageDesign?: boolean;
  imageVisible?: boolean;
  imageFit?: "cover" | "contain";
  mediaThumbnailsVisible: boolean;
  mediaThumbnailSize: number;
  mediaThumbnailGap: number;
  mediaThumbnailRadius: number;
  mediaThumbnailBottom: number;
  videoModalWidth: number;
  videoModalRadius: number;
  videoModalBackdropOpacity: number;
  cardWidth: number;
  cardPadding: number;
  cardBackground: string;
  cardRadius: number;
  cardBorderColor: string;
  cardBorderWidth: number;
  imageHeight: number;
  imageRadius: number;
  titleColor: string;
  titleSize: number;
  titleWeight: number;
  descriptionColor: string;
  descriptionSize: number;
  priceButtonHeight: number;
  priceButtonRadius: number;
  priceBackground: string;
  priceTextColor: string;
  selectedPriceBackground: string;
  selectedPriceTextColor: string;
  actionBackground: string;
  actionTextColor: string;
  actionText: string;
  actionHeight: number;
  actionRadius: number;
};

export type DonationLowerDeviceSettings = {
  enabled: boolean;
  showHeading: boolean;
  headingEyebrow: string;
  headingTitle: string;
  layout: "carousel" | "grid";
  columns: number;
  sectionMaxWidth: number;
  sectionPadding: number;
  sectionGap: number;
  headingGap: number;
  sectionBottomGap: number;
  cardWidth: number;
  cardRadius: number;
  cardPadding: number;
  cardGap: number;
  cardBackground: string;
  cardBorderColor: string;
  cardBorderWidth: number;
  cardShadow: "none" | "soft" | "medium" | "strong";
  imageVisible: boolean;
  imageHeight: number;
  imageRadius: number;
  imageFit: "cover" | "contain";
  mediaThumbnailsVisible: boolean;
  mediaThumbnailSize: number;
  mediaThumbnailGap: number;
  mediaThumbnailRadius: number;
  mediaThumbnailBottom: number;
  videoModalWidth: number;
  videoModalRadius: number;
  videoModalBackdropOpacity: number;
  titleSize: number;
  titleColor: string;
  titleWeight: number;
  titleVisible: boolean;
  descriptionVisible: boolean;
  descriptionSize: number;
  descriptionColor: string;
  priceButtonHeight: number;
  priceButtonRadius: number;
  priceBackground: string;
  priceTextColor: string;
  selectedPriceBackground: string;
  selectedPriceTextColor: string;
  customAmountVisible: boolean;
  actionButtonText: string;
  actionButtonHeight: number;
  actionButtonRadius: number;
  actionButtonBackground: string;
  actionButtonTextColor: string;
  arrowsVisible: boolean;
  leftArrowVisible: boolean;
  rightArrowVisible: boolean;
  arrowIcon: "thin" | "chevron" | "bold" | "long" | "triangle";
  arrowSize: number;
  arrowIconSize: number;
  arrowOffset: number;
  arrowVerticalPosition: number;
  arrowRadius: number;
  arrowBackground: string;
  arrowColor: string;
  arrowOpacity: number;
  arrowBorderWidth: number;
  arrowBorderColor: string;
  arrowShadow: "none" | "soft" | "medium" | "strong";
};

export type ModuleSettings = {
  donation: DonationModuleSettings;
};

export const donationCategoryOptions = [
  ["all", "Tüm Bağışlar"],
  ["general", "Genel Bağış"],
  ["qurban", "Kurban"],
  ["water", "Su Kuyusu"],
  ["zakat", "Zekât & Fitre"],
  ["orphan", "Yetim Desteği"],
] as const;

export const defaultDonationCategories: DonationCategory[] = donationCategoryOptions.map(([id, label]) => ({
  id,
  label,
  description: "",
  imageTitle: label,
  imageAlt: `${label} bağış kategorisi`,
}));

export function normalizeDonationCategoryId(value: unknown, fallback = "") {
  const normalized = String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return normalized || fallback;
}

function categoryLabelFromId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toLocaleUpperCase("tr-TR")}${part.slice(1)}`)
    .join(" ") || "Yeni kategori";
}

function normalizeCategorySubset(
  value: unknown,
  fallback: readonly DonationCategoryId[],
  validIds: ReadonlySet<string>,
  remapId: (value: unknown) => string,
) {
  if (!Array.isArray(value)) return [...fallback];
  const normalized = value.map(remapId).filter((id) => id && validIds.has(id));
  return [...new Set(normalized)];
}

function normalizeCategoryOrder(
  value: unknown,
  categoryIds: readonly DonationCategoryId[],
  validIds: ReadonlySet<string>,
  remapId: (value: unknown) => string,
) {
  const selected = normalizeCategorySubset(value, [], validIds, remapId);
  return [...selected, ...categoryIds.filter((id) => !selected.includes(id))];
}

export const defaultDonationCategoryImages = {
  all: { desktop: "/donation-categories/tum-bagislar.webp", mobile: "/donation-categories/tum-bagislar.webp" },
  general: { desktop: "/donation-categories/genel-bagis.webp", mobile: "/donation-categories/genel-bagis.webp" },
  qurban: { desktop: "/donation-categories/kurban.webp", mobile: "/donation-categories/kurban.webp" },
  water: { desktop: "/donation-categories/su-kuyusu.webp", mobile: "/donation-categories/su-kuyusu.webp" },
  zakat: { desktop: "/donation-categories/zekat-fitre.webp", mobile: "/donation-categories/zekat-fitre.webp" },
  orphan: { desktop: "/donation-categories/yetim-destegi.webp", mobile: "/donation-categories/yetim-destegi.webp" },
};

const defaultProjectDesign: DonationProjectDesign = {
  useSharedDesign: true,
  mediaThumbnailsVisible: true,
  mediaThumbnailSize: 54,
  mediaThumbnailGap: 8,
  mediaThumbnailRadius: 8,
  mediaThumbnailBottom: 10,
  videoModalWidth: 960,
  videoModalRadius: 18,
  videoModalBackdropOpacity: 84,
  cardWidth: 370,
  cardPadding: 24,
  cardBackground: "#ffffff",
  cardRadius: 18,
  cardBorderColor: "#e2e8e4",
  cardBorderWidth: 1,
  imageHeight: 218,
  imageRadius: 0,
  titleColor: "#143b34",
  titleSize: 26,
  titleWeight: 500,
  descriptionColor: "#6e827d",
  descriptionSize: 12,
  priceButtonHeight: 38,
  priceButtonRadius: 8,
  priceBackground: "#ffffff",
  priceTextColor: "#365f57",
  selectedPriceBackground: "#e7f4ef",
  selectedPriceTextColor: "#0d7258",
  actionBackground: "#128465",
  actionTextColor: "#ffffff",
  actionText: "Sepete ekle",
  actionHeight: 46,
  actionRadius: 9,
};

export const defaultDonationProjects: DonationProject[] = [
  { id: "water-africa", category: "water", enabled: true, title: "Afrika Su Kuyusu", description: "Temiz suya erişimi olmayan bir bölgeye kalıcı bir su kaynağı kazandırın.", image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1000&q=85", badge: "Kalıcı iyilik", pricingMode: "quantity", fixedPrice: 2900, suggested: [1, 2, 3, 4], customAmountEnabled: false, desktop: { ...defaultProjectDesign }, mobile: { ...defaultProjectDesign, cardWidth: 330, cardPadding: 20, cardRadius: 16, titleSize: 24, imageHeight: 205 } },
  { id: "general-support", category: "general", enabled: true, title: "İyilik Fonu", description: "Bağışınız, öncelikli ihtiyaçların hızlı ve şeffaf biçimde karşılanmasına destek olur.", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=85", badge: "En çok ihtiyaç duyulan", pricingMode: "amount", fixedPrice: 0, suggested: [250, 500, 1000, 2000], customAmountEnabled: true, desktop: { ...defaultProjectDesign }, mobile: { ...defaultProjectDesign, cardWidth: 330, cardPadding: 20, cardRadius: 16, titleSize: 24, imageHeight: 205 } },
  { id: "orphan-meal", category: "orphan", enabled: true, title: "Yetim Çocuklara Yemek", description: "Bir çocuğun günlük sıcak yemek ihtiyacına katkıda bulunun.", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=85", badge: "Bir sofraya ortak ol", pricingMode: "amount", fixedPrice: 0, suggested: [150, 300, 600, 1200], customAmountEnabled: true, desktop: { ...defaultProjectDesign }, mobile: { ...defaultProjectDesign, cardWidth: 330, cardPadding: 20, cardRadius: 16, titleSize: 24, imageHeight: 205 } },
  { id: "qurban-share", category: "qurban", enabled: true, title: "Kurban Hissesi", description: "Kurban bağışınızı ihtiyaç sahiplerine güvenle ulaştırıyoruz.", image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1000&q=85", badge: "Hisse bağışı", pricingMode: "quantity", fixedPrice: 4750, suggested: [1, 2, 3, 4], customAmountEnabled: false, desktop: { ...defaultProjectDesign }, mobile: { ...defaultProjectDesign, cardWidth: 330, cardPadding: 20, cardRadius: 16, titleSize: 24, imageHeight: 205 } },
  { id: "zakat", category: "zakat", enabled: true, title: "Zekât Bağışı", description: "Zekâtınızı ihtiyaç sahibi ailelere titizlikle ulaştıralım.", image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1000&q=85", badge: "Güvenli ulaştırma", pricingMode: "amount", fixedPrice: 0, suggested: [500, 1000, 2500, 5000], customAmountEnabled: true, desktop: { ...defaultProjectDesign }, mobile: { ...defaultProjectDesign, cardWidth: 330, cardPadding: 20, cardRadius: 16, titleSize: 24, imageHeight: 205 } },
];

export const defaultModuleSettings: ModuleSettings = {
  donation: {
    enabled: true,
    autoScroll: true,
    autoScrollSpeed: 1,
    desktopEdgeScrollPadding: 32,
    mobileEdgeScrollPadding: 20,
    showProgress: true,
    desktopOverlap: 28,
    mobileOverlap: 10,
    desktopCardWidth: 190,
    desktopCardHeight: 150,
    mobileCardWidth: 118,
    mobileCardHeight: 115,
    desktopCardGap: 10,
    mobileCardGap: 8,
    desktopContentGap: 38,
    mobileContentGap: 30,
    desktopProgressStartColor: "#128465",
    desktopProgressEndColor: "#ee7047",
    desktopProgressTrackColor: "#e1ebe7",
    mobileProgressStartColor: "#128465",
    mobileProgressEndColor: "#ee7047",
    mobileProgressTrackColor: "#e1ebe7",
    desktopProgressPosition: "bottom",
    mobileProgressPosition: "bottom",
    desktopProgressGap: 14,
    mobileProgressGap: 12,
    desktopProgressThickness: 2,
    mobileProgressThickness: 2,
    desktopProgressExtraSpace: 0,
    mobileProgressExtraSpace: 0,
    desktopCategoryAlignment: "left",
    desktopAspectRatio: "custom",
    mobileAspectRatio: "custom",
    desktopImageFit: "cover",
    mobileImageFit: "cover",
    desktopImagePosition: "center",
    mobileImagePosition: "center",
    desktopBorderRadius: 12,
    mobileBorderRadius: 10,
    desktopBorderWidth: 0,
    mobileBorderWidth: 0,
    desktopBorderColor: "#128465",
    mobileBorderColor: "#128465",
    desktopShadow: "soft",
    mobileShadow: "soft",
    desktopImageBackgroundColor: "#edf6f2",
    mobileImageBackgroundColor: "#edf6f2",
    categories: defaultDonationCategories,
    allCategoryId: "all",
    visibleCategories: donationCategoryOptions.map(([id]) => id),
    desktopVisibleCategories: donationCategoryOptions.map(([id]) => id),
    mobileVisibleCategories: donationCategoryOptions.map(([id]) => id),
    desktopCategoryOrder: donationCategoryOptions.map(([id]) => id),
    mobileCategoryOrder: donationCategoryOptions.map(([id]) => id),
    placement: "home-after-slider",
    categoryImages: defaultDonationCategoryImages,
    projects: defaultDonationProjects,
    lowerDesktop: {
      enabled: true, showHeading: true, headingEyebrow: "BAĞIŞ ALANLARI", headingTitle: "Destek projeleri",
      layout: "carousel", columns: 3, sectionMaxWidth: 1320, sectionPadding: 0, sectionGap: 22, headingGap: 24, sectionBottomGap: 50,
      cardWidth: 370, cardRadius: 18, cardPadding: 24, cardGap: 22, cardBackground: "#ffffff",
      cardBorderColor: "#e2e8e4", cardBorderWidth: 1, cardShadow: "soft",
      imageVisible: true, imageHeight: 218, imageRadius: 0, imageFit: "cover",
      mediaThumbnailsVisible: true, mediaThumbnailSize: 54, mediaThumbnailGap: 8,
      mediaThumbnailRadius: 8, mediaThumbnailBottom: 10,
      videoModalWidth: 960, videoModalRadius: 18, videoModalBackdropOpacity: 84,
      titleSize: 26, titleColor: "#143b34", titleWeight: 500, titleVisible: true,
      descriptionVisible: true, descriptionSize: 12, descriptionColor: "#6e827d",
      priceButtonHeight: 38, priceButtonRadius: 8, priceBackground: "#ffffff", priceTextColor: "#365f57",
      selectedPriceBackground: "#e7f4ef", selectedPriceTextColor: "#0d7258", customAmountVisible: true,
      actionButtonText: "Sepete ekle", actionButtonHeight: 46, actionButtonRadius: 9,
      actionButtonBackground: "#128465", actionButtonTextColor: "#ffffff", arrowsVisible: true,
      leftArrowVisible: true, rightArrowVisible: true, arrowIcon: "chevron", arrowSize: 44, arrowIconSize: 24,
      arrowOffset: -14, arrowVerticalPosition: 50, arrowRadius: 50, arrowBackground: "#ffffff",
      arrowColor: "#123c35", arrowOpacity: 92, arrowBorderWidth: 1, arrowBorderColor: "#d8e2de", arrowShadow: "soft",
    },
    lowerMobile: {
      enabled: true, showHeading: true, headingEyebrow: "BAĞIŞ ALANLARI", headingTitle: "Destek projeleri",
      layout: "carousel", columns: 1, sectionMaxWidth: 640, sectionPadding: 12, sectionGap: 14, headingGap: 24, sectionBottomGap: 50,
      cardWidth: 330, cardRadius: 16, cardPadding: 20, cardGap: 14, cardBackground: "#ffffff",
      cardBorderColor: "#e2e8e4", cardBorderWidth: 1, cardShadow: "soft",
      imageVisible: true, imageHeight: 205, imageRadius: 0, imageFit: "cover",
      mediaThumbnailsVisible: true, mediaThumbnailSize: 44, mediaThumbnailGap: 6,
      mediaThumbnailRadius: 7, mediaThumbnailBottom: 8,
      videoModalWidth: 640, videoModalRadius: 14, videoModalBackdropOpacity: 86,
      titleSize: 24, titleColor: "#143b34", titleWeight: 500, titleVisible: true,
      descriptionVisible: true, descriptionSize: 12, descriptionColor: "#6e827d",
      priceButtonHeight: 38, priceButtonRadius: 8, priceBackground: "#ffffff", priceTextColor: "#365f57",
      selectedPriceBackground: "#e7f4ef", selectedPriceTextColor: "#0d7258", customAmountVisible: true,
      actionButtonText: "Sepete ekle", actionButtonHeight: 46, actionButtonRadius: 9,
      actionButtonBackground: "#128465", actionButtonTextColor: "#ffffff", arrowsVisible: true,
      leftArrowVisible: true, rightArrowVisible: true, arrowIcon: "chevron", arrowSize: 40, arrowIconSize: 22,
      arrowOffset: -10, arrowVerticalPosition: 50, arrowRadius: 50, arrowBackground: "#ffffff",
      arrowColor: "#123c35", arrowOpacity: 88, arrowBorderWidth: 1, arrowBorderColor: "#d8e2de", arrowShadow: "soft",
    },
  },
};

function boundedNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function optionalPositiveInteger(value: unknown, max: number) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? Math.min(max, number) : undefined;
}

function optionalFileName(value: unknown) {
  const name = String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 180);
  return name || undefined;
}

function normalizeProjectDesign(
  input: Partial<DonationProjectDesign> | undefined,
  defaults: DonationProjectDesign,
): DonationProjectDesign {
  const source = input || {};
  return {
    ...defaults,
    ...source,
    mediaThumbnailsVisible: typeof source.mediaThumbnailsVisible === "boolean"
      ? source.mediaThumbnailsVisible
      : defaults.mediaThumbnailsVisible,
    mediaThumbnailSize: boundedNumber(source.mediaThumbnailSize, 24, 160, defaults.mediaThumbnailSize),
    mediaThumbnailGap: boundedNumber(source.mediaThumbnailGap, 0, 40, defaults.mediaThumbnailGap),
    mediaThumbnailRadius: boundedNumber(source.mediaThumbnailRadius, 0, 40, defaults.mediaThumbnailRadius),
    mediaThumbnailBottom: boundedNumber(source.mediaThumbnailBottom, 0, 80, defaults.mediaThumbnailBottom),
    videoModalWidth: boundedNumber(source.videoModalWidth, 280, 1800, defaults.videoModalWidth),
    videoModalRadius: boundedNumber(source.videoModalRadius, 0, 60, defaults.videoModalRadius),
    videoModalBackdropOpacity: boundedNumber(
      source.videoModalBackdropOpacity,
      0,
      100,
      defaults.videoModalBackdropOpacity,
    ),
  };
}

function normalizeLowerDeviceSettings(
  input: Partial<DonationLowerDeviceSettings> | undefined,
  defaults: DonationLowerDeviceSettings,
): DonationLowerDeviceSettings {
  const source = input || {};
  return {
    ...defaults,
    ...source,
    enabled: true,
    mediaThumbnailsVisible: typeof source.mediaThumbnailsVisible === "boolean"
      ? source.mediaThumbnailsVisible
      : defaults.mediaThumbnailsVisible,
    mediaThumbnailSize: boundedNumber(source.mediaThumbnailSize, 24, 160, defaults.mediaThumbnailSize),
    mediaThumbnailGap: boundedNumber(source.mediaThumbnailGap, 0, 40, defaults.mediaThumbnailGap),
    mediaThumbnailRadius: boundedNumber(source.mediaThumbnailRadius, 0, 40, defaults.mediaThumbnailRadius),
    mediaThumbnailBottom: boundedNumber(source.mediaThumbnailBottom, 0, 80, defaults.mediaThumbnailBottom),
    videoModalWidth: boundedNumber(source.videoModalWidth, 280, 1800, defaults.videoModalWidth),
    videoModalRadius: boundedNumber(source.videoModalRadius, 0, 60, defaults.videoModalRadius),
    videoModalBackdropOpacity: boundedNumber(
      source.videoModalBackdropOpacity,
      0,
      100,
      defaults.videoModalBackdropOpacity,
    ),
  };
}

function normalizeProjectMedia(
  value: unknown,
  legacyImage: unknown,
  legacyId: string,
): DonationProjectMedia[] {
  const source = Array.isArray(value)
    ? value
    : typeof legacyImage === "string" && legacyImage.trim()
      ? [{ id: legacyId, type: "image", url: legacyImage }]
      : [];
  const usedIds = new Set<string>();
  return source.slice(0, 20).flatMap((candidate, index): DonationProjectMedia[] => {
    if (!candidate || typeof candidate !== "object") return [];
    const media = candidate as Partial<DonationProjectMedia>;
    const url = String(media.url || "").trim().slice(0, 1500);
    if (!url) return [];
    const requestedId = String(media.id || `${legacyId}-${index + 1}`)
      .trim()
      .replace(/[^a-z0-9_-]/gi, "-")
      .slice(0, 100) || `${legacyId}-${index + 1}`;
    let id = requestedId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${requestedId.slice(0, Math.max(1, 99 - String(suffix).length))}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    const path = String(media.path || "").trim().slice(0, 500) || undefined;
    const poster = String(media.poster || "").trim().slice(0, 1500) || undefined;
    const posterPath = String(media.posterPath || "").trim().slice(0, 500) || undefined;
    const alt = String(media.alt || "").trim().slice(0, 160) || undefined;
    return [{
      id,
      type: media.type === "video" ? "video" : "image",
      url,
      ...(path ? { path } : {}),
      ...(optionalPositiveInteger(media.width, 8192) ? { width: optionalPositiveInteger(media.width, 8192) } : {}),
      ...(optionalPositiveInteger(media.height, 8192) ? { height: optionalPositiveInteger(media.height, 8192) } : {}),
      ...(optionalPositiveInteger(media.size, 150 * 1024 * 1024) ? { size: optionalPositiveInteger(media.size, 150 * 1024 * 1024) } : {}),
      ...(optionalFileName(media.originalName) ? { originalName: optionalFileName(media.originalName) } : {}),
      ...(poster ? { poster } : {}),
      ...(posterPath ? { posterPath } : {}),
      ...(optionalPositiveInteger(media.posterWidth, 8192) ? { posterWidth: optionalPositiveInteger(media.posterWidth, 8192) } : {}),
      ...(optionalPositiveInteger(media.posterHeight, 8192) ? { posterHeight: optionalPositiveInteger(media.posterHeight, 8192) } : {}),
      ...(optionalPositiveInteger(media.posterSize, 5 * 1024 * 1024) ? { posterSize: optionalPositiveInteger(media.posterSize, 5 * 1024 * 1024) } : {}),
      ...(optionalFileName(media.posterOriginalName) ? { posterOriginalName: optionalFileName(media.posterOriginalName) } : {}),
      ...(alt ? { alt } : {}),
    }];
  });
}

export function normalizeModuleSettings(input?: Partial<ModuleSettings> | null): ModuleSettings {
  const donation = input?.donation;
  const hasDynamicCategories = Array.isArray(donation?.categories);
  const legacyIds = [
    ...donationCategoryOptions.map(([id]) => id),
    ...Object.keys(donation?.categoryImages || {}),
    ...(Array.isArray(donation?.visibleCategories) ? donation.visibleCategories : []),
    ...(Array.isArray(donation?.desktopVisibleCategories) ? donation.desktopVisibleCategories : []),
    ...(Array.isArray(donation?.mobileVisibleCategories) ? donation.mobileVisibleCategories : []),
    ...(Array.isArray(donation?.desktopCategoryOrder) ? donation.desktopCategoryOrder : []),
    ...(Array.isArray(donation?.mobileCategoryOrder) ? donation.mobileCategoryOrder : []),
    ...(Array.isArray(donation?.projects) ? donation.projects.map((project) => project.category) : []),
  ];
  const legacyCategoryIds = [...new Set(legacyIds.map((id) => normalizeDonationCategoryId(id)).filter(Boolean))];
  const legacyCategories = legacyCategoryIds.map((id) => {
    const known = defaultDonationCategories.find((category) => category.id === id);
    const label = known?.label || categoryLabelFromId(id);
    return known || { id, label, description: "", imageTitle: label, imageAlt: `${label} bağış kategorisi` };
  });
  const rawCategories: unknown[] = hasDynamicCategories ? donation?.categories || [] : legacyCategories;
  const usedIds = new Set<string>();
  const idAliases = new Map<string, string>();
  const categories = rawCategories.slice(0, 100).map((value, index): DonationCategory => {
    const candidate: { id?: unknown; label?: unknown; description?: unknown; imageTitle?: unknown; imageAlt?: unknown } =
      value && typeof value === "object" ? value : { id: value };
    const originalId = String(candidate.id ?? "");
    const baseId = normalizeDonationCategoryId(originalId, `kategori-${index + 1}`);
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId.slice(0, Math.max(1, 63 - String(suffix).length))}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    if (originalId && !idAliases.has(originalId)) idAliases.set(originalId, id);
    if (!idAliases.has(baseId)) idAliases.set(baseId, id);
    const known = defaultDonationCategories.find((category) => category.id === baseId);
    const label = String(candidate.label ?? known?.label ?? categoryLabelFromId(id)).trim().slice(0, 100) || categoryLabelFromId(id);
    return {
      id,
      label,
      description: String(candidate.description ?? known?.description ?? "").trim().slice(0, 300),
      imageTitle: String(candidate.imageTitle ?? known?.imageTitle ?? label).trim().slice(0, 140),
      imageAlt: String(candidate.imageAlt ?? known?.imageAlt ?? `${label} bağış kategorisi`).trim().slice(0, 180),
    };
  });
  const categoryIds = categories.map((category) => category.id);
  const validIds = new Set<string>(categoryIds);
  const remapId = (value: unknown) => {
    const original = String(value ?? "");
    const safeId = normalizeDonationCategoryId(original);
    return idAliases.get(original) || idAliases.get(safeId) || safeId;
  };
  const defaultVisibleCategories = hasDynamicCategories
    ? categoryIds
    : normalizeCategorySubset(
      donation?.visibleCategories,
      categoryIds,
      validIds,
      remapId,
    );
  const legacyVisibleCategories = normalizeCategorySubset(
    donation?.visibleCategories,
    defaultVisibleCategories,
    validIds,
    remapId,
  );
  const desktopVisibleCategories = normalizeCategorySubset(
    donation?.desktopVisibleCategories,
    legacyVisibleCategories,
    validIds,
    remapId,
  );
  const mobileVisibleCategories = normalizeCategorySubset(
    donation?.mobileVisibleCategories,
    legacyVisibleCategories,
    validIds,
    remapId,
  );
  const desktopCategoryOrder = normalizeCategoryOrder(
    donation?.desktopCategoryOrder,
    categoryIds,
    validIds,
    remapId,
  );
  const mobileCategoryOrder = normalizeCategoryOrder(
    donation?.mobileCategoryOrder,
    categoryIds,
    validIds,
    remapId,
  );
  const visibleCategories = categoryIds.filter(
    (id) => desktopVisibleCategories.includes(id) || mobileVisibleCategories.includes(id),
  );
  const requestedAllCategoryId = donation && Object.prototype.hasOwnProperty.call(donation, "allCategoryId")
    ? String(donation.allCategoryId ?? "")
    : categoryIds.includes("all") ? "all" : "";
  const remappedAllCategoryId = requestedAllCategoryId ? remapId(requestedAllCategoryId) : "";
  const allCategoryId = validIds.has(remappedAllCategoryId) ? remappedAllCategoryId : "";
  const categoryImages: DonationModuleSettings["categoryImages"] = Object.fromEntries(
    categories.map(({ id }) => {
      const fallback = defaultDonationCategoryImages[id as keyof typeof defaultDonationCategoryImages];
      return [id, {
        desktop: fallback?.desktop || "",
        mobile: fallback?.mobile || "",
      }];
    }),
  );
  for (const [originalId, candidate] of Object.entries(donation?.categoryImages || {})) {
    const id = remapId(originalId);
    if (!id) continue;
    const current = categoryImages[id] || { desktop: "", mobile: "" };
    categoryImages[id] = {
      desktop: typeof candidate?.desktop === "string" ? candidate.desktop : current.desktop,
      mobile: typeof candidate?.mobile === "string" ? candidate.mobile : current.mobile,
    };
  }

  return {
    ...defaultModuleSettings,
    ...input,
    donation: {
      ...defaultModuleSettings.donation,
      ...donation,
      categories,
      allCategoryId,
      visibleCategories,
      desktopVisibleCategories,
      mobileVisibleCategories,
      desktopCategoryOrder,
      mobileCategoryOrder,
      categoryImages,
      lowerDesktop: normalizeLowerDeviceSettings(
        donation?.lowerDesktop,
        defaultModuleSettings.donation.lowerDesktop,
      ),
      lowerMobile: normalizeLowerDeviceSettings(
        donation?.lowerMobile,
        defaultModuleSettings.donation.lowerMobile,
      ),
      projects: (Array.isArray(donation?.projects) ? donation.projects : defaultDonationProjects).map((project, index) => {
        const fallback = defaultDonationProjects.find((item) => item.id === project.id) || defaultDonationProjects[index] || defaultDonationProjects[0];
        return {
          ...fallback,
          ...project,
          category: remapId(project.category || fallback.category),
          showInAllDesktop: project.showInAllDesktop !== false,
          showInAllMobile: project.showInAllMobile !== false,
          allOrderDesktop: Number.isFinite(project.allOrderDesktop) ? project.allOrderDesktop : index,
          allOrderMobile: Number.isFinite(project.allOrderMobile) ? project.allOrderMobile : index,
          desktopMedia: normalizeProjectMedia(
            project.desktopMedia,
            project.image,
            `${project.id}-desktop-cover`,
          ),
          mobileMedia: normalizeProjectMedia(
            project.mobileMedia,
            project.image,
            `${project.id}-mobile-cover`,
          ),
          suggested: Array.isArray(project.suggested) && project.suggested.length ? project.suggested : fallback.suggested,
          desktop: normalizeProjectDesign(
            { useSharedImageDesign: true, imageVisible: true, imageFit: "cover", ...project.desktop },
            fallback.desktop,
          ),
          mobile: normalizeProjectDesign(
            { useSharedImageDesign: true, imageVisible: true, imageFit: "cover", ...project.mobile },
            fallback.mobile,
          ),
        };
      }),
    },
  };
}
