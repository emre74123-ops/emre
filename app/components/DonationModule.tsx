"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { readCart, writeCart, type CartItem } from "../../lib/cart";
import { defaultModuleSettings, type DonationModuleSettings, type DonationProject, type DonationProjectMedia } from "../../lib/module-settings";
import styles from "./donation-module.module.css";

type Category = "all" | "general" | "qurban" | "water" | "zakat" | "orphan";
type Device = "desktop" | "mobile";
const categories: { id: Category; label: string }[] = [
  { id: "all", label: "TÃ¼m BaÄŸÄ±ÅŸlar" },
  { id: "general", label: "Genel BaÄŸÄ±ÅŸ" },
  { id: "qurban", label: "Kurban" },
  { id: "water", label: "Su Kuyusu" },
  { id: "zakat", label: "ZekÃ¢t ve Fitre" },
  { id: "orphan", label: "Yetim DesteÄŸi" },
];

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
        : <div className={styles.cardMediaCover} role={current.type === "video" ? "button" : undefined} tabIndex={current.type === "video" ? 0 : undefined} style={{ backgroundImage: `url("${current.type === "video" ? current.poster || fallback : current.url}")` }} onClick={() => current.type === "video" && setPlaying(true)} onKeyDown={(event) => { if (current.type === "video" && (event.key === "Enter" || event.key === " ")) setPlaying(true); }}>{current.type === "video" ? <i>â–¶</i> : null}</div>}
    </div>
    {items.length > 1 ? <div className={styles.cardMediaThumbs}>{items.map((item, index) => <button type="button" key={item.id} className={index === active ? styles.activeMediaThumb : ""} onClick={() => select(index)} aria-label={`${index + 1}. medyayÄ± gÃ¶ster`} style={{ backgroundImage: `url("${item.type === "video" ? item.poster || fallback : item.url}")` }}>{item.type === "video" ? <i>â–¶</i> : null}</button>)}</div> : null}
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
  thin: ["â†", "â†’"],
  chevron: ["â€¹", "â€º"],
  bold: ["â®", "â¯"],
  long: ["âŸµ", "âŸ¶"],
  triangle: ["â—€", "â–¶"],
} as const;

