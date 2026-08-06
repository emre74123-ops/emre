"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { readCart, writeCart, type CartItem } from "../../lib/cart";
import { defaultModuleSettings, type DonationModuleSettings, type DonationProject } from "../../lib/module-settings";
import styles from "./donation-module.module.css";

type Category = "all" | "general" | "qurban" | "water" | "zakat" | "orphan";
type Project = {
  id: string;
  category: Category;
  title: string;
  description: string;
  image: string;
  badge: string;
  fixedPrice?: number;
  suggested: number[];
};

const categories: { id: Category; label: string }[] = [
  { id: "all", label: "Tüm Bağışlar" },
  { id: "general", label: "Genel Bağış" },
  { id: "qurban", label: "Kurban" },
  { id: "water", label: "Su Kuyusu" },
  { id: "zakat", label: "Zekât ve Fitre" },
  { id: "orphan", label: "Yetim Desteği" },
];

const projects: Project[] = [
  {
    id: "water-africa",
    category: "water",
    title: "Afrika Su Kuyusu",
    description: "Temiz suya erişimi olmayan bir bölgeye kalıcı bir su kaynağı kazandırın.",
    image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1000&q=85",
    badge: "Kalıcı iyilik",
    fixedPrice: 2900,
    suggested: [1, 2, 3, 4],
  },
  {
    id: "general-support",
    category: "general",
    title: "İyilik Fonu",
    description: "Bağışınız, öncelikli ihtiyaçların hızlı ve şeffaf biçimde karşılanmasına destek olur.",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=85",
    badge: "En çok ihtiyaç duyulan",
    suggested: [250, 500, 1000, 2000],
  },
  {
    id: "orphan-meal",
    category: "orphan",
    title: "Yetim Çocuklara Yemek",
    description: "Bir çocuğun günlük sıcak yemek ihtiyacına katkıda bulunun.",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=85",
    badge: "Bir sofraya ortak ol",
    suggested: [150, 300, 600, 1200],
  },
  {
    id: "qurban-share",
    category: "qurban",
    title: "Kurban Hissesi",
    description: "Kurban bağışınızı ihtiyaç sahiplerine güvenle ulaştırıyoruz.",
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1000&q=85",
    badge: "Hisse bağışı",
    fixedPrice: 4750,
    suggested: [1, 2, 3, 4],
  },
  {
    id: "zakat",
    category: "zakat",
    title: "Zekât Bağışı",
    description: "Zekâtınızı ihtiyaç sahibi ailelere titizlikle ulaştıralım.",
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1000&q=85",
    badge: "Güvenli ulaştırma",
    suggested: [500, 1000, 2500, 5000],
  },
];

const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const shadowValue = {
  none: "none",
  soft: "0 7px 18px rgba(18,60,53,.08)",
  medium: "0 12px 28px rgba(18,60,53,.16)",
  strong: "0 18px 38px rgba(18,60,53,.26)",
} as const;
const arrowSymbols = {
  thin: ["←", "→"],
  chevron: ["‹", "›"],
  bold: ["❮", "❯"],
  long: ["⟵", "⟶"],
  triangle: ["◀", "▶"],
} as const;

