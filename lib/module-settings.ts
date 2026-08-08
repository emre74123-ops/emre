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

export type DonationAmountPreset = {
  id: string;
  label: string;
  amountMinor: number;
  enabled: boolean;
  featured: boolean;
};

export type DonationOptionVisibility = {
  groupId: string;
  optionIds: string[];
};

export type DonationOptionFontWeight = 400 | 500 | 600 | 700 | 800 | 900;

export type DonationOptionTextDesign = {
  fontSize: number;
  fontWeight: DonationOptionFontWeight;
  fontFamily: "inherit" | "sans" | "serif";
  color: string;
  align: "start" | "center" | "end";
  letterSpacing: number;
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
};

export type DonationOption = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  priceMinor: number;
  childFlowEnabled?: boolean;
  useSharedTextDesignDesktop?: boolean;
  useSharedTextDesignMobile?: boolean;
  desktopTextDesign?: DonationOptionTextDesign;
  mobileTextDesign?: DonationOptionTextDesign;
};

export type DonationOptionDesign = {
  titleVisible: boolean;
  titleAlign: "start" | "center" | "end";
  titleSize: number;
  titleWeight: DonationOptionFontWeight;
  titleColor: string;
  descriptionVisible: boolean;
  descriptionSize: number;
  descriptionColor: string;
  titleDescriptionGap: number;
  headerGap: number;
  groupTopGap: number;
  optionHeightMode: "auto" | "fixed";
  optionHeight: number;
  optionWidthMode: "auto" | "fixed" | "equal" | "columns";
  optionWidth: number;
  optionMinWidth: number;
  /** @deprecated Kept for migration from the legacy width controls. */
  equalWidth: boolean;
  /** @deprecated Kept for migration from the legacy width controls. */
  columns: 0 | 1 | 2 | 3 | 4;
  horizontalScroll: boolean;
  justify: "start" | "center" | "end" | "stretch";
  columnGap: number;
  rowGap: number;
  paddingX: number;
  textWrap: boolean;
  labelSize: number;
  labelWeight: DonationOptionFontWeight;
  optionFontFamily: "inherit" | "sans" | "serif";
  optionTextAlign: "start" | "center" | "end";
  optionLetterSpacing: number;
  optionTextTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  optionDescriptionVisible: boolean;
  optionDescriptionSize: number;
  optionDescriptionColor: string;
  priceVisible: boolean;
  pricePosition: "inline" | "below" | "badge";
  background: string;
  textColor: string;
  borderColor: string;
  selectedBackground: string;
  selectedTextColor: string;
  selectedBorderColor: string;
  borderWidth: number;
  radius: number;
  shadow: "none" | "soft" | "medium";
};

export type DonationOptionHeaderDesign = {
  mode: "text" | "divider" | "line" | "accordion" | "symbol";
  icon: "chevron" | "plus-minus" | "dash" | "dot" | "diamond";
  iconPosition: "start" | "end";
  defaultOpen: boolean;
  lineColor: string;
  lineWidth: number;
  lineStyle: "solid" | "dashed" | "dotted";
  animationMs: number;
};

export type DonationOptionGroup = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  required: boolean;
  display: "buttons" | "select" | "cards";
  defaultOptionId?: string;
  visibleWhen?: DonationOptionVisibility;
  options: DonationOption[];
  useSharedDesign?: boolean;
  desktopDesign?: DonationOptionDesign;
  mobileDesign?: DonationOptionDesign;
  headerDesktop?: DonationOptionHeaderDesign;
  headerMobile?: DonationOptionHeaderDesign;
  titleVisibleDesktop?: boolean;
  titleVisibleMobile?: boolean;
  descriptionVisibleDesktop?: boolean;
  descriptionVisibleMobile?: boolean;
};

export type DonationPriceRule = {
  id: string;
  label: string;
  enabled: boolean;
  optionIds: string[];
  amountMinor: number;
};

export type DonationActionDevice = {
  visible: boolean;
  label: string;
  width: "auto" | "half" | "full";
  align: "start" | "center" | "end";
  height: number;
  radius: number;
  order: number;
};

export type DonationProjectAction = {
  id: string;
  enabled: boolean;
  kind: "add-to-cart" | "checkout" | "internal-link" | "external-link" | "whatsapp";
  icon: "none" | "plus" | "cart" | "heart" | "arrow";
  href: string;
  requiresValidSelection: boolean;
  variant: "solid" | "outline" | "soft" | "gradient";
  background: string;
  backgroundEnd: string;
  textColor: string;
  borderColor: string;
  desktop: DonationActionDevice;
  mobile: DonationActionDevice;
};