function subscribeToMobileViewport(callback: () => void) {
  const query = window.matchMedia("(max-width: 640px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const getMobileViewportSnapshot = () => window.matchMedia("(max-width: 640px)").matches;
const getDesktopServerSnapshot = () => false;

export default function DonationModule({ embedded = false, settings = defaultModuleSettings.donation, previewDevice, previewCategory }: { embedded?: boolean; settings?: DonationModuleSettings; previewDevice?: "desktop" | "mobile"; previewCategory?: Category }) {
  const cardsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const categoryDirectionRef = useRef<1 | -1>(1);
  const categoryPausedRef = useRef(false);
  const categoryPositionRef = useRef(0);
  const categoryInitializedRef = useRef(false);
  const categoryPointerActiveRef = useRef(false);
  const categoryResumeAtRef = useRef(0);
  const [categoryProgress, setCategoryProgress] = useState(0);
  const [category, setCategory] = useState<Category>(previewCategory || "all");
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
    : visibleCategories.find((item) => item.id === "all")?.id || visibleCategories[0]?.id || "all";
  const categoryListKey = `${activeDevice}:${visibleCategories.map((item) => item.id).join(",")}`;
  const filtered = settings.projects
    .filter((project) => project.enabled && (effectiveCategory === "all" || project.category === effectiveCategory))
    .sort((a, b) => effectiveCategory === "all"
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
        "--dm-desktop-shadow": shadoÛMü¶‰žËkºwµç]•Èµ‘•Í­Ñ½Àµ…Ñ¥½¸µ½±½ÈˆèÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…Ñ¥½¹	ÕÑÑ½¹Q•áÑ½±½È°4(€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ…Ñ¥½¸µ½±½ÈˆèÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…Ñ¥½¹	ÕÑÑ½¹Q•áÑ½±½È°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµ‘•Í­Ñ½ÀµÍ¥é”ˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½ÝM¥é•õÁá€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµµ½‰¥±”µÍ¥é”ˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½ÝM¥é•õÁá€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµ‘•Í­Ñ½Àµ¥½¸µÍ¥é”ˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½Ý%½¹M¥é•õÁá€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµµ½‰¥±”µ¥½¸µÍ¥é”ˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½Ý%½¹M¥é•õÁá€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµ‘•Í­Ñ½Àµ½™™Í•Ðˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½Ý=™™Í•ÑõÁá€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµµ½‰¥±”µ½™™Í•Ðˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½Ý=™™Í•ÑõÁá€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµ‘•Í­Ñ½Àµäˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½ÝY•ÉÑ¥…±A½Í¥Ñ¥½¹ô•€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµµ½‰¥±”µäˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½ÝY•ÉÑ¥…±A½Í¥Ñ¥½¹ô•€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµ‘•Í­Ñ½ÀµÉ…‘¥ÕÌˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½ÝI…‘¥ÕÍô•€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµµ½‰¥±”µÉ…‘¥ÕÌˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½ÝI…‘¥ÕÍô•€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµ‘•Í­Ñ½Àµ‰œˆèÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½Ý	…­É½Õ¹°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµµ½‰¥±”µ‰œˆèÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½Ý	…­É½Õ¹°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµ‘•Í­Ñ½Àµ½±½ÈˆèÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½Ý½±½È°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµµ½‰¥±”µ½±½ÈˆèÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½Ý½±½È°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµ‘•Í­Ñ½Àµ½Á…¥ÑäˆèÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½Ý=Á…¥Ñä€¼€ÄÀÀ°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµµ½‰¥±”µ½Á…¥ÑäˆèÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½Ý=Á…¥Ñä€¼€ÄÀÀ°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµ‘•Í­Ñ½Àµ‰½É‘•Èˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½Ý	½É‘•É]¥‘Ñ¡õÁàÍ½±¥€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½Ý	½É‘•É½±½Éõ€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµµ½‰¥±”µ‰½É‘•Èˆè€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½Ý	½É‘•É]¥‘Ñ¡õÁàÍ½±¥€‘íÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½Ý	½É‘•É½±½Éõ€°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµ‘•Í­Ñ½ÀµÍ¡…‘½ÜˆèÍ¡…‘½ÝY…±Õ•mÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½ÝM¡…‘½Ýt°4(€€€€€€€€ˆ´µ‘´µ…ÉÉ½Üµµ½‰¥±”µÍ¡…‘½ÜˆèÍ¡…‘½ÝY…±Õ•mÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½ÝM¡…‘½Ýt°4(€€€€€ô…ÌMMAÉ½Á•ÉÑ¥•Íô4(€€€€ø4(€€€€€ì…•µ‰•‘‘•€˜˜€ñ‘¥Ø±…ÍÍ9…µ”õíÍÑå±•Ì¹ÁÉ•Ù¥•Ý	…Éôø4(€€€€€€€€ñÍÁ…¸øñ¤€¼ø9519$ð½ÍÁ…¸ø4(€€€€€€€€ñÀù	ÔÍ…å™…‘„•Ë•¬ƒÙ‘•µ”…³Å¹µ…è¸ð½Àø4(€€€€€€€€ñ1¥¹¬¡É•˜ôˆ¼ˆùM¥Ñ•å”“Ù¸ƒŠHð½1¥¹¬ø4(€€€€€€ð½‘¥Øùô4(4(€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”õíÍÑå±•Ì¹µ½‘Õ±•M¡•±±ôø4(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÍÑå±•Ì¹…Ñ•½ÉåMÉ½±±•Éôø4(€€€€€€€€€€ñ‘¥Ø4(€€€€€€€€€€€±…ÍÍ9…µ”õíÍÑå±•Ì¹…Ñ•½ÉåI…¥±ô4(€€€€€€€€€€€…É¥„µ±…‰•°ô‰	‡Ç|­…Ñ•½É¥±•É¤ˆ4(€€€€€€€€€€€É•˜õí…Ñ•½É¥•ÍI•™ô4(€€€€€€€€€€€½¹MÉ½±°õíÕÁ‘…Ñ•…Ñ•½ÉåAÉ½É•ÍÍô4(€€€€€€€€€€€½¹A½¥¹Ñ•É½Ý¸õì¡•Ù•¹Ð¤€ôøì(€€€€€€€€€€€€€ÍÑ…ÉÑ…Ñ•½Éå%¹Ñ•É…Ñ¥½¸ ¤ì(€€€€€€€€€€€€€•Ù•¹Ð¹ÕÉÉ•¹ÑQ…É•Ð¹Í•ÑA½¥¹Ñ•É…ÁÑÕÉ”ü¸¡•Ù•¹Ð¹Á½¥¹Ñ•É%¤ì(€€€€€€€€€€€õô(€€€€€€€€€€€½¹A½¥¹Ñ•ÉUÀõì¡•Ù•¹Ð¤€ôøì(€€€€€€€€€€€€€™¥¹¥Í¡…Ñ•½Éå%¹Ñ•É…Ñ¥½¸ ¤ì(€€€€€€€€€€€€€¥˜€¡•Ù•¹Ð¹ÕÉÉ•¹ÑQ…É•Ð¹¡…ÍA½¥¹Ñ•É…ÁÑÕÉ”ü¸¡•Ù•¹Ð¹Á½¥¹Ñ•É%¤¤•Ù•¹Ð¹ÕÉÉ•¹ÑQ…É•Ð¹É•±•…Í•A½¥¹Ñ•É…ÁÑÕÉ”¡•Ù•¹Ð¹Á½¥¹Ñ•É%¤ì(€€€€€€€€€€€õô(€€€€€€€€€€€½¹A½¥¹Ñ•É…¹•°õí™¥¹¥Í¡…Ñ•½Éå%¹Ñ•É…Ñ¥½¹ô(€€€€€€€€€€€½¹]¡••°õíÁ…ÕÍ•…Ñ•½Éå½É]¡••±ô(€€€€€€€€€€ø(€€€€€€€€€€€íÙ¥Í¥‰±•…Ñ•½É¥•Ì¹µ…À ¡¥Ñ•´¤€ôø€ (€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€±…ÍÍ9…µ”õí•™™•Ñ¥Ù•…Ñ•½Éä€ôôô¥Ñ•´¹¥€üÍÑå±•Ì¹…Ñ¥Ù•…Ñ•½Éä€è€ˆ‰ô(€€€€€€€€€€€€€€€­•äõí¥Ñ•´¹¥‘ô4(€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•Ñ…Ñ•½Éä¡¥Ñ•´¹¥¥ô4(€€€€€€€€€€€€€€€…É¥„µ±…‰•°õí¥Ñ•´¹±…‰•±ô4(€€€€€€€€€€€€€€€Ñ¥Ñ±”õí¥Ñ•´¹±…‰•±ô4(€€€€€€€€€€€€€€ø4(€€€€€€€€€€€€€€€€ñ%µ…”±…ÍÍ9…µ”õíÍÑå±•Ì¹‘•Í­Ñ½Á…Ñ•½Éå%µ…•ôÍÉŒõíÍ•ÑÑ¥¹Ì¹…Ñ•½Éå%µ…•Ím¥Ñ•´¹¥‘tü¹‘•Í­Ñ½Àñð‘•™…Õ±Ñ5½‘Õ±•M•ÑÑ¥¹Ì¹‘½¹…Ñ¥½¸¹…Ñ•½Éå%µ…•Ím¥Ñ•´¹¥‘t¹‘•Í­Ñ½Áô…±Ðõí€‘í¥Ñ•´¹±…‰•±ô‰‡Ç|­…Ñ•½É¥Í¥ô™¥±°Í¥é•Ìôˆ¡µ…àµÝ¥‘Ñ è€ØÐÁÁà¤€ÅÁà°€ÄäÁÁàˆ€¼ø4(€€€€€€€€€€€€€€€€ñ%µ…”±…ÍÍ9…µ”õíÍÑå±•Ì¹µ½‰¥±•…Ñ•½Éå%µ…•ôÍÉŒõíÍ•ÑÑ¥¹Ì¹…Ñ•½Éå%µ…•Ím¥Ñ•´¹¥‘tü¹µ½‰¥±”ñðÍ•ÑÑ¥¹Ì¹…Ñ•½Éå%µ…•Ím¥Ñ•´¹¥‘tü¹‘•Í­Ñ½Àñð‘•™…Õ±Ñ5½‘Õ±•M•ÑÑ¥¹Ì¹‘½¹…Ñ¥½¸¹…Ñ•½Éå%µ…•Ím¥Ñ•´¹¥‘t¹µ½‰¥±•ô…±Ðôˆˆ™¥±°Í¥é•Ìôˆ¡µ…àµÝ¥‘Ñ è€ØÐÁÁà¤€ÄÄáÁà°€ÅÁàˆ€¼ø4(€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø4(€€€€€€€€€€€€¤¥ô4(€€€€€€€€€€ð½‘¥Øø4(€€€€€€€€€íÍ•ÑÑ¥¹Ì¹Í¡½ÝAÉ½É•ÍÌ€ü€ðø4(€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”õí€‘íÍÑå±•Ì¹…Ñ•½ÉåAÉ½É•ÍÍô€‘íÍÑå±•Ì¹…Ñ•½ÉåAÉ½É•ÍÍQ½Áô‘íÍ•ÑÑ¥¹Ì¹‘•Í­Ñ½ÁAÉ½É•ÍÍA½Í¥Ñ¥½¸€ôôô€‰‰½ÑÑ½´ˆ€ü€€‘íÍÑå±•Ì¹‘•Í­Ñ½ÁAÉ½É•ÍÍ=™™õ€€è€ˆ‰ô‘íÍ•ÑÑ¥¹Ì¹µ½‰¥±•AÉ½É•ÍÍA½Í¥Ñ¥½¸€ôôô€‰‰½ÑÑ½´ˆ€ü€€‘íÍÑå±•Ì¹µ½‰¥±•AÉ½É•ÍÍ=™™õ€€è€ˆ‰õô…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆøñ¤ÍÑå±”õíìÝ¥‘Ñ è€‘í…Ñ•½ÉåAÉ½É•ÍÍô•€õô€¼øð½ÍÁ…¸ø4(€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”õí€‘íÍÑå±•Ì¹…Ñ•½ÉåAÉ½É•ÍÍô€‘íÍÑå±•Ì¹…Ñ•½ÉåAÉ½É•ÍÍ	½ÑÑ½µô‘íÍ•ÑÑ¥¹Ì¹‘•Í­Ñ½ÁAÉ½É•ÍÍA½Í¥Ñ¥½¸€ôôô€‰Ñ½Àˆ€ü€€‘íÍÑå±•Ì¹‘•Í­Ñ½ÁAÉ½É•ÍÍ=™™õ€€è€ˆ‰ô‘íÍ•ÑÑ¥¹Ì¹µ½‰¥±•AÉ½É•ÍÍA½Í¥Ñ¥½¸€ôôô€‰Ñ½Àˆ€ü€€‘íÍÑå±•Ì¹µ½‰¥±•AÉ½É•ÍÍ=™™õ€€è€ˆ‰õô…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆøñ¤ÍÑå±”õíìÝ¥‘Ñ è€‘í…Ñ•½ÉåAÉ½É•ÍÍô•€õô€¼øð½ÍÁ…¸ø4(€€€€€€€€€€ð¼ø€è¹Õ±±ô4(€€€€€€€€ð½‘¥Øø4(4(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õí€‘íÍÑå±•Ì¹½¹Ñ•¹ÑÉ¥‘ô‘íÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹±…å½ÕÐ€ôôô€‰É¥ˆ€ü€€‘íÍÑå±•Ì¹‘•Í­Ñ½ÁÉ¥‘õ€€è€ˆ‰ô‘íÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹±…å½ÕÐ€ôôô€‰É¥ˆ€ü€€‘íÍÑå±•Ì¹µ½‰¥±•É¥‘õ€€è€ˆ‰õôø4(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÍÑå±•Ì¹Í•Ñ¥½¹!•…‘¥¹ôø4(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÍÑå±•Ì¹‘•Í­Ñ½Á1½Ý•É!•…‘¥¹ôÍÑå±”õíì‘¥ÍÁ±…äèÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹Í¡½Ý!•…‘¥¹œ€üÕ¹‘•™¥¹•€è€‰¹½¹”ˆõôøñÍÁ…¸ùíÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹¡•…‘¥¹å•‰É½Ýôð½ÍÁ…¸øñ ÈùíÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹¡•…‘¥¹Q¥Ñ±•ôð½ Èøð½‘¥Øø4(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÍÑå±•Ì¹µ½‰¥±•1½Ý•É!•…‘¥¹ôÍÑå±”õíì‘¥ÍÁ±…äèÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹Í¡½Ý!•…‘¥¹œ€üÕ¹‘•™¥¹•€è€‰¹½¹”ˆõôøñÍÁ…¸ùíÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹¡•…‘¥¹å•‰É½Ýôð½ÍÁ…¸øñ ÈùíÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹¡•…‘¥¹Q¥Ñ±•ôð½ Èøð½‘¥Øø4(€€€€€€€€€€€€ð½‘¥Øø4(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÍÑå±•Ì¹…É‘ÍY¥•ÝÁ½ÉÑôø4(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õí€‘íÍÑå±•Ì¹Í¥‘•ÉÉ½Ýô€‘íÍÑå±•Ì¹Í¥‘•ÉÉ½Ý1•™Ñô‘ì…Í•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½ÝÍY¥Í¥‰±”ñð€…Í•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹±•™ÑÉÉ½ÝY¥Í¥‰±”€ü€€‘íÍÑå±•Ì¹‘•Í­Ñ½ÁÉÉ½Ý=™™õ€€è€ˆ‰ô‘ì…Í•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½ÝÍY¥Í¥‰±”ñð€…Í•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹±•™ÑÉÉ½ÝY¥Í¥‰±”€ü€€‘íÍÑå±•Ì¹µ½‰¥±•ÉÉ½Ý=™™õ€€è€ˆ‰õôÑåÁ”ô‰‰ÕÑÑ½¸ˆ…É¥„µ±…‰•°ô‹Y¹•­¤‰‡Ç|ÁÉ½©•±•É¤ˆ½¹±¥¬õì ¤€ôøµ½Ù•…É‘Ì ´Ä¥ôøñÍÁ…¸±…ÍÍ9…µ”õíÍÑå±•Ì¹‘•Í­Ñ½ÁÉÉ½ÝMåµ‰½±ôùí…ÉÉ½ÝMåµ‰½±ÍmÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½Ý%½¹ulÁuôð½ÍÁ…¸øñÍÁ…¸±…ÍÍ9…µ”õíÍÑå±•Ì¹µ½‰¥±•ÉÉ½ÝMåµ‰½±ôùí…ÉÉ½ÝMåµ‰½±ÍmÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½Ý%½¹ulÁuôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø4(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÍÑå±•Ì¹…É‘ÍôÉ•˜õí…É‘ÍI•™ôø4(€€€€€€€€€€€€€í™¥±Ñ•É•¹µ…À ¡ÁÉ½©•Ð¤€ôøì4(€€€€€€€€€€€€€€€½¹ÍÐÁ¥­•€ôÍ•±•Ñ•‘mÁÉ½©•Ð¹¥‘t€üüÁÉ½©•Ð¹ÍÕ•ÍÑ•‘lÁtì4(€€€€€€€€€€€€€€€½¹ÍÐÍ¡…É•‘•Í¥¸€ô€¡ÁÉ½©•Ñ•Í¥¸èÑåÁ•½˜ÁÉ½©•Ð¹‘•Í­Ñ½À°½µµ½¸èÑåÁ•½˜Í•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¤€ôøÁÉ½©•Ñ•Í¥¸¹ÕÍ•M¡…É•‘•Í¥¸€üì4(€€€€€€€€€€€€€€€€€€¸¸¹ÁÉ½©•Ñ•Í¥¸°4(€€€€€€€€€€€€€€€€€…É‘]¥‘Ñ è½µµ½¸¹…É‘]¥‘Ñ °4(€€€€€€€€€€€€€€€€€…É‘A…‘‘¥¹œè½µµ½¸¹…É‘A…‘‘¥¹œ°4(€€€€€€€€€€€€€€€€€…É‘	…­É½Õ¹è½µµ½¸¹…É‘	…­É½Õ¹°4(€€€€€€€€€€€€€€€€€…É‘I…‘¥ÕÌè½µµ½¸¹…É‘I…‘¥ÕÌ°4(€€€€€€€€€€€€€€€€€…É‘	½É‘•É½±½Èè½µµ½¸¹…É‘	½É‘•É½±½È°4(€€€€€€€€€€€€€€€€€…É‘	½É‘•É]¥‘Ñ è½µµ½¸¹…É‘	½É‘•É]¥‘Ñ °4(€€€€€€€€€€€€€€€€€¥µ…•!•¥¡Ðè½µµ½¸¹¥µ…•!•¥¡Ð°4(€€€€€€€€€€€€€€€€€¥µ…•I…‘¥ÕÌè½µµ½¸¹¥µ…•I…‘¥ÕÌ°4(€€€€€€€€€€€€€€€€€Ñ¥Ñ±•½±½Èè½µµ½¸¹Ñ¥Ñ±•½±½È°4(€€€€€€€€€€€€€€€€€Ñ¥Ñ±•M¥é”è½µµ½¸¹Ñ¥Ñ±•M¥é”°4(€€€€€€€€€€€€€€€€€Ñ¥Ñ±•]•¥¡Ðè½µµ½¸¹Ñ¥Ñ±•]•¥¡Ð°4(€€€€€€€€€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¹½±½Èè½µµ½¸¹‘•ÍÉ¥ÁÑ¥½¹½±½È°4(€€€€€€€€€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¹M¥é”è½µµ½¸¹‘•ÍÉ¥ÁÑ¥½¹M¥é”°4(€€€€€€€€€€€€€€€ô€èÁÉ½©•Ñ•Í¥¸ì4(€€€€€€€€€€€€€€€½¹ÍÐ‘•Í­Ñ½Á•Í¥¸€ôÍ¡…É•‘•Í¥¸¡ÁÉ½©•Ð¹‘•Í­Ñ½À°Í•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¤ì4(€€€€€€€€€€€€€€€½¹ÍÐµ½‰¥±••Í¥¸€ôÍ¡…É•‘•Í¥¸¡ÁÉ½©•Ð¹µ½‰¥±”°Í•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¤ì4(€€€€€€€€€€€€€€€É•ÑÕÉ¸€ 4(€€€€€€€€€€€€€€€€€€ñ…ÉÑ¥±”±…ÍÍ9…µ”õí€‘íÍÑå±•Ì¹…É‘ô‘í•™™•Ñ¥Ù•…Ñ•½Éä€ôôô€‰…±°ˆ€˜˜ÁÉ½©•Ð¹Í¡½Ý%¹±±•Í­Ñ½À€ôôô™…±Í”€ü€€‘íÍÑå±•Ì¹…±±•Í­Ñ½Á!¥‘‘•¹õ€€è€ˆ‰ô‘í•™™•Ñ¥Ù•…Ñ•½Éä€ôôô€‰…±°ˆ€˜˜ÁÉ½©•Ð¹Í¡½Ý%¹±±5½‰¥±”€ôôô™…±Í”€ü€€‘íÍÑå±•Ì¹…±±5½‰¥±•!¥‘‘•¹õ€€è€ˆ‰õô­•äõíÁÉ½©•Ð¹¥‘ôÍÑå±”õíì4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ…±°µ‘•Í­Ñ½Àµ½É‘•ÈˆèÁÉ½©•Ð¹…±±=É‘•É•Í­Ñ½À€üü€À°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ…±°µµ½‰¥±”µ½É‘•ÈˆèÁÉ½©•Ð¹…±±=É‘•É5½‰¥±”€üü€À°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ…ÉµÝ¥‘Ñ ˆè€‘í‘•Í­Ñ½Á•Í¥¸¹…É‘]¥‘Ñ¡õÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ…ÉµÝ¥‘Ñ ˆè€‘íµ½‰¥±••Í¥¸¹…É‘]¥‘Ñ¡õÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ…ÉµÁ…‘‘¥¹œˆè€‘í‘•Í­Ñ½Á•Í¥¸¹…É‘A…‘‘¥¹õÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ…ÉµÁ…‘‘¥¹œˆè€‘íµ½‰¥±••Í¥¸¹…É‘A…‘‘¥¹õÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ…Éµ‰œˆè‘•Í­Ñ½Á•Í¥¸¹…É‘	…­É½Õ¹°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ…Éµ‰œˆèµ½‰¥±••Í¥¸¹…É‘	…­É½Õ¹°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ…ÉµÉ…‘¥ÕÌˆè€‘í‘•Í­Ñ½Á•Í¥¸¹…É‘I…‘¥ÕÍõÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ…ÉµÉ…‘¥ÕÌˆè€‘íµ½‰¥±••Í¥¸¹…É‘I…‘¥ÕÍõÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ‰½É‘•Èˆè€‘í‘•Í­Ñ½Á•Í¥¸¹…É‘	½É‘•É]¥‘Ñ¡õÁàÍ½±¥€‘í‘•Í­Ñ½Á•Í¥¸¹…É‘	½É‘•É½±½Éõ€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ‰½É‘•Èˆè€‘íµ½‰¥±••Í¥¸¹…É‘	½É‘•É]¥‘Ñ¡õÁàÍ½±¥€‘íµ½‰¥±••Í¥¸¹…É‘	½É‘•É½±½Éõ€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ¥µ…”µ¡•¥¡Ðˆè€‘í‘•Í­Ñ½Á•Í¥¸¹ÕÍ•M¡…É•‘%µ…••Í¥¸€„ôô™…±Í”€üÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹¥µ…•!•¥¡Ð€è‘•Í­Ñ½Á•Í¥¸¹¥µ…•!•¥¡ÑõÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ¥µ…”µ¡•¥¡Ðˆè€‘íµ½‰¥±••Í¥¸¹ÕÍ•M¡…É•‘%µ…••Í¥¸€„ôô™…±Í”€üÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹¥µ…•!•¥¡Ð€èµ½‰¥±••Í¥¸¹¥µ…•!•¥¡ÑõÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ¥µ…”µ‘¥ÍÁ±…äˆè‘•Í­Ñ½Á•Í¥¸¹¥µ…•Y¥Í¥‰±”€ôôô™…±Í”€ü€‰¹½¹”ˆ€è€‰‰±½¬ˆ°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ¥µ…”µ‘¥ÍÁ±…äˆèµ½‰¥±••Í¥¸¹¥µ…•Y¥Í¥‰±”€ôôô™…±Í”€ü€‰¹½¹”ˆ€è€‰‰±½¬ˆ°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ¥µ…”µ™¥Ðˆè‘•Í­Ñ½Á•Í¥¸¹ÕÍ•M¡…É•‘%µ…••Í¥¸€„ôô™…±Í”€üÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹¥µ…•¥Ð€è‘•Í­Ñ½Á•Í¥¸¹¥µ…•¥Ðñð€‰½Ù•Èˆ°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ¥µ…”µ™¥Ðˆèµ½‰¥±••Í¥¸¹ÕÍ•M¡…É•‘%µ…••Í¥¸€„ôô™…±Í”€üÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹¥µ…•¥Ð€èµ½‰¥±••Í¥¸¹¥µ…•¥Ðñð€‰½Ù•Èˆ°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½ÀµÑ¥Ñ±”µ½±½Èˆè‘•Í­Ñ½Á•Í¥¸¹Ñ¥Ñ±•½±½È°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µÑ¥Ñ±”µ½±½Èˆèµ½‰¥±••Í¥¸¹Ñ¥Ñ±•½±½È°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½ÀµÑ¥Ñ±”µÍ¥é”ˆè€‘í‘•Í­Ñ½Á•Í¥¸¹Ñ¥Ñ±•M¥é•õÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µÑ¥Ñ±”µÍ¥é”ˆè€‘íµ½‰¥±••Í¥¸¹Ñ¥Ñ±•M¥é•õÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½ÀµÑ¥Ñ±”µÝ•¥¡Ðˆè‘•Í­Ñ½Á•Í¥¸¹Ñ¥Ñ±•]•¥¡Ð°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µÑ¥Ñ±”µÝ•¥¡Ðˆèµ½‰¥±••Í¥¸¹Ñ¥Ñ±•]•¥¡Ð°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ‘•ÍÉ¥ÁÑ¥½¸µ½±½Èˆè‘•Í­Ñ½Á•Í¥¸¹‘•ÍÉ¥ÁÑ¥½¹½±½È°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ‘•ÍÉ¥ÁÑ¥½¸µ½±½Èˆèµ½‰¥±••Í¥¸¹‘•ÍÉ¥ÁÑ¥½¹½±½È°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ‘•ÍÉ¥ÁÑ¥½¸µÍ¥é”ˆè€‘í‘•Í­Ñ½Á•Í¥¸¹‘•ÍÉ¥ÁÑ¥½¹M¥é•õÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ‘•ÍÉ¥ÁÑ¥½¸µÍ¥é”ˆè€‘íµ½‰¥±••Í¥¸¹‘•ÍÉ¥ÁÑ¥½¹M¥é•õÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ¡½¥”µ¡•¥¡Ðˆè€‘í‘•Í­Ñ½Á•Í¥¸¹ÁÉ¥•	ÕÑÑ½¹!•¥¡ÑõÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ¡½¥”µ¡•¥¡Ðˆè€‘íµ½‰¥±••Í¥¸¹ÁÉ¥•	ÕÑÑ½¹!•¥¡ÑõÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ¡½¥”µÉ…‘¥ÕÌˆè€‘í‘•Í­Ñ½Á•Í¥¸¹ÁÉ¥•	ÕÑÑ½¹I…‘¥ÕÍõÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ¡½¥”µÉ…‘¥ÕÌˆè€‘íµ½‰¥±••Í¥¸¹ÁÉ¥•	ÕÑÑ½¹I…‘¥ÕÍõÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ¡½¥”µ‰œˆè‘•Í­Ñ½Á•Í¥¸¹ÁÉ¥•	…­É½Õ¹°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ¡½¥”µ‰œˆèµ½‰¥±••Í¥¸¹ÁÉ¥•	…­É½Õ¹°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ¡½¥”µ½±½Èˆè‘•Í­Ñ½Á•Í¥¸¹ÁÉ¥•Q•áÑ½±½È°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ¡½¥”µ½±½Èˆèµ½‰¥±••Í¥¸¹ÁÉ¥•Q•áÑ½±½È°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½ÀµÍ•±•Ñ•µ‰œˆè‘•Í­Ñ½Á•Í¥¸¹Í•±•Ñ•‘AÉ¥•	…­É½Õ¹°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µÍ•±•Ñ•µ‰œˆèµ½‰¥±••Í¥¸¹Í•±•Ñ•‘AÉ¥•	…­É½Õ¹°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½ÀµÍ•±•Ñ•µ½±½Èˆè‘•Í­Ñ½Á•Í¥¸¹Í•±•Ñ•‘AÉ¥•Q•áÑ½±½È°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µÍ•±•Ñ•µ½±½Èˆèµ½‰¥±••Í¥¸¹Í•±•Ñ•‘AÉ¥•Q•áÑ½±½È°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ…Ñ¥½¸µ‰œˆè‘•Í­Ñ½Á•Í¥¸¹…Ñ¥½¹	…­É½Õ¹°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ…Ñ¥½¸µ‰œˆèµ½‰¥±••Í¥¸¹…Ñ¥½¹	…­É½Õ¹°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ…Ñ¥½¸µ½±½Èˆè‘•Í­Ñ½Á•Í¥¸¹…Ñ¥½¹Q•áÑ½±½È°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ…Ñ¥½¸µ½±½Èˆèµ½‰¥±••Í¥¸¹…Ñ¥½¹Q•áÑ½±½È°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ…Ñ¥½¸µ¡•¥¡Ðˆè€‘í‘•Í­Ñ½Á•Í¥¸¹…Ñ¥½¹!•¥¡ÑõÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ…Ñ¥½¸µ¡•¥¡Ðˆè€‘íµ½‰¥±••Í¥¸¹…Ñ¥½¹!•¥¡ÑõÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµ‘•Í­Ñ½Àµ…Ñ¥½¸µÉ…‘¥ÕÌˆè€‘í‘•Í­Ñ½Á•Í¥¸¹…Ñ¥½¹I…‘¥ÕÍõÁá€°4(€€€€€€€€€€€€€€€€€€€€ˆ´µ‘´µ±½Ý•Èµµ½‰¥±”µ…Ñ¥½¸µÉ…‘¥ÕÌˆè€‘íµ½‰¥±••Í¥¸¹…Ñ¥½¹I…‘¥ÕÍõÁá€°4(€€€€€€€€€€€€€€€€€ô…ÌMMAÉ½Á•ÉÑ¥•Íôø4(€€€€€€€€€€€€€€€€€€€€ñ…É‘5•‘¥„µ•‘¥„õíÁÉ½©•Ð¹‘•Í­Ñ½Á5•‘¥„ñðmuô™…±±‰…¬õíÁÉ½©•Ð¹¥µ…•ô±…ÍÍ9…µ”õíÍÑå±•Ì¹‘•Í­Ñ½Á…É‘5•‘¥…ô€¼ø4(€€€€€€€€€€€€€€€€€€€€ñ…É‘5•‘¥„µ•‘¥„õíÁÉ½©•Ð¹µ½‰¥±•5•‘¥„ñðmuô™…±±‰…¬õíÁÉ½©•Ð¹¥µ…•ô±…ÍÍ9…µ”õíÍÑå±•Ì¹µ½‰¥±•…É‘5•‘¥…ô€¼ø4(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÍÑå±•Ì¹…É‘	½‘åôø4(€€€€€€€€€€€€€€€€€€€€€€ñ ÌùíÁÉ½©•Ð¹Ñ¥Ñ±•ôð½ Ìø4(€€€€€€€€€€€€€€€€€€€€€€ñÀùíÁÉ½©•Ð¹‘•ÍÉ¥ÁÑ¥½¹ôð½Àø4(€€€€€€€€€€€€€€€€€€€€€€ñÍµ…±°ùíÁÉ½©•Ð¹ÁÉ¥¥¹5½‘”€ôôô€‰ÅÕ…¹Ñ¥Ñäˆ€ü€‰!¥ÍÍ”…‘•‘¤ˆ€è€‰	‡Ç|ÑÕÑ…ËÄ‰ôð½Íµ…±°ø4(€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÍÑå±•Ì¹¡½¥•Íôø4(€€€€€€€€€€€€€€€€€€€€€€€íÁÉ½©•Ð¹ÍÕ•ÍÑ•¹µ…À ¡…µ½Õ¹Ð¤€ôø€ 4(€€€€€€€€€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õíÁ¥­•€ôôô…µ½Õ¹Ð€üÍÑå±•Ì¹Í•±•Ñ•‘¡½¥”€è€ˆ‰ô­•äõí…µ½Õ¹Ñô½¹±¥¬õì ¤€ôøÍ•ÑM•±•Ñ• ¡ÍÑ…Ñ”¤€ôø€¡ì€¸¸¹ÍÑ…Ñ”°mÁÉ½©•Ð¹¥‘tè…µ½Õ¹Ðô¤¥ôø4(€€€€€€€€€€€€€€€€€€€€€€€€€€€íÁÉ½©•Ð¹ÁÉ¥¥¹5½‘”€ôôô€‰ÅÕ…¹Ñ¥Ñäˆ€ü…µ½Õ¹Ð€èµ½¹•ä¹™½Éµ…Ð¡…µ½Õ¹Ð¥ô4(€€€€€€€€€€€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø4(€€€€€€€€€€€€€€€€€€€€€€€€¤¥ô4(€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø4(€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õíÍÑå±•Ì¹…É‘Ñ¥½¹ôø4(€€€€€€€€€€€€€€€€€€€€€€€€ñ±…‰•°ø4(€€€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùíÁÉ½©•Ð¹ÁÉ¥¥¹5½‘”€ôôô€‰ÅÕ…¹Ñ¥Ñäˆ€üµ½¹•ä¹™½Éµ…Ð¡ÁÉ½©•Ð¹™¥á•‘AÉ¥”€¨Á¥­•¤€è€‹Š
è‰ôð½ÍÁ…¸ø4(€€€€€€€€€€€€€€€€€€€€€€€€€íÁÉ½©•Ð¹ÁÉ¥¥¹5½‘”€ôôô€‰…µ½Õ¹Ðˆ€˜˜ÁÉ½©•Ð¹ÕÍÑ½µµ½Õ¹Ñ¹…‰±•€˜˜€ñ¥¹ÁÕÐ¥¹ÁÕÑ5½‘”ô‰¹Õµ•É¥ŒˆÙ…±Õ”õíÕÍÑ½µmÁÉ½©•Ð¹¥‘tñð€ˆ‰ô½¹¡…¹”õì¡•Ù•¹Ð¤€ôøÍ•ÑÕÍÑ½´ ¡ÍÑ…Ñ”¤€ôø€¡ì€¸¸¹ÍÑ…Ñ”°mÁÉ½©•Ð¹¥‘tè•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”¹É•Á±…” ½myq±t½œ°€ˆˆ¤ô¤¥ôÁ±…•¡½±‘•Èô‰	‡}­„ÑÕÑ…Èˆ€¼ùô4(€€€€€€€€€€€€€€€€€€€€€€€€ð½±…‰•°ø4(€€€€€€€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸½¹±¥¬õì ¤€ôø…‘‘Q½…ÉÐ¡ÁÉ½©•Ð¥ôøñÍÁ…¸±…ÍÍ9…µ”õíÍÑå±•Ì¹‘•Í­Ñ½ÁÑ¥½¹Q•áÑôùí‘•Í­Ñ½Á•Í¥¸¹…Ñ¥½¹Q•áÑôð½ÍÁ…¸øñÍÁ…¸±…ÍÍ9…µ”õíÍÑå±•Ì¹µ½‰¥±•Ñ¥½¹Q•áÑôùíµ½‰¥±••Í¥¸¹…Ñ¥½¹Q•áÑôð½ÍÁ…¸ø€ñˆø¬ð½ˆøð½‰ÕÑÑ½¸ø4(€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø4(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø4(€€€€€€€€€€€€€€€€€€ð½…ÉÑ¥±”ø4(€€€€€€€€€€€€€€€€¤ì4(€€€€€€€€€€€€€ô¥ô4(€€€€€€€€€€€€€€ð½‘¥Øø4(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”õí€‘íÍÑå±•Ì¹Í¥‘•ÉÉ½Ýô€‘íÍÑå±•Ì¹Í¥‘•ÉÉ½ÝI¥¡Ñô‘ì…Í•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½ÝÍY¥Í¥‰±”ñð€…Í•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹É¥¡ÑÉÉ½ÝY¥Í¥‰±”€ü€€‘íÍÑå±•Ì¹‘•Í­Ñ½ÁÉÉ½Ý=™™õ€€è€ˆ‰ô‘ì…Í•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½ÝÍY¥Í¥‰±”ñð€…Í•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹É¥¡ÑÉÉ½ÝY¥Í¥‰±”€ü€€‘íÍÑå±•Ì¹µ½‰¥±•ÉÉ½Ý=™™õ€€è€ˆ‰õôÑåÁ”ô‰‰ÕÑÑ½¸ˆ…É¥„µ±…‰•°ô‰M½¹É…­¤‰‡Ç|ÁÉ½©•±•É¤ˆ½¹±¥¬õì ¤€ôøµ½Ù•…É‘Ì Ä¥ôøñÍÁ…¸±…ÍÍ9…µ”õíÍÑå±•Ì¹‘•Í­Ñ½ÁÉÉ½ÝMåµ‰½±ôùí…ÉÉ½ÝMåµ‰½±ÍmÍ•ÑÑ¥¹Ì¹±½Ý•É•Í­Ñ½À¹…ÉÉ½Ý%½¹ulÅuôð½ÍÁ…¸øñÍÁ…¸±…ÍÍ9…µ”õíÍÑå±•Ì¹µ½‰¥±•ÉÉ½ÝMåµ‰½±ôùí…ÉÉ½ÝMåµ‰½±ÍmÍ•ÑÑ¥¹Ì¹±½Ý•É5½‰¥±”¹…ÉÉ½Ý%½¹ulÅuôð½ÍÁ…¸øð½‰ÕÑÑ½¸ø4(€€€€€€€€€€€€ð½‘¥Øø4(€€€€€€€€ð½‘¥Øø4(€€€€€€ð½Í•Ñ¥½¸ø4(€€€€€í¹½Ñ¥”€˜˜€ñ‘¥Ø±…ÍÍ9…µ”õíÍÑå±•Ì¹Ñ½…ÍÑôùí¹½Ñ¥•ôð½‘¥Øùô4(€€€€ð½Í•Ñ¥½¸ø4(€€¤ì4)ô4