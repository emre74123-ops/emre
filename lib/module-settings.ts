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
  cardGap: number;
  contentGap: number;
  progressColor: string;
  progressTrackColor: string;
  visibleCategories: string[];
  placement: "home-after-slider";
  categoryImages: Record<string, { desktop: string; mobile: string }>;
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
    cardGap: 10,
    contentGap: 38,
    progressColor: "#128465",
    progressTrackColor: "#e1ebe7",
    visibleCategories: donationCategoryOptions.map(([id]) => id),
    placement: "home-after-slider",
    categoryImages: defaultDonationCategoryImages,
  },
};
