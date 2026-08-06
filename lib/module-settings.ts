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
  projects: DonationProject[];
};

export type DonationProject = {
  id: string;
  category: "general" | "qurban" | "water" | "zakat" | "orphan";
  enabled: boolean;
  showInAllDesktop?: boolean;
  showInAllMobile?: boolean;
  allOrderDesktop?: number;
  allOrderMobile?: number;
  title: string;
  description: string;
  image: string;
  badge: string;
  pricingMode: "amount" | "quantity";
  fixedPrice: number;
  suggested: number[];
  customAmountEnabled: boolean;
  desktop: DonationProjectDesign;
  mobile: DonationProjectDesign;
};

export type DonationProjectDesign = {
  useSharedDesign: boolean;
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
    projects: defaultDonationProjects,
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
      leftArrowVisible: true, rightArrowVisible: true, arrowIcon: "chevron", arrowSize: 44, arrowIconSize: 24,
      arrowOffset: -14, arrowVerticalPosition: 50, arrowRadius: 50, arrowBackground: "#ffffff",
      arrowColor: "#123c35", arrowOpacity: 92, arrowBorderWidth: 1, arrowBorderColor: "#d8e2de", arrowShadow: "soft",
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
      actionButtonBackground: "#128465", actionButtonTextColor: "#ffffff", arrowsVisible: true,
      leftArrowVisible: true, rightArrowVisible: true, arrowIcon: "chevron", arrowSize: 40, arrowIconSize: 22,
      arrowOffset: -10, arrowVerticalPosition: 50, arrowRadius: 50, arrowBackground: "#ffffff",
      arrowColor: "#123c35", arrowOpacity: 88, arrowBorderWidth: 1, arrowBorderColor: "#d8e2de", arrowShadow: "soft",
    },
  },
};

export function normalizeModuleSettings(input?: Partial<ModuleSettings> | null): ModuleSettings {
  const donation = input?.donation;
  const categoryImages = Object.fromEntries(
    donationCategoryOptions.map(([id]) => [
      id,
      {
        ...defaultDonationCategoryImages[id],
        ...(donation?.categoryImages?.[id] || {}),
      },
    ]),
  ) as DonationModuleSettings["categoryImages"];

  return {
    ...defaultModuleSettings,
    ...input,
    donation: {
      ...defaultModuleSettings.donation,
      ...donation,
      categoryImages,
      lowerDesktop: {
        ...defaultModuleSettings.donation.lowerDesktop,
        ...donation?.lowerDesktop,
      },
      lowerMobile: {
        ...defaultModuleSettings.donation.lowerMobile,
        ...donation?.lowerMobile,
      },
      projects: (donation?.projects?.length ? donation.projects : defaultDonationProjects).map((project, index) => {
        const fallback = defaultDonationProjects.find((item) => item.id === project.id) || defaultDonationProjects[index] || defaultDonationProjects[0];
        return {
          ...fallback,
          ...project,
          showInAllDesktop: project.showInAllDesktop !== false,
          showInAllMobile: project.showInAllMobile !== false,
          allOrderDesktop: Number.isFinite(project.allOrderDesktop) ? project.allOrderDesktop : index,
          allOrderMobile: Number.isFinite(project.allOrderMobile) ? project.allOrderMobile : index,
          suggested: Array.isArray(project.suggested) && project.suggested.length ? project.suggested : fallback.suggested,
          desktop: { ...fallback.desktop, ...project.desktop },
          mobile: { ...fallback.mobile, ...project.mobile },
        };
      }),
    },
  };
}
