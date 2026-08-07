"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { readCart, writeCart, type CartItem } from "../../lib/cart";
import { defaultModuleSettings, type DonationCategory, type DonationModuleSettings, type DonationProject, type DonationProjectMedia } from "../../lib/module-settings";
import styles from "./donation-module.module.css";

type Device = "desktop" | "mobile";

function CategoryImage({ category, src, className, sizes }: { category: DonationCategory; src: string; className: string; sizes: string }) {
  const alt = category.imageAlt;
  const title = category.imageTitle || category.label;
  if (!src) {
    return (
      // A native image intentionally preserves the browser's broken-image marker for an empty category image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={className}
        src="/__missing-donation-category-image__.png"
        alt=""
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    );
  }
  return <Image className={className} src={src} alt={alt} title={title} fill sizes={sizes} />;
}

function CardMedia({ media, fallback, className }: { media: DonationProjectMedia[]; fallback: string; className: string }) {
  const items = media.length ? media : [{ id: "fallback", type: "image" as const, url: fallback }];
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const startX = useRef(0);
  const current = items[Math.min(active, items.length - 1)];
  const select = (index: number) => { setActive(index); setPlaying(false); };
  return <div className={`${styles.cardMedia} ${className}`} onPointerDown={(event) => { startX.current = event.clientX; }} onPointerUp={(event) => {
    const distance = event.clientX - startX.current;
    if (Math.abs(distance) < 35) return;
    select(Math.max(0, Math.min(items.length - 1, active + (distance < 0 ? 1 : -1))));
  }}>
    <div className={styles.cardMediaMain}>
      {current.type === "video" && playing
        ? <video src={current.url} poster={current.poster} controls autoPlay playsInline preload="none" />
        : <div className={styles.cardMediaCover} role={current.type === "video" ? "button" : undefined} tabIndex={current.type === "video" ? 0 : undefined} style={{ backgroundImage: `url("${current.type === "video" ? current.poster || fallback : current.url}")` }} onClick={() => current.type === "video" && setPlaying(true)} onKeyDown={(event) => { if (current.type === "video" && (event.key === "Enter" || event.key === " ")) setPlaying(true); }}>{current.type === "video" ? <i>▶</i> : null}</div>}
    </div>
    {items.length > 1 ? <div className={styles.cardMediaThumbs}>{items.map((item, index) => <button type="button" key={item.id} className={index === active ? styles.activeMediaThumb : ""} onClick={() => select(index)} aria-label={`${index + 1}. medyayı göster`} style={{ backgroundImage: `url("${item.type === "video" ? item.poster || fallback : item.url}")` }}>{item.type === "video" ? <i>▶</i> : null}</button>)}</div> : null}
  </div>;
}

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