export type DonationProjectCommerce = {
  version: 2;
  currency: "TRY";
  mode: "amount" | "quantity" | "fixed" | "configured";
  sectionLabel: string;
  customAmountPlaceholder: string;
  validationMessage: string;
  baseAmountMinor: number;
  quantityPresets: number[];
  customAmountEnabled: boolean;
  customAmountMinMinor: number;
  customAmountMaxMinor: number;
  amountPresets: DonationAmountPreset[];
  optionDesignDesktop: DonationOptionDesign;
  optionDesignMobile: DonationOptionDesign;
  optionGroups: DonationOptionGroup[];
  priceRules: DonationPriceRule[];
  actions: DonationProjectAction[];
  actionLayoutDesktop: "row" | "stack";
  actionLayoutMobile: "row" | "stack";
  actionGapDesktop: number;
  actionGapMobile: number;
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
  commerce: DonationProjectCommerce;
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

const COMMERCE_MAX_MONEY_MINOR = 10_000_000_000;

function commerceNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function commerceInteger(value: unknown, min: number, max: number, fallback: number) {
  return Math.round(commerceNumber(value, min, max, fallback));
}

function commerceText(value: unknown, fallback: string, maxLength: number) {
  const cleaned = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
  return cleaned || fallback;
}

function commerceColor(value: unknown, fallback: string) {
  const color = String(value ?? "").trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(color) ? color : fallback;
}

function commerceBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function commerceChoice<T extends string>(value: unknown, choices: readonly T[], fallback: T): T {
  return choices.includes(value as T) ? value as T : fallback;
}

function commerceId(value: unknown, fallback: string) {
  return normalizeDonationCategoryId(value, fallback).slice(0, 64);
}

function uniqueCommerceId(value: unknown, fallback: string, used: Set<string>) {
  const base = commerceId(value, fallback);
  let id = base;
  let suffix = 2;
  while (used.has(id)) {
    const ending = `-${suffix}`;
    id = `${base.slice(0, Math.max(1, 64 - ending.length))}${ending}`;
    suffix += 1;
  }
  used.add(id);
  return id;
}

function commerceHref(value: unknown, kind: DonationProjectAction["kind"]) {
  const href = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 500);
  if (kind === "add-to-cart" || kind === "checkout") return "";
  if (kind === "internal-link") {
    return href.startsWith("/") && !href.startsWith("//") ? href : "";
  }
  try {
    const url = new URL(href);
    if (url.protocol !== "https:") return "";
    if (kind === "external-link") return url.toString().slice(0, 500);
    if (
      kind === "whatsapp"
      && ["wa.me", "api.whatsapp.com", "web.whatsapp.com"].includes(url.hostname.toLowerCase())
    ) {
      return url.toString().slice(0, 500);
    }
  } catch {
    return "";
  }
  return "";
}

function legacyMoneyMinor(value: unknown) {
  return commerceInteger(Number(value) * 100, 0, COMMERCE_MAX_MONEY_MINOR, 0);
}

function normalizeActionDevice(
  value: unknown,
  fallback: DonationActionDevice,
): DonationActionDevice {
  const source = value && typeof value === "object"
    ? value as Partial<DonationActionDevice>
    : {};
  return {
    visible: commerceBoolean(source.visible, fallback.visible),
    label: commerceText(source.label, fallback.label, 80),
    width: commerceChoice(source.width, ["auto", "half", "full"] as const, fallback.width),
    align: commerceChoice(source.align, ["start", "center", "end"] as const, fallback.align),
    height: commerceInteger(source.height, 32, 80, fallback.height),
    radius: commerceInteger(source.radius, 0, 40, fallback.radius),
    order: commerceInteger(source.order, 0, 99, fallback.order),
  };
}

export const defaultDonationOptionDesignDesktop: DonationOptionDesign = {
  titleVisible: true,
  titleAlign: "start",
  titleSize: 10,
  titleWeight: 900,
  titleColor: "#345b54",
  descriptionVisible: true,
  descriptionSize: 10,
  descriptionColor: "#81918d",
  titleDescriptionGap: 4,
  headerGap: 9,
  groupTopGap: 0,
  optionHeightMode: "auto",
  optionHeight: 38,
  optionWidthMode: "auto",
  optionWidth: 120,
  optionMinWidth: 64,
  equalWidth: false,
  columns: 0,
  horizontalScroll: false,
  justify: "start",
  columnGap: 7,
  rowGap: 7,
  paddingX: 12,
  textWrap: true,
  labelSize: 10,
  labelWeight: 800,
  optionFontFamily: "inherit",
  optionTextAlign: "center",
  optionLetterSpacing: 0,
  optionTextTransform: "none",
  optionDescriptionVisible: true,
  optionDescriptionSize: 8,
  optionDescriptionColor: "#6e827d",
  priceVisible: true,
  pricePosition: "inline",
  background: "#ffffff",
  textColor: "#365f57",
  borderColor: "#d6e2de",
  selectedBackground: "#e7f4ef",
  selectedTextColor: "#0d7258",
  selectedBorderColor: "#128465",
  borderWidth: 1,
  radius: 8,
  shadow: "none",
};

