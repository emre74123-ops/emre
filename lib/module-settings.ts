export type DonationModuleSettings = {
  enabled: boolean;
  autoScroll: boolean;
  autoScrollSpeed: number;
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
  visibleCategories: string[];
  placement: "home-after-slider";
  categoryImages: Record<string, { desktop: string; mobile: string }>;
  lowerDesktop: DonationLowerDeviceSettings;
  lowerMobile: DonationLowerDeviceSettings;
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
  titleSize: number;
  titleColor: string;
  titleWeight: number;
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

export const defaultDonationCategoryImages = {
  all: { desktop: "/donation-categories/tum-bagislar.webp", mobile: "/donation-categories/tum-bagislar.webp" },
  general: { desktop: "/donation-categories/genel-bagis.webp", mobile: "/donation-categories/genel-bagis.webp" },
  qurban: { desktop: "/donation-categories/kurban.webp", mobile: "/donation-categories/kurban.webp" },
  water: { desktop: "/donation-categories/su-kuyusu.webp", mobile: "/donation-categories/su-kuyusu.webp" },
  zakat: { desktop: "/donation-categories/zekat-fitre.webp", mobile: "/donation-categories/zekat-fitre.webp" },
  orphan: { desktop: "/donation-categories/yetim-destegi.webp", mobile: "/donation-categories/yetim-destegi.webp" },
};

export const defaultModuleSettings: ModuleSettings = {
  donation: {
    enabled: true,
    autoScroll: true,
    autoScrollSpeed: 1,
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
    visibleCategories: donationCategoryOptions.map(([id]) => id),
    placement: "home-after-slider",
    categoryImages: defaultDonationCategoryImages,
    lowerDesktop: {
      enabled: true, showHeading: true, headingEyebrow: "BAĞIŞ ALANLARI", headingTitle: "Destek projeleri",
      layout: "carousel", columns: 3, sectionMaxWidth: 1320, sectionPadding: 0, sectionGap: 22,
      cardWidth: 370, cardRadius: 18, cardPadding: 24, cardGap: 22, cardBackground: "#ffffff",
      cardBorderColor: "#e2e8e4", cardBorderWidth: 1, cardShadow: "soft",
      imageVisible: true, imageHeight: 218, imageRadius: 0, imageFit: "cover",
      titleSize: 26, titleColor: "#143b34", titleWeight: 500,
      descriptionVisible: true, descriptionSize: 12, descriptionColor: "#6e827d",
      priceButtonHeight: 38, priceButtonRadius: 8, priceBackground: "#ffffff", priceTextColor: "#365f57",
      selectedPriceBackground: "#e7f4ef", selectedPriceTextColor: "#0d7258", customAmountVisible: true,
      actionButtonText: "Sepete ekle", actionButtonHeight: 46, actionButtonRadius: 9,
      actionButtonBackground: "#128465", actionButtonTextColor: "#ffffff", arrowsVisible: true,
    },
    lowerMobile: {
      enabled: true, showHeading: true, headingEyebrow: "BAĞIŞ ALANLARI", headingTitle: "Destek projeleri",
      layout: "carousel", columns: 1, sectionMaxWidth: 640, sectionPadding: 12, sectionGap: 14,
      cardWidth: 330, cardRadius: 16, cardPadding: 20, cardGap: 14, cardBackground: "#ffffff",
      cardBorderColor: "#e2e8e4", cardBorderWidth: 1, cardShadow: "soft",
      imageVisible: true, imageHeight: 205, imageRadius: 0, imageFit: "cover",
      titleSize: 24, titleColor: "#143b34", titleWeight: 500,
      descriptionVisible: true, descriptionSize: 12, descriptionColor: "#6e827d",
      priceButtonHeight: 38, priceButtonRadius: 8, priceBackground: "#ffffff", priceTextColor: "#365f57",
      selectedPriceBackground: "#e7f4ef", selectedPriceTextColor: "#0d7258", customAmountVisible: true,
      actionButtonText: "Sepete ekle", actionButtonHeight: 46, actionButtonRadius: 9,
      actionButtonBackground: "#128465", actionButtonTextColor: "#ffffff", arrowsVisible: false,
    },
  },
};