function subscribeToMobileViewport(callback: () => void) {
  const query = window.matchMedia("(max-width: 640px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const getMobileViewportSnapshot = () => window.matchMedia("(max-width: 640px)").matches;
const getDesktopServerSnapshot = () => false;

export default function DonationModule({ embedded = false, settings = defaultModuleSettings.donation, previewDevice, previewCategory, onCategoryChange }: { embedded?: boolean; settings?: DonationModuleSettings; previewDevice?: "desktop" | "mobile"; previewCategory?: string; onCategoryChange?: (category: string) => void }) {
  const cardsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const categoryDirectionRef = useRef<1 | -1>(1);
  const categoryPausedRef = useRef(false);
  const categoryPositionRef = useRef(0);
  const categoryInitializedRef = useRef(false);
  const categoryPointerActiveRef = useRef(false);
  const categoryResumeAtRef = useRef(0);
  const categoryMouseDragRef = useRef({ active: false, moved: false, pointerId: -1, startX: 0, startScroll: 0 });
  const categoryLastDragAtRef = useRef(0);
  const [categoryProgress, setCategoryProgress] = useState(0);
  const [category, setCategory] = useState(previewCategory || settings.allCategoryId || settings.categories[0]?.id || "");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const isMobileViewport = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getDesktopServerSnapshot,
  );
  useEffect(() => {
    if (!previewCategory) return;
    const frame = window.requestAnimationFrame(() => setCategory(previewCategory));
    return () => window.cancelAnimationFrame(frame);
  }, [previewCategory]);
  const activeDevice: Device = previewDevice || (isMobileViewport ? "mobile" : "desktop");
  const categories = settings.categories;
  const legacyVisibleCategories = settings.visibleCategories || categories.map((item) => item.id);
  const deviceVisibleCategories = activeDevice === "mobile"
    ? settings.mobileVisibleCategories || legacyVisibleCategories
    : settings.desktopVisibleCategories || legacyVisibleCategories;
  const deviceCategoryOrder = activeDevice === "mobile"
    ? settings.mobileCategoryOrder || categories.map((item) => item.id)
    : settings.desktopCategoryOrder || categories.map((item) => item.id);
  const visibleIds = new Set(deviceVisibleCategories);
  const orderedIds = [
    ...deviceCategoryOrder,
    ...categories.map((item) => item.id).filter((id) => !deviceCategoryOrder.includes(id)),
  ];
  const visibleCategories = orderedIds
    .filter((id, index) => visibleIds.has(id) && orderedIds.indexOf(id) === index)
    .map((id) => categories.find((item) => item.id === id))
    .filter((item): item is (typeof categories)[number] => Boolean(item));
  const effectiveCategory = visibleIds.has(category)
    ? category
    : visibleCategories.find((item) => item.id === settings.allCategoryId)?.id || visibleCategories[0]?.id || "";
  const isAllCategory = Boolean(settings.allCategoryId) && effectiveCategory === settings.allCategoryId;
  const categoryListKey = `${activeDevice}:${visibleCategories.map((item) => item.id).join(",")}`;
  const filtered = settings.projects
    .filter((project) => project.enabled && (isAllCategory || project.category === effectiveCategory))
    .sort((a, b) => isAllCategory
      ? (activeDevice === "mobile" ? (a.allOrderMobile ?? 0) - (b.allOrderMobile ?? 0) : (a.allOrderDesktop ?? 0) - (b.allOrderDesktop ?? 0))
      : 0);

  useEffect(() => {
    const rail = categoriesRef.current;
    categoryInitializedRef.current = false;
    categoryDirectionRef.current = 1;
    categoryPositionRef.current = 0;
    if (rail) rail.scrollLeft = 0;
  }, [categoryListKey]);

  useEffect(() => {
    const rail = categoriesRef.current;
    if (!rail) return;
    let animationFrame = 0;
    let previousTime = performance.now();
    const maxAtStart = Math.max(0, rail.scrollWidth - rail.clientWidth);
    if (!categoryInitializedRef.current && maxAtStart > 0) {
      categoryPositionRef.current = Math.min(maxAtStart, activeDevice === "mobile" ? settings.mobileEdgeScrollPadding : settings.desktopEdgeScrollPadding);
      rail.scrollLeft = categoryPositionRef.current;
      categoryInitializedRef.current = true;
    } else {
      categoryPositionRef.current = rail.scrollLeft;
    }
    const animate = (time: number) => {
      const elapsed = Math.min(68, Math.max(0, time - previousTime));
      previousTime = time;
      if (!settings.autoScroll || categoryPausedRef.current || time < categoryResumeAtRef.current || rail.scrollWidth <= rail.clientWidth) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }
      const max = rail.scrollWidth - rail.clientWidth;
      let next = categoryPositionRef.current + categoryDirectionRef.current * settings.autoScrollSpeed * (elapsed / 34);
      if (next >= max) {
        next = max;
        categoryDirectionRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        categoryDirectionRef.current = 1;
      }
      categoryPositionRef.current = next;
      rail.scrollLeft = next;
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [activeDevice, categoryListKey, settings.autoScroll, settings.autoScrollSpeed, settings.desktopEdgeScrollPadding, settings.mobileEdgeScrollPadding]);

  function updateCategoryProgress() {
    const rail = categoriesRef.current;
    if (!rail) return;
    const time = performance.now();
    if (categoryPointerActiveRef.current || time < categoryResumeAtRef.current) {
      const nextPosition = rail.scrollLeft;
      if (nextPosition > categoryPositionRef.current + .25) categoryDirectionRef.current = 1;
      if (nextPosition < categoryPositionRef.current - .25) categoryDirectionRef.current = -1;
      categoryPositionRef.current = nextPosition;
      if (!categoryPointerActiveRef.current) categoryResumeAtRef.current = time + 900;
    }
    const max = rail.scrollWidth - rail.clientWidth;
    setCategoryProgress(max > 0 ? Math.min(100, Math.max(0, (rail.scrollLeft / max) * 100)) : 100);
  }

  function startCategoryInteraction() {
    categoryPointerActiveRef.current = true;
    categoryPausedRef.current = true;
    categoryResumeAtRef.current = Number.POSITIVE_INFINITY;
    categoryPositionRef.current = categoriesRef.current?.scrollLeft || 0;
  }

  function finishCategoryInteraction() {
    categoryPositionRef.current = categoriesRef.current?.scrollLeft || 0;
    categoryPointerActiveRef.current = false;
    categoryPausedRef.current = false;
    categoryResumeAtRef.current = performance.now() + 900;
  }

  function pauseCategoryForWheel() {
    categoryPositionRef.current = categoriesRef.current?.scrollLeft || 0;
    categoryResumeAtRef.current = performance.now() + 900;
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
        "--dm-desktop-edge-scroll-padding": `${settings.desktopEdgeScrollPadding}px`,
        "--dm-mobile-edge-scroll-padding": `${settings.mobileEdgeScrollPadding}px`,
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
        "--dm-lower-desktop-display": "block",
        "--dm-lower-mobile-display": "block",
        "--dm-lower-desktop-max": `${settings.lowerDesktop.sectionMaxWidth}px`,
        "--dm-lower-mobile-max": `${settings.lowerMobile.sectionMaxWidth}px`,
        "--dm-lower-desktop-padding": `${settings.lowerDesktop.sectionPadding}px`,
        "--dm-lower-mobile-padding": `${settings.lowerMobile.sectionPadding}px`,
        "--dm-lower-desktop-gap": `${settings.lowerDesktop.sectionGap}px`,
        "--dm-lower-mobile-gap": `${settings.lowerMobile.sectionGap}px`,
        "--dm-lower-desktop-heading-gap": `${settings.lowerDesktop.headingGap}px`,
        "--dm-lower-mobile-heading-gap": `${settings.lowerMobile.headingGap}px`,
        "--dm-lower-desktop-heading-display": settings.lowerDesktop.showHeading ? "flex" : "none",
        "--dm-lower-mobile-heading-display": settings.lowerMobile.showHeading ? "flex" : "none",
        "--dm-lower-desktop-bottom-gap": `${settings.lowerDesktop.sectionBottomGap}px`,
        "--dm-lower-mobile-bottom-gap": `${settings.lowerMobile.sectionBottomGap}px`,
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
        "--dm-lower-desktop-title-display": settings.lowerDesktop.titleVisible ? "block" : "none",
        "--dm-lower-mobile-title-display": settings.lowerMobile.titleVisible ? "block" : "none",
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
            onPointerDown={(event) => {
              startCategoryInteraction();
              if (event.pointerType === "mouse" && event.button === 0) {
                categoryMouseDragRef.current = {
                  active: true,
                  moved: false,
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  startScroll: event.currentTarget.scrollLeft,
                };
              }
            }}
            onPointerMove={(event) => {
              const drag = categoryMouseDragRef.current;
              if (!drag.active || event.pointerType !== "mouse") return;
              const distance = event.clientX - drag.startX;
              if (!drag.moved && Math.abs(distance) < 6) return;
              if (!drag.moved) {
                drag.moved = true;
                event.currentTarget.setPointerCapture?.(event.pointerId);
              }
              event.preventDefault();
              event.currentTarget.scrollLeft = drag.startScroll - distance;
              categoryPositionRef.current = event.currentTarget.scrollLeft;
            }}
            onPointerUp={(event) => {
              if (categoryMouseDragRef.current.moved) categoryLastDragAtRef.current = performance.now();
              categoryMouseDragRef.current.active = false;
              finishCategoryInteraction();
              if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={(event) => {
              if (categoryMouseDragRef.current.moved) categoryLastDragAtRef.current = performance.now();
              categoryMouseDragRef.current.active = false;
              finishCategoryInteraction();
              if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerLeave={(event) => {
              const drag = categoryMouseDragRef.current;
              if (!drag.active || drag.moved || event.currentTarget.hasPointerCapture?.(drag.pointerId)) return;
              drag.active = false;
              finishCategoryInteraction();
            }}
            onWheel={pauseCategoryForWheel}
          >
            {visibleCategories.map((item) => (
              <button
                className={effectiveCategory === item.id ? styles.activeCategory : ""}
                key={item.id}
                onClick={(event) => {
                  if (performance.now() - categoryLastDragAtRef.current < 180) {
                    event.preventDefault();
                    return;
                  }
                  setCategory(item.id);
                  onCategoryChange?.(item.id);
                }}
                aria-label={item.label}
                title={item.label}
              >
                <CategoryImage category={item} className={styles.desktopCategoryImage} src={settings.categoryImages[item.id]?.desktop ?? ""} sizes="(max-width: 640px) 1px, 190px" />
                <CategoryImage category={item} className={styles.mobileCategoryImage} src={settings.categoryImages[item.id]?.mobile ?? ""} sizes="(max-width: 640px) 118px, 1px" />
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
                  <article className={`${styles.card}${isAllCategory && project.showInAllDesktop === false ? ` ${styles.allDesktopHidden}` : ""}${isAllCategory && project.showInAllMobile === false ? ` ${styles.allMobileHidden}` : ""}`} key={project.id} style={{
                    "--dm-all-desktop-order": project.allOrderDesktop ?? 0,
                    "--dm-all-mobile-order": project.allOrderMobile ?? 0,
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
                    "--dm-lower-desktop-image-height": `${desktopDesign.useSharedImageDesign !== false ? settings.lowerDesktop.imageHeight : desktopDesign.imageHeight}px`,
                    "--dm-lower-mobile-image-height": `${mobileDesign.useSharedImageDesign !== false ? settings.lowerMobile.imageHeight : mobileDesign.imageHeight}px`,
                    "--dm-lower-desktop-image-display": desktopDesign.imageVisible === false ? "none" : "block",
                    "--dm-lower-mobile-image-display": mobileDesign.imageVisible === false ? "none" : "block",
                    "--dm-lower-desktop-image-fit": desktopDesign.useSharedImageDesign !== false ? settings.lowerDesktop.imageFit : desktopDesign.imageFit || "cover",
                    "--dm-lower-mobile-image-fit": mobileDesign.useSharedImageDesign !== false ? settings.lowerMobile.imageFit : mobileDesign.imageFit || "cover",
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
                    <CardMedia media={project.desktopMedia || []} fallback={project.image} className={styles.desktopCardMedia} />
                    <CardMedia media={project.mobileMedia || []} fallback={project.image} className={styles.mobileCardMedia} />
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