export const defaultDonationOptionDesignMobile: DonationOptionDesign = {
  ...defaultDonationOptionDesignDesktop,
  optionMinWidth: 72,
  paddingX: 10,
};

function normalizeOptionFontWeight(
  value: unknown,
  fallback: DonationOptionFontWeight,
): DonationOptionFontWeight {
  const weight = commerceInteger(value, 400, 900, fallback);
  return ([400, 500, 600, 700, 800, 900] as const).includes(weight as DonationOptionFontWeight)
    ? weight as DonationOptionFontWeight
    : fallback;
}

function normalizeOptionColumns(value: unknown, fallback: DonationOptionDesign["columns"]) {
  const columns = commerceInteger(value, 0, 4, fallback);
  return ([0, 1, 2, 3, 4] as const).includes(columns as DonationOptionDesign["columns"])
    ? columns as DonationOptionDesign["columns"]
    : fallback;
}

function normalizeOptionLetterSpacing(value: unknown, fallback: number) {
  return Math.round(commerceNumber(value, -1, 4, fallback) * 10) / 10;
}

function textDesignFromOptionDesign(design: DonationOptionDesign): DonationOptionTextDesign {
  return {
    fontSize: design.labelSize,
    fontWeight: design.labelWeight,
    fontFamily: design.optionFontFamily,
    color: design.textColor,
    align: design.optionTextAlign,
    letterSpacing: design.optionLetterSpacing,
    textTransform: design.optionTextTransform,
  };
}

function normalizeDonationOptionTextDesign(
  value: unknown,
  fallback: DonationOptionTextDesign,
): DonationOptionTextDesign {
  const source = value && typeof value === "object"
    ? value as Partial<DonationOptionTextDesign>
    : {};
  return {
    fontSize: commerceInteger(source.fontSize, 9, 22, fallback.fontSize),
    fontWeight: normalizeOptionFontWeight(source.fontWeight, fallback.fontWeight),
    fontFamily: commerceChoice(source.fontFamily, ["inherit", "sans", "serif"] as const, fallback.fontFamily),
    color: commerceColor(source.color, fallback.color),
    align: commerceChoice(source.align, ["start", "center", "end"] as const, fallback.align),
    letterSpacing: normalizeOptionLetterSpacing(source.letterSpacing, fallback.letterSpacing),
    textTransform: commerceChoice(
      source.textTransform,
      ["none", "uppercase", "lowercase", "capitalize"] as const,
      fallback.textTransform,
    ),
  };
}