export default function DonationModule({ embedded = false, settings = defaultModuleSettings.donation, previewDevice, previewCategory }: { embedded?: boolean; settings?: DonationModuleSettings; previewDevice?: "desktop" | "mobile"; previewCategory?: Category }) {
  const cardsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const categoryDirectionRef = useRef<1 | -1>(1);
  const categoryPausedRef = useRef(false);
  const [categoryProgress, setCategoryProgress] = useState(0);
  const [category, setCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (previewCategory) setCategory(previewCategory);
  }, [previewCategory]);

  const visibleCategories = categories.filter((item) => settings.visibleCategories.includes(item.id));
  const effectiveCategory = settings.visibleCategories.includes(category) ? category : "all";
  const filtered = settings.projects.filter((project) => project.enabled && (effectiveCategory === "all" || project.category === effectiveCategory));

  useEffect(() => {
    const rail = categoriesRef.current;
    if (!rail) return;
    const timer = window.setInterval(() => {
      if (!settings.autoScroll || categoryPausedRef.current || rail.scrollWidth <= rail.clientWidth) return;
      const max = rail.scrollWidth - rail.clientWidth;
      const next = rail.scrollLeft + categoryDirectionRef.current * settings.autoScrollSpeed;
      if (next >= max) categoryDirectionRef.current = -1;
      if (next <= 0) categoryDirectionRef.current = 1;
      rail.scrollLeft = Math.max(0, Math.min(max, next));
    }, 34);
    return () => window.clearInterval(timer);
  }, [settings.autoScroll, settings.autoScrollSpeed]);

  function updateCategoryProgress() {
    const rail = categoriesRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setCategoryProgress(max > 0 ? Math.min(100, Math.max(0, (rail.scrollLeft / max) * 100)) : 100);
  }

  function addToCart(project: DonationProject) {
    const picked = selected[project.id] ?? project.suggested[0];
    const quantity = project.pricingMode === "quantity" ? picked : 1;
    const typed = Number(custom[project.id]?.replace(",", "."));
    const amount = project.pricingMode === "quantity" ? project.fixedPrice : (Number.isFinite(typed) && typed > 0 ? typed : picked);
    const id = `${project.id}-${amount}`;
    const current = readCart();
    const existing = current.find((item) => item.id === id);
    const next: CartItem[] = existing
      ? current.map((item) => item.id === id ? { ...item, quantity: Math.min(99, item.quantity + quantity) } : item)
      : [...current, { id, project: project.title, amount, quantity }];
    writeCart(next);
    window.dispatchEvent(new CustomEvent("iyilik-cart-updated", { detail: next }));
    window.dispatchEvent(new Event("iyilik-cart-open"));
    setNotice(`${project.title} sepete eklendi.`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function moveCards(direction: -1 | 1) {
    cardsRef.current?.scrollBy({ left: direction * Math.min(760, cardsRef.current.clientWidth * .82), behavior: "smooth" });
  }

  const desktopExtraSide = settings.desktopProgressPosition === "both" ? settings.desktopProgressExtraSpace / 2 : 0;
  const mobileExtraSide = settings.mobileProgressPosition === "both" ? settings.mobileProgressExtraSpace / 2 : 0;
  const desktopTopSpace = settings.desktopProgressPosition === "bottom" ? 0 : settings.desktopProgressGap + settings.desktopProgressThickness + desktopExtraSide;
  const desktopBottomSpace = settings.desktopProgressPosition === "top" ? 0 : settings.desktopProgressGap + settings.desktopProgressThickness + desktopExtraSide;
  const mobileTopSpace = settings.mobileProgressPosition === "bottom" ? 0 : settings.mobileProgressGap + settings.mobileProgressThickness + mobileExtraSide;
  const mobileBottomSpace = settings.mobileProgressPosition === "top" ? 0 : settings.mobileProgressGap + settings.mobileProgressThickness + mobileExtraSide;

  return (
    <section
      className={`${styles.page}${embedded ? ` ${styles.embedded}` : ""}${previewDevice === "mobile" ? ` ${styles.forceMobile}` : ""}`}
      style={{
        "--dm-desktop-overlap": `${settings.desktopOverlap}px`,
        "--dm-mobile-overlap": `${settings.mobileOverlap}px`,
        "--dm-desktop-card-width": `${settings.desktopCardWidth}px`,
        "--dm-desktop-card-height": `${settings.desktopCardHeight}px`,
        "--dm-mobile-card-width": `${settings.mobileCardWidth}px`,
        "--dm-mobile-card-height": `${settings.mobileCardHeight}px`,
        "--dm-desktop-card-gap": `${settings.desktopCardGap}px`,
        "--dm-mobile-card-gap": `${settings.mobileCardGap}px`,
        "--dm-desktop-content-gap": `${settings.desktopContentGap}px`,
        "--dm-mobile-content-gap": `${settings.mobileContentGap}px`,
        "--dm-desktop-progress-start": settings.desktopProgressStartColor,
        "--dm-desktop-progress-end": settings.desktopProgressEndColor,
        "--dm-desktop-progress-track": settings.desktopProgressTrackColor,
        "--dm-mobile-progress-start": settings.mobileProgressStartColor,
        "--dm-mobile-progress-end": settings.mobileProgressEndColor,
        "--dm-mobile-progress-track": settings.mobileProgressTrackColor,
        "--dm-desktop-progress-top-space": `${desktopTopSpace}px`,
        "--dm-desktop-progress-bottom-space": `${desktopBottomSpace}px`,
        "--dm-mobile-progress-top-space": `${mobileTopSpace}px`,
        "--dm-mobile-progress-bottom-space": `${mobileBottomSpace}px`,
        "--dm-desktop-progress-thickness": `${settings.desktopProgressThickness}px`,
        "--dm-mobile-progress-thickness": `${settings.mobileProgressThickness}px`,
        "--dm-desktop-category-alignment": settings.desktopCategoryAlignment === "center" ? "safe center" : "flex-start",
        "--dm-desktop-image-fit": settings.desktopImageFit,
        "--dm-mobile-image-fit": settings.mobileImageFit,
        "--dm-desktop-image-position": settings.desktopImagePosition,
        "--dm-mobile-image-position": settings.mobileImagePosition,
        "--dm-desktop-radius": `${settings.desktopBorderRadius}px`,
        "--dm-mobile-radius": `${settings.mobileBorderRadius}px`,
        "--dm-desktop-border-width": `${settings.desktopBorderWidth}px`,
        "--dm-mobile-border-width": `${settings.mobileBorderWidth}px`,
        "--dm-desktop-border-color": settings.desktopBorderColor,
        "--dm-mobile-border-color": settings.mobileBorderColor,
        "--dm-desktop-shadow": shadowValue[settings.desktopShadow],
        "--dm-mobile-shadow": shadowValue[settings.mobileShadow],
        "--dm-desktop-image-bg": settings.desktopImageBackgroundColor,
        "--dm-mobile-image-bg": settings.mobileImageBackgroundColor,
        "--dm-lower-desktop-display": settings.lowerDesktop.enabled ? "block" : "none",
        "--dm-lower-mobile-display": settings.lowerMobile.enabled ? "block" : "none",
        "--dm-lower-desktop-max": `${settings.lowerDesktop.sectionMaxWidth}px`,
        "--dm-lower-mobile-max": `${settings.lowerMobile.sectionMaxWidth}px`,
        "--dm-lower-desktop-padding": `${settings.lowerDesktop.sectionPadding}px`,
        "--dm-lower-mobile-padding": `${settings.lowerMobile.sectionPadding}px`,
        "--dm-lower-desktop-gap": `${settings.lowerDesktop.sectionGap}px`,
        "--dm-lower-mobile-gap": `${settings.lowerMobile.sectionGap}px`,
        "--dm-lower-desktop-card-width": `${settings.lowerDesktop.cardWidth}px`,
        "--dm-lower-mobile-card-width": `${settings.lowerMobile.cardWidth}px`,
        "--dm-lower-desktop-card-gap": `${settings.lowerDesktop.cardGap}px`,
        "--dm-lower-mobile-card-gap": `${settings.lowerMobile.cardGap}px`,
        "--dm-lower-desktop-card-radius": `${settings.lowerDesktop.cardRadius}px`,
        "--dm-lower-mobile-card-radius": `${settings.lowerMobile.cardRadius}px`,
        "--dm-lower-desktop-card-padding": `${settings.lowerDesktop.cardPadding}px`,
        "--dm-lower-mobile-card-padding": `${settings.lowerMobile.cardPadding}px`,
        "--dm-lower-desktop-card-bg": settings.lowerDesktop.cardBackground,
        "--dm-lower-mobile-card-bg": settings.lowerMobile.cardBackground,
        "--dm-lower-desktop-border": `${settings.lowerDesktop.cardBorderWidth}px solid ${settings.lowerDesktop.cardBorderColor}`,
        "--dm-lower-mobile-border": `${settings.lowerMobile.cardBorderWidth}px solid ${settings.lowerMobile.cardBorderColor}`,
        "--dm-lower-desktop-shadow": shadowValue[settings.lowerDesktop.cardShadow],
        "--dm-lower-mobile-shadow": shadowValue[settings.lowerMobile.cardShadow],
        "--dm-lower-desktop-image-display": settings.lowerDesktop.imageVisible ? "block" : "none",
        "--dm-lower-mobile-image-display": settings.lowerMobile.imageVisible ? "block" : "none",
        "--dm-lower-desktop-image-height": `${settings.lowerDesktop.imageHeight}px`,
        "--dm-lower-mobile-image-height": `${settings.lowerMobile.imageHeight}px`,
        "--dm-lower-desktop-image-radius": `${settings.lowerDesktop.imageRadius}px`,
        "--dm-lower-mobile-image-radius": `${settings.lowerMobile.imageRadius}px`,
        "--dm-lower-desktop-image-fit": settings.lowerDesktop.imageFit,
        "--dm-lower-mobile-image-fit": settings.lowerMobile.imageFit,
        "--dm-lower-desktop-title-size": `${settings.lowerDesktop.titleSize}px`,
        "--dm-lower-mobile-title-size": `${settings.lowerMobile.titleSize}px`,
        "--dm-lower-desktop-title-color": settings.lowerDesktop.titleColor,
        "--dm-lower-mobile-title-color": settings.lowerMobile.titleColor,
        "--dm-lower-desktop-title-weight": settings.lowerDesktop.titleWeight,
        "--dm-lower-mobile-title-weight": settings.lowerMobile.titleWeight,
        "--dm-lower-desktop-description-display": settings.lowerDesktop.descriptionVisible ? "block" : "none",
        "--dm-lower-mobile-description-display": settings.lowerMobile.descriptionVisible ? "block" : "none",
        "--dm-lower-desktop-description-size": `${settings.lowerDesktop.descriptionSize}px`,
        "--dm-lower-mobile-description-size": `${settings.lowerMobile.descriptionSize}px`,
        "--dm-lower-desktop-description-color": settings.lowerDesktop.descriptionColor,
        "--dm-lower-mobile-description-color": settings.lowerMobile.descriptionColor,
        "--dm-lower-desktop-choice-height": `${settings.lowerDesktop.priceButtonHeight}px`,
        "--dm-lower-mobile-choice-height": `${settings.lowerMobile.priceButtonHeight}px`,
        "--dm-lower-desktop-choice-radius": `${settings.lowerDesktop.priceButtonRadius}px`,
        "--dm-lower-mobile-choice-radius": `${settings.lowerMobile.priceButtonRadius}px`,
        "--dm-lower-desktop-choice-bg": settings.lowerDesktop.priceBackground,
        "--dm-lower-mobile-choice-bg": settings.lowerMobile.priceBackground,
        "--dm-lower-desktop-choice-color": settings.lowerDesktop.priceTextColor,
        "--dm-lower-mobile-choice-color": settings.lowerMobile.priceTextColor,
        "--dm-lower-desktop-selected-bg": settings.lowerDesktop.selectedPriceBackground,
        "--dm-lower-mobile-selected-bg": settings.lowerMobile.selectedPriceBackground,
        "--dm-lower-desktop-selected-color": settings.lowerDesktop.selectedPriceTextColor,
        "--dm-lower-mobile-selected-color": settings.lowerMobile.selectedPriceTextColor,
        "--dm-lower-desktop-action-height": `${settings.lowerDesktop.actionButtonHeight}px`,
        "--dm-lower-mobile-action-height": `${settings.lowerMobile.actionButtonHeight}px`,
        "--dm-lower-desktop-action-radius": `${settings.lowerDesktop.actionButtonRadius}px`,
        "--dm-lower-mobile-action-radius": `${settings.lowerMobile.actionButtonRadius}px`,
        "--dm-lower-desktop-action-bg": settings.lowerDesktop.actionButtonBackground,
        "--dm-lower-mobile-action-bg": settings.lowerMobile.actionButtonBackground,
        "--dm-lower-desktop-action-color": settings.lowerDesktop.actionButtonTextColor,
        "--dm-lower-mobile-action-color": settings.lowerMobile.actionButtonTextColor,
        "--dm-arrow-desktop-size": `${settings.lowerDesktop.arrowSize}px`,
        "--dm-arrow-mobile-size": `${settings.lowerMobile.arrowSize}px`,
        "--dm-arrow-desktop-icon-size": `${settings.lowerDesktop.arrowIconSize}px`,
        "--dm-arrow-mobile-icon-size": `${settings.lowerMobile.arrowIconSize}px`,
        "--dm-arrow-desktop-offset": `${settings.lowerDesktop.arrowOffset}px`,
        "--dm-arrow-mobile-offset": `${settings.lowerMobile.arrowOffset}px`,
        "--dm-arrow-desktop-y": `${settings.lowerDesktop.arrowVerticalPosition}%`,
        "--dm-arrow-mobile-y": `${settings.lowerMobile.arrowVerticalPosition}%`,
        "--dm-arrow-desktop-radius": `${settings.lowerDesktop.arrowRadius}%`,
        "--dm-arrow-mobile-radius": `${settings.lowerMobile.arrowRadius}%`,
        "--dm-arrow-desktop-bg": settings.lowerDesktop.arrowBackground,
        "--dm-arrow-mobile-bg": settings.lowerMobile.arrowBackground,
        "--dm-arrow-desktop-color": settings.lowerDesktop.arrowColor,
        "--dm-arrow-mobile-color": settings.lowerMobile.arrowColor,
        "--dm-arrow-desktop-opacity": settings.lowerDesktop.arrowOpacity / 100,
        "--dm-arrow-mobile-opacity": settings.lowerMobile.arrowOpacity / 100,
        "--dm-arrow-desktop-border": `${settings.lowerDesktop.arrowBorderWidth}px solid ${settings.lowerDesktop.arrowBorderColor}`,
        "--dm-arrow-mobile-border": `${settings.lowerMobile.arrowBorderWidth}px solid ${settings.lowerMobile.arrowBorderColor}`,
        "--dm-arrow-desktop-shadow": shadowValue[settings.lowerDesktop.arrowShadow],
        "--dm-arrow-mobile-shadow": shadowValue[settings.lowerMobile.arrowShadow],
      } as CSSProperties}
    >
      {!embedded && <div className={styles.previewBar}>
        <span><i /> DENEME ALANI</span>
        <p>Bu sayfada gerçek ödeme alınmaz.</p>
        <Link href="/">Siteye dön →</Link>
      </div>}

      <section className={styles.moduleShell}>
        <div className={styles.categoryScroller}>
          <div
            className={styles.categoryRail}
            aria-label="Bağış kategorileri"
            ref={categoriesRef}
            onScroll={updateCategoryProgress}
            onPointerDown={() => { categoryPausedRef.current = true; }}
            onPointerUp={() => { categoryPausedRef.current = false; }}
            onPointerCancel={() => { categoryPausedRef.current = false; }}
            onPointerLeave={() => { categoryPausedRef.current = false; }}
          >
            {visibleCategories.map((item) => (
              <button
                className={category === item.id ? styles.activeCategory : ""}
                key={item.id}
                onClick={() => setCategory(item.id)}
                aria-label={item.label}
                title={item.label}
              >
                <Image className={styles.desktopCategoryImage} src={settings.categoryImages[item.id]?.desktop || defaultModuleSettings.donation.categoryImages[item.id].desktop} alt={`${item.label} bağış kategorisi`} fill sizes="(max-width: 640px) 1px, 190px" />
                <Image className={styles.mobileCategoryImage} src={settings.categoryImages[item.id]?.mobile || settings.categoryImages[item.id]?.desktop || defaultModuleSettings.donation.categoryImages[item.id].mobile} alt="" fill sizes="(max-width: 640px) 118px, 1px" />
              </button>
            ))}
          </div>
          {settings.showProgress ? <>
            <span className={`${styles.categoryProgress} ${styles.categoryProgressTop}${settings.desktopProgressPosition === "bottom" ? ` ${styles.desktopProgressOff}` : ""}${settings.mobileProgressPosition === "bottom" ? ` ${styles.mobileProgressOff}` : ""}`} aria-hidden="true"><i style={{ width: `${categoryProgress}%` }} /></span>
            <span className={`${styles.categoryProgress} ${styles.categoryProgressBottom}${settings.desktopProgressPosition === "top" ? ` ${styles.desktopProgressOff}` : ""}${settings.mobileProgressPosition === "top" ? ` ${styles.mobileProgressOff}` : ""}`} aria-hidden="true"><i style={{ width: `${categoryProgress}%` }} /></span>
          </> : null}
        </div>

        <div className={`${styles.contentGrid}${settings.lowerDesktop.layout === "grid" ? ` ${styles.desktopGrid}` : ""}${settings.lowerMobile.layout === "grid" ? ` ${styles.mobileGrid}` : ""}`}>
            <div className={styles.sectionHeading}>
              <div className={styles.desktopLowerHeading} style={{ display: settings.lowerDesktop.showHeading ? undefined : "none" }}><span>{settings.lowerDesktop.headingEyebrow}</span><h2>{settings.lowerDesktop.headingTitle}</h2></div>
              <div className={styles.mobileLowerHeading} style={{ display: settings.lowerMobile.showHeading ? undefined : "none" }}><span>{settings.lowerMobile.headingEyebrow}</span><h2>{settings.lowerMobile.headingTitle}</h2></div>
            </div>
            <div className={styles.cardsViewport}>
              <button className={`${styles.sideArrow} ${styles.sideArrowLeft}${!settings.lowerDesktop.arrowsVisible || !settings.lowerDesktop.leftArrowVisible ? ` ${styles.desktopArrowOff}` : ""}${!settings.lowerMobile.arrowsVisible || !settings.lowerMobile.leftArrowVisible ? ` ${styles.mobileArrowOff}` : ""}`} type="button" aria-label="Önceki bağış projeleri" onClick={() => moveCards(-1)}><span className={styles.desktopArrowSymbol}>{arrowSymbols[settings.lowerDesktop.arrowIcon][0]}</span><span className={styles.mobileArrowSymbol}>{arrowSymbols[settings.lowerMobile.arrowIcon][0]}</span></button>
              <div className={styles.cards} ref={cardsRef}>
              {filtered.map((project) => {
                const picked = selected[project.id] ?? project.suggested[0];
                const sharedDesign = (projectDesign: typeof project.desktop, common: typeof settings.lowerDesktop) => projectDesign.useSharedDesign ? {
                  ...projectDesign,
                  cardWidth: common.cardWidth,
                  cardPadding: common.cardPadding,
                  cardBackground: common.cardBackground,
                  cardRadius: common.cardRadius,
                  cardBorderColor: common.cardBorderColor,
                  cardBorderWidth: common.cardBorderWidth,
                  imageHeight: common.imageHeight,
                  imageRadius: common.imageRadius,
                  titleColor: common.titleColor,
                  titleSize: common.titleSize,
                  titleWeight: common.titleWeight,
                  descriptionColor: common.descriptionColor,
                  descriptionSize: common.descriptionSize,
                } : projectDesign;
                const desktopDesign = sharedDesign(project.desktop, settings.lowerDesktop);
                const mobileDesign = sharedDesign(project.mobile, settings.lowerMobile);
                return (
                  <article className={styles.card} key={project.id} style={{
                    "--dm-lower-desktop-card-width": `${desktopDesign.cardWidth}px`,
                    "--dm-lower-mobile-card-width": `${mobileDesign.cardWidth}px`,
                    "--dm-lower-desktop-card-padding": `${desktopDesign.cardPadding}px`,
                    "--dm-lower-mobile-card-padding": `${mobileDesign.cardPadding}px`,
                    "--dm-lower-desktop-card-bg": desktopDesign.cardBackground,
                    "--dm-lower-mobile-card-bg": mobileDesign.cardBackground,
                    "--dm-lower-desktop-card-radius": `${desktopDesign.cardRadius}px`,
                    "--dm-lower-mobile-card-radius": `${mobileDesign.cardRadius}px`,
                    "--dm-lower-desktop-border": `${desktopDesign.cardBorderWidth}px solid ${desktopDesign.cardBorderColor}`,
                    "--dm-lower-mobile-border": `${mobileDesign.cardBorderWidth}px solid ${mobileDesign.cardBorderColor}`,
                    "--dm-lower-desktop-image-height": `${desktopDesign.imageHeight}px`,
                    "--dm-lower-mobile-image-height": `${mobileDesign.imageHeight}px`,
                    "--dm-lower-desktop-title-color": desktopDesign.titleColor,
                    "--dm-lower-mobile-title-color": mobileDesign.titleColor,
                    "--dm-lower-desktop-title-size": `${desktopDesign.titleSize}px`,
                    "--dm-lower-mobile-title-size": `${mobileDesign.titleSize}px`,
                    "--dm-lower-desktop-title-weight": desktopDesign.titleWeight,
                    "--dm-lower-mobile-title-weight": mobileDesign.titleWeight,
                    "--dm-lower-desktop-description-color": desktopDesign.descriptionColor,
                    "--dm-lower-mobile-description-color": mobileDesign.descriptionColor,
                    "--dm-lower-desktop-description-size": `${desktopDesign.descriptionSize}px`,
                    "--dm-lower-mobile-description-size": `${mobileDesign.descriptionSize}px`,
                    "--dm-lower-desktop-choice-height": `${desktopDesign.priceButtonHeight}px`,
                    "--dm-lower-mobile-choice-height": `${mobileDesign.priceButtonHeight}px`,
                    "--dm-lower-desktop-choice-radius": `${desktopDesign.priceButtonRadius}px`,
                    "--dm-lower-mobile-choice-radius": `${mobileDesign.priceButtonRadius}px`,
                    "--dm-lower-desktop-choice-bg": desktopDesign.priceBackground,
                    "--dm-lower-mobile-choice-bg": mobileDesign.priceBackground,
                    "--dm-lower-desktop-choice-color": desktopDesign.priceTextColor,
                    "--dm-lower-mobile-choice-color": mobileDesign.priceTextColor,
                    "--dm-lower-desktop-selected-bg": desktopDesign.selectedPriceBackground,
                    "--dm-lower-mobile-selected-bg": mobileDesign.selectedPriceBackground,
                    "--dm-lower-desktop-selected-color": desktopDesign.selectedPriceTextColor,
                    "--dm-lower-mobile-selected-color": mobileDesign.selectedPriceTextColor,
                    "--dm-lower-desktop-action-bg": desktopDesign.actionBackground,
                    "--dm-lower-mobile-action-bg": mobileDesign.actionBackground,
                    "--dm-lower-desktop-action-color": desktopDesign.actionTextColor,
                    "--dm-lower-mobile-action-color": mobileDesign.actionTextColor,
                    "--dm-lower-desktop-action-height": `${desktopDesign.actionHeight}px`,
                    "--dm-lower-mobile-action-height": `${mobileDesign.actionHeight}px`,
                    "--dm-lower-desktop-action-radius": `${desktopDesign.actionRadius}px`,
                    "--dm-lower-mobile-action-radius": `${mobileDesign.actionRadius}px`,
                  } as CSSProperties}>
                    <div className={styles.cardImage} style={{ backgroundImage: `url("${project.image}")` }}>
                      <span>{project.badge}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      <small>{project.pricingMode === "quantity" ? "Hisse adedi" : "Bağış tutarı"}</small>
                      <div className={styles.choices}>
                        {project.suggested.map((amount) => (
                          <button className={picked === amount ? styles.selectedChoice : ""} key={amount} onClick={() => setSelected((state) => ({ ...state, [project.id]: amount }))}>
                            {project.pricingMode === "quantity" ? amount : money.format(amount)}
                          </button>
                        ))}
                      </div>
                      <div className={styles.cardAction}>
                        <label>
                          <span>{project.pricingMode === "quantity" ? money.format(project.fixedPrice * picked) : "₺"}</span>
                          {project.pricingMode === "amount" && project.customAmountEnabled && <input inputMode="numeric" value={custom[project.id] || ""} onChange={(event) => setCustom((state) => ({ ...state, [project.id]: event.target.value.replace(/[^\d,]/g, "") }))} placeholder="Başka tutar" />}
                        </label>
                        <button onClick={() => addToCart(project)}><span className={styles.desktopActionText}>{desktopDesign.actionText}</span><span className={styles.mobileActionText}>{mobileDesign.actionText}</span> <b>+</b></button>
                      </div>
                    </div>
                  </article>
                );
              })}
              </div>
              <button className={`${styles.sideArrow} ${styles.sideArrowRight}${!settings.lowerDesktop.arrowsVisible || !settings.lowerDesktop.rightArrowVisible ? ` ${styles.desktopArrowOff}` : ""}${!settings.lowerMobile.arrowsVisible || !settings.lowerMobile.rightArrowVisible ? ` ${styles.mobileArrowOff}` : ""}`} type="button" aria-label="Sonraki bağış projeleri" onClick={() => moveCards(1)}><span className={styles.desktopArrowSymbol}>{arrowSymbols[settings.lowerDesktop.arrowIcon][1]}</span><span className={styles.mobileArrowSymbol}>{arrowSymbols[settings.lowerMobile.arrowIcon][1]}</span></button>
            </div>
        </div>
      </section>
      {notice && <div className={styles.toast}>{notice}</div>}
    </section>
  );
}
