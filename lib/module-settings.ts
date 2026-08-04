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
  },
};