function normalizeDonationOptionDesign(
  value: unknown,
  fallback: DonationOptionDesign,
): DonationOptionDesign {
  const source = value && typeof value === "object"
    ? value as Partial<DonationOptionDesign>
    : {};
  const equalWidth = commerceBoolean(source.equalWidth, fallback.equalWidth);
  const columns = normalizeOptionColumns(source.columns, fallback.columns);
  const hasLegacyWidthFields = source.equalWidth !== undefined || source.columns !== undefined;
  const legacyWidthMode: DonationOptionDesign["optionWidthMode"] = columns > 0
    ? "columns"
    : equalWidth
      ? "equal"
      : hasLegacyWidthFields
        ? "auto"
        : fallback.optionWidthMode;
  const legacyHeightMode: DonationOptionDesign["optionHeightMode"] = source.optionHeight !== undefined
    ? "auto"
    : fallback.optionHeightMode;
  const optionWidthMode = commerceChoice(
    source.optionWidthMode,
    ["auto", "fixed", "equal", "columns"] as const,
    legacyWidthMode,
  );
  return {
    titleVisible: commerceBoolean(source.titleVisible, fallback.titleVisible),
    titleAlign: commerceChoice(source.titleAlign, ["start", "center", "end"] as const, fallback.titleAlign),
    titleSize: commerceInteger(source.titleSize, 10, 30, fallback.titleSize),
    titleWeight: normalizeOptionFontWeight(source.titleWeight, fallback.titleWeight),
    titleColor: commerceColor(source.titleColor, fallback.titleColor),
    descriptionVisible: commerceBoolean(source.descriptionVisible, fallback.descriptionVisible),
    descriptionSize: commerceInteger(source.descriptionSize, 8, 20, fallback.descriptionSize),
    descriptionColor: commerceColor(source.descriptionColor, fallback.descriptionColor),
    titleDescriptionGap: commerceInteger(source.titleDescriptionGap, 0, 20, fallback.titleDescriptionGap),
    headerGap: commerceInteger(source.headerGap, 0, 40, fallback.headerGap),
    groupTopGap: commerceInteger(source.groupTopGap, 0, 80, fallback.groupTopGap),
    optionHeightMode: commerceChoice(source.optionHeightMode, ["auto", "fixed"] as const, legacyHeightMode),
    optionHeight: commerceInteger(source.optionHeight, 24, 120, fallback.optionHeight),
    optionWidthMode,
    optionWidth: commerceInteger(source.optionWidth, 40, 320, fallback.optionWidth),
    optionMinWidth: commerceInteger(source.optionMinWidth, 40, 260, fallback.optionMinWidth),
    equalWidth,
    columns: optionWidthMode === "columns" && columns === 0 ? 1 : columns,
    horizontalScroll: commerceBoolean(source.horizontalScroll, fallback.horizontalScroll),
    justify: commerceChoice(source.justify, ["start", "center", "end", "stretch"] as const, fallback.justify),
    columnGap: commerceInteger(source.columnGap, 0, 32, fallback.columnGap),
    rowGap: commerceInteger(source.rowGap, 0, 32, fallback.rowGap),
    paddingX: commerceInteger(source.paddingX, 4, 32, fallback.paddingX),
    textWrap: commerceBoolean(source.textWrap, fallback.textWrap),
    labelSize: commerceInteger(source.labelSize, 9, 22, fallback.labelSize),
    labelWeight: normalizeOptionFontWeight(source.labelWeight, fallback.labelWeight),
    optionFontFamily: commerceChoice(source.optionFontFamily, ["inherit", "sans", "serif"] as const, fallback.optionFontFamily),
    optionTextAlign: commerceChoice(source.optionTextAlign, ["start", "center", "end"] as const, fallback.optionTextAlign),
    optionLetterSpacing: normalizeOptionLetterSpacing(source.optionLetterSpacing, fallback.optionLetterSpacing),
    optionTextTransform: commerceChoice(
      source.optionTextTransform,
      ["none", "uppercase", "lowercase", "capitalize"] as const,
      fallback.optionTextTransform,
    ),
    optionDescriptionVisible: commerceBoolean(source.optionDescriptionVisible, fallback.optionDescriptionVisible),
    optionDescriptionSize: commerceInteger(
      source.optionDescriptionSize,
      8,
      18,
      fallback.optionDescriptionSize,
    ),
    optionDescriptionColor: commerceColor(source.optionDescriptionColor, fallback.optionDescriptionColor),
    priceVisible: commerceBoolean(source.priceVisible, fallback.priceVisible),
    pricePosition: commerceChoice(source.pricePosition, ["inline", "below", "badge"] as const, fallback.pricePosition),
    background: commerceColor(source.background, fallback.background),
    textColor: commerceColor(source.textColor, fallback.textColor),
    borderColor: commerceColor(source.borderColor, fallback.borderColor),
    selectedBackground: commerceColor(source.selectedBackground, fallback.selectedBackground),
    selectedTextColor: commerceColor(source.selectedTextColor, fallback.selectedTextColor),
    selectedBorderColor: commerceColor(source.selectedBorderColor, fallback.selectedBorderColor),
    borderWidth: commerceInteger(source.borderWidth, 0, 4, fallback.borderWidth),
    radius: commerceInteger(source.radius, 0, 36, fallback.radius),
    shadow: commerceChoice(source.shadow, ["none", "soft", "medium"] as const, fallback.shadow),
  };
}

function normalizeDonationOptionHeaderDesign(
  value: unknown,
  titleColor: string,
): DonationOptionHeaderDesign {
  const source = value && typeof value === "object"
    ? value as Partial<DonationOptionHeaderDesign>
    : {};
  const fallbackColor = commerceColor(titleColor, "#345b54");
  const mode = commerceChoice(source.mode, ["text", "divider", "line", "accordion", "symbol"] as const, "text");
  const requestedIcon = commerceChoice(source.icon, ["chevron", "plus-minus", "dash", "dot", "diamond"] as const, "chevron");
  const icon = mode === "accordion" && requestedIcon !== "chevron" && requestedIcon !== "plus-minus"
    ? "chevron"
    : requestedIcon;
  return {
    mode,
    icon,
    iconPosition: commerceChoice(source.iconPosition, ["start", "end"] as const, "end"),
    defaultOpen: commerceBoolean(source.defaultOpen, true),
    lineColor: commerceColor(source.lineColor, fallbackColor),
    lineWidth: commerceNumber(source.lineWidth, 1, 8, 1),
    lineStyle: commerceChoice(source.lineStyle, ["solid", "dashed", "dotted"] as const, "solid"),
    animationMs: commerceInteger(source.animationMs, 0, 1000, 220),
  };
}

function migrateLegacyProjectCommerce(
  project: Partial<DonationProject> | null | undefined,
): DonationProjectCommerce {
  const legacyMode = commerceChoice(
    (project as { pricingMode?: unknown } | null | undefined)?.pricingMode,
    ["amount", "quantity", "fixed", "configured"] as const,
    "amount",
  );
  const suggested = Array.isArray(project?.suggested)
    ? project.suggested
      .map((value) => commerceNumber(value, 0, 100_000_000, 0))
      .filter((value) => value > 0)
      .slice(0, 12)
    : [];
  const desktopDesign = project?.desktop;
  const mobileDesign = project?.mobile;
  const desktopLabel = commerceText(desktopDesign?.actionText, "Sepete ekle", 80);
  const mobileLabel = commerceText(mobileDesign?.actionText, desktopLabel, 80);
  const actionBackground = commerceColor(
    desktopDesign?.actionBackground ?? mobileDesign?.actionBackground,
    "#128465",
  );
  const actionTextColor = commerceColor(
    desktopDesign?.actionTextColor ?? mobileDesign?.actionTextColor,
    "#ffffff",
  );
  const amountPresetIds = new Set<string>();
  const amountPresets = legacyMode === "amount"
    ? suggested.map((amount, index): DonationAmountPreset => ({
      id: uniqueCommerceId(`tutar-${amount}`, `tutar-${index + 1}`, amountPresetIds),
      label: `${amount.toLocaleString("tr-TR")} TL`,
      amountMinor: legacyMoneyMinor(amount),
      enabled: true,
      featured: index === 0,
    }))
    : [];
  const quantityPresets = legacyMode === "quantity"
    ? [...new Set(suggested.map((value) => commerceInteger(value, 1, 10_000, 1)))]
    : [];
  const customAmountEnabled = commerceBoolean(project?.customAmountEnabled, legacyMode === "amount");
  return {
    version: 2,
    currency: "TRY",
    mode: legacyMode,
    sectionLabel: legacyMode === "quantity" ? "Hisse adedi" : "Bağış tutarı",
    customAmountPlaceholder: "Başka tutar",
    validationMessage: "Lütfen geçerli bir seçim yapın.",
    baseAmountMinor: legacyMoneyMinor(project?.fixedPrice),
    quantityPresets,
    customAmountEnabled,
    customAmountMinMinor: customAmountEnabled ? 100 : 0,
    customAmountMaxMinor: COMMERCE_MAX_MONEY_MINOR,
    amountPresets,
    optionDesignDesktop: { ...defaultDonationOptionDesignDesktop },
    optionDesignMobile: { ...defaultDonationOptionDesignMobile },
    optionGroups: [],
    priceRules: [],
    actions: [{
      id: "sepete-ekle",
      enabled: true,
      kind: "add-to-cart",
      icon: "plus",
      href: "",
      requiresValidSelection: true,
      variant: "solid",
      background: actionBackground,
      backgroundEnd: actionBackground,
      textColor: actionTextColor,
      borderColor: actionBackground,
      desktop: {
        visible: true,
        label: desktopLabel,
        width: "full",
        align: "center",
        height: commerceInteger(desktopDesign?.actionHeight, 32, 80, 46),
        radius: commerceInteger(desktopDesign?.actionRadius, 0, 40, 9),
        order: 0,
      },
      mobile: {
        visible: true,
        label: mobileLabel,
        width: "full",
        align: "center",
        height: commerceInteger(mobileDesign?.actionHeight, 32, 80, 46),
        radius: commerceInteger(mobileDesign?.actionRadius, 0, 40, 9),
        order: 0,
      },
    }],
    actionLayoutDesktop: "row",
    actionLayoutMobile: "stack",
    actionGapDesktop: 10,
    actionGapMobile: 10,
  };
}

export function resolveDonationProjectCommerce(
  project: Partial<DonationProject> | null | undefined,
): DonationProjectCommerce {
  const fallback = migrateLegacyProjectCommerce(project);
  const candidate = project?.commerce;
  if (!candidate || Number(candidate.version) !== 2) return fallback;
  const source = candidate as Partial<DonationProjectCommerce>;

  const amountPresetIds = new Set<string>();
  const amountPresetSource = Array.isArray(source.amountPresets)
    ? source.amountPresets
    : fallback.amountPresets;
  const amountPresets = amountPresetSource.slice(0, 12).flatMap((value, index): DonationAmountPreset[] => {
    if (!value || typeof value !== "object") return [];
    const preset = value as Partial<DonationAmountPreset>;
    return [{
      id: uniqueCommerceId(preset.id, `tutar-${index + 1}`, amountPresetIds),
      label: commerceText(preset.label, `Tutar ${index + 1}`, 80),
      amountMinor: commerceInteger(preset.amountMinor, 0, COMMERCE_MAX_MONEY_MINOR, 0),
      enabled: commerceBoolean(preset.enabled, true),
      featured: commerceBoolean(preset.featured, false),
    }];
  });

  const quantityPresetSource = Array.isArray(source.quantityPresets)
    ? source.quantityPresets
    : fallback.quantityPresets;
  const quantityPresets = [...new Set(
    quantityPresetSource
      .map((value) => commerceInteger(value, 1, 10_000, 1))
      .slice(0, 12),
  )];

  const optionDesignDesktop = normalizeDonationOptionDesign(
    source.optionDesignDesktop,
    fallback.optionDesignDesktop,
  );
  const optionDesignMobile = normalizeDonationOptionDesign(
    source.optionDesignMobile,
    fallback.optionDesignMobile,
  );

  const groupIds = new Set<string>();
  const optionIds = new Set<string>();
  const optionsByGroup = new Map<string, Set<string>>();
  const enabledOptionsByGroup = new Map<string, Set<string>>();
  const groupSource = Array.isArray(source.optionGroups)
    ? source.optionGroups
    : fallback.optionGroups;
  const optionGroups = groupSource.slice(0, 12).flatMap((value, groupIndex): DonationOptionGroup[] => {
    if (!value || typeof value !== "object") return [];
    const group = value as Partial<DonationOptionGroup>;
    const id = uniqueCommerceId(group.id, `secenek-grubu-${groupIndex + 1}`, groupIds);
    const useSharedDesign = commerceBoolean(group.useSharedDesign, true);
    const desktopDesign = normalizeDonationOptionDesign(group.desktopDesign, optionDesignDesktop);
    const mobileDesign = normalizeDonationOptionDesign(group.mobileDesign, optionDesignMobile);
    const headerDesktop = normalizeDonationOptionHeaderDesign(group.headerDesktop, desktopDesign.titleColor);
    const headerMobile = normalizeDonationOptionHeaderDesign(group.headerMobile, mobileDesign.titleColor);
    const desktopTextFallback = textDesignFromOptionDesign(useSharedDesign ? optionDesignDesktop : desktopDesign);
    const mobileTextFallback = textDesignFromOptionDesign(useSharedDesign ? optionDesignMobile : mobileDesign);
    const localOptionIds = new Set<string>();
    const groupOptions = Array.isArray(group.options) ? group.options : [];
    const options = groupOptions.slice(0, 30).flatMap((optionValue, optionIndex): DonationOption[] => {
      if (!optionValue || typeof optionValue !== "object") return [];
      const option = optionValue as Partial<DonationOption>;
      const optionId = uniqueCommerceId(
        option.id,
        `${id}-secenek-${optionIndex + 1}`,
        optionIds,
      );
      localOptionIds.add(optionId);
      return [{
        id: optionId,
        label: commerceText(option.label, `Seçenek ${optionIndex + 1}`, 80),
        description: commerceText(option.description, "", 300),
        enabled: commerceBoolean(option.enabled, true),
        priceMinor: commerceInteger(option.priceMinor, 0, COMMERCE_MAX_MONEY_MINOR, 0),
        childFlowEnabled: commerceBoolean(option.childFlowEnabled, true),
        useSharedTextDesignDesktop: commerceBoolean(option.useSharedTextDesignDesktop, true),
        useSharedTextDesignMobile: commerceBoolean(option.useSharedTextDesignMobile, true),
        desktopTextDesign: normalizeDonationOptionTextDesign(option.desktopTextDesign, desktopTextFallback),
        mobileTextDesign: normalizeDonationOptionTextDesign(option.mobileTextDesign, mobileTextFallback),
      }];
    });
    optionsByGroup.set(id, localOptionIds);
    enabledOptionsByGroup.set(
      id,
      new Set(options.filter((option) => option.enabled).map((option) => option.id)),
    );
    const requestedDefault = commerceId(group.defaultOptionId, "");
    const defaultOptionId = requestedDefault && enabledOptionsByGroup.get(id)?.has(requestedDefault)
      ? requestedDefault
      : undefined;
    const rawVisibility = group.visibleWhen;
    const visibilityGroupId = commerceId(rawVisibility?.groupId, "");
    const visibilityOptionIds = visibilityGroupId && visibilityGroupId !== id && optionsByGroup.has(visibilityGroupId)
      ? [...new Set(
        (Array.isArray(rawVisibility?.optionIds) ? rawVisibility.optionIds : [])
          .map((optionId) => commerceId(optionId, ""))
          .filter((optionId) => optionsByGroup.get(visibilityGroupId)?.has(optionId)),
      )]
      : [];
    return [{
      id,
      label: commerceText(group.label, `Seçenek grubu ${groupIndex + 1}`, 80),
      description: commerceText(group.description, "", 300),
      enabled: commerceBoolean(group.enabled, true),
      required: commerceBoolean(group.required, false),
      display: commerceChoice(group.display, ["buttons", "select", "cards"] as const, "buttons"),
      ...(defaultOptionId ? { defaultOptionId } : {}),
      ...(visibilityGroupId && visibilityOptionIds.length
        ? { visibleWhen: { groupId: visibilityGroupId, optionIds: visibilityOptionIds } }
        : {}),
      options,
      useSharedDesign,
      desktopDesign,
      mobileDesign,
      headerDesktop,
      headerMobile,
      ...(typeof group.titleVisibleDesktop === "boolean"
        ? { titleVisibleDesktop: group.titleVisibleDesktop }
        : {}),
      ...(typeof group.titleVisibleMobile === "boolean"
        ? { titleVisibleMobile: group.titleVisibleMobile }
        : {}),
      ...(typeof group.descriptionVisibleDesktop === "boolean"
        ? { descriptionVisibleDesktop: group.descriptionVisibleDesktop }
        : {}),
      ...(typeof group.descriptionVisibleMobile === "boolean"
        ? { descriptionVisibleMobile: group.descriptionVisibleMobile }
        : {}),
    }];
  });

  const ruleIds = new Set<string>();
  const priceRuleSource = Array.isArray(source.priceRules) ? source.priceRules : fallback.priceRules;
  const priceRules = priceRuleSource.slice(0, 200).flatMap((value, index): DonationPriceRule[] => {
    if (!value || typeof value !== "object") return [];
    const rule = value as Partial<DonationPriceRule>;
    const validOptionIds = [...new Set(
      (Array.isArray(rule.optionIds) ? rule.optionIds : [])
        .map((optionId) => commerceId(optionId, ""))
        .filter((optionId) => optionIds.has(optionId)),
    )];
    if (!validOptionIds.length) return [];
    return [{
      id: uniqueCommerceId(rule.id, `fiyat-kurali-${index + 1}`, ruleIds),
      label: commerceText(rule.label, `Fiyat kuralı ${index + 1}`, 80),
      enabled: commerceBoolean(rule.enabled, true),
      optionIds: validOptionIds,
      amountMinor: commerceInteger(rule.amountMinor, 0, COMMERCE_MAX_MONEY_MINOR, 0),
    }];
  });

  const actionIds = new Set<string>();
  const actionSource = Array.isArray(source.actions) ? source.actions : fallback.actions;
  const actions = actionSource.slice(0, 4).flatMap((value, index): DonationProjectAction[] => {
    if (!value || typeof value !== "object") return [];
    const action = value as Partial<DonationProjectAction>;
    const fallbackAction = fallback.actions[Math.min(index, fallback.actions.length - 1)]
      || fallback.actions[0];
    const kind = commerceChoice(
      action.kind,
      ["add-to-cart", "checkout", "internal-link", "external-link", "whatsapp"] as const,
      fallbackAction.kind,
    );
    const background = commerceColor(action.background, fallbackAction.background);
    return [{
      id: uniqueCommerceId(action.id, `eylem-${index + 1}`, actionIds),
      enabled: commerceBoolean(action.enabled, true),
      kind,
      icon: commerceChoice(
        action.icon,
        ["none", "plus", "cart", "heart", "arrow"] as const,
        fallbackAction.icon,
      ),
      href: commerceHref(action.href, kind),
      requiresValidSelection: commerceBoolean(action.requiresValidSelection, true),
      variant: commerceChoice(
        action.variant,
        ["solid", "outline", "soft", "gradient"] as const,
        fallbackAction.variant,
      ),
      background,
      backgroundEnd: commerceColor(action.backgroundEnd, background),
      textColor: commerceColor(action.textColor, fallbackAction.textColor),
      borderColor: commerceColor(action.borderColor, background),
      desktop: normalizeActionDevice(action.desktop, fallbackAction.desktop),
      mobile: normalizeActionDevice(action.mobile, fallbackAction.mobile),
    }];
  });

  const customAmountMinMinor = commerceInteger(
    source.customAmountMinMinor,
    0,
    COMMERCE_MAX_MONEY_MINOR,
    fallback.customAmountMinMinor,
  );
  const requestedCustomAmountMax = commerceInteger(
    source.customAmountMaxMinor,
    0,
    COMMERCE_MAX_MONEY_MINOR,
    fallback.customAmountMaxMinor,
  );

  return {
    version: 2,
    currency: "TRY",
    mode: commerceChoice(
      source.mode,
      ["amount", "quantity", "fixed", "configured"] as const,
      fallback.mode,
    ),
    sectionLabel: commerceText(source.sectionLabel, fallback.sectionLabel, 80),
    customAmountPlaceholder: commerceText(
      source.customAmountPlaceholder,
      fallback.customAmountPlaceholder,
      100,
    ),
    validationMessage: commerceText(source.validationMessage, fallback.validationMessage, 180),
    baseAmountMinor: commerceInteger(
      source.baseAmountMinor,
      0,
      COMMERCE_MAX_MONEY_MINOR,
      fallback.baseAmountMinor,
    ),
    quantityPresets,
    customAmountEnabled: commerceBoolean(source.customAmountEnabled, fallback.customAmountEnabled),
    customAmountMinMinor,
    customAmountMaxMinor: Math.max(customAmountMinMinor, requestedCustomAmountMax),
    amountPresets,
    optionDesignDesktop,
    optionDesignMobile,
    optionGroups,
    priceRules,
    actions,
    actionLayoutDesktop: commerceChoice(
      source.actionLayoutDesktop,
      ["row", "stack"] as const,
      fallback.actionLayoutDesktop,
    ),
    actionLayoutMobile: commerceChoice(
      source.actionLayoutMobile,
      ["row", "stack"] as const,
      fallback.actionLayoutMobile,
    ),
    actionGapDesktop: commerceInteger(source.actionGapDesktop, 0, 40, fallback.actionGapDesktop),
    actionGapMobile: commerceInteger(source.actionGapMobile, 0, 40, fallback.actionGapMobile),
  };
}

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

function createDefaultDonationProject(
  project: Omit<DonationProject, "commerce">,
): DonationProject {
  return {
    ...project,
    commerce: resolveDonationProjectCommerce(project),
  };
}

export const defaultDonationProjects: DonationProject[] = ([
  { id: "water-africa", category: "water", enabled: true, title: "Afrika Su Kuyusu", description: "Temiz suya erişimi olmayan bir bölgeye kalıcı bir su kaynağı kazandırın.", image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1000&q=85", badge: "Kalıcı iyilik", pricingMode: "quantity", fixedPrice: 2900, suggested: [1, 2, 3, 4], customAmountEnabled: false, desktop: { ...defaultProjectDesign }, mobile: { ...defaultProjectDesign, cardWidth: 330, cardPadding: 20, cardRadius: 16, titleSize: 24, imageHeight: 205 } },
  { id: "general-support", category: "general", enabled: true, title: "İyilik Fonu", description: "Bağışınız, öncelikli ihtiyaçların hızlı ve şeffaf biçimde karşılanmasına destek olur.", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=85", badge: "En çok ihtiyaç duyulan", pricingMode: "amount", fixedPrice: 0, suggested: [250, 500, 1000, 2000], customAmountEnabled: true, desktop: { ...defaultProjectDesign }, mobile: { ...defaultProjectDesign, cardWidth: 330, cardPadding: 20, cardRadius: 16, titleSize: 24, imageHeight: 205 } },
  { id: "orphan-meal", category: "orphan", enabled: true, title: "Yetim Çocuklara Yemek", description: "Bir çocuğun günlük sıcak yemek ihtiyacına katkıda bulunun.", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=85", badge: "Bir sofraya ortak ol", pricingMode: "amount", fixedPrice: 0, suggested: [150, 300, 600, 1200], customAmountEnabled: true, desktop: { ...defaultProjectDesign }, mobile: { ...defaultProjectDesign, cardWidth: 330, cardPadding: 20, cardRadius: 16, titleSize: 24, imageHeight: 205 } },
  { id: "qurban-share", category: "qurban", enabled: true, title: "Kurban Hissesi", description: "Kurban bağışınızı ihtiyaç sahiplerine güvenle ulaştırıyoruz.", image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1000&q=85", badge: "Hisse bağışı", pricingMode: "quantity", fixedPrice: 4750, suggested: [1, 2, 3, 4], customAmountEnabled: false, desktop: { ...defaultProjectDesign }, mobile: { ...defaultProjectDesign, cardWidth: 330, cardPadding: 20, cardRadius: 16, titleSize: 24, imageHeight: 205 } },
  { id: "zakat", category: "zakat", enabled: true, title: "Zekât Bağışı", description: "Zekâtınızı ihtiyaç sahibi ailelere titizlikle ulaştıralım.", image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1000&q=85", badge: "Güvenli ulaştırma", pricingMode: "amount", fixedPrice: 0, suggested: [500, 1000, 2500, 5000], customAmountEnabled: true, desktop: { ...defaultProjectDesign }, mobile: { ...defaultProjectDesign, cardWidth: 330, cardPadding: 20, cardRadius: 16, titleSize: 24, imageHeight: 205 } },
] satisfies Omit<DonationProject, "commerce">[]).map(createDefaultDonationProject);

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
          pricingMode: project.pricingMode === "quantity" ? "quantity" : "amount",
          fixedPrice: boundedNumber(project.fixedPrice, 0, 100_000_000, fallback.fixedPrice),
          suggested: Array.isArray(project.suggested)
            ? project.suggested
              .slice(0, 12)
              .map((value) => boundedNumber(value, 0, 100_000_000, 0))
            : fallback.suggested,
          customAmountEnabled: typeof project.customAmountEnabled === "boolean"
            ? project.customAmountEnabled
            : fallback.customAmountEnabled,
          commerce: resolveDonationProjectCommerce(project),
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
