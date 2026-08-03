"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import type { HeaderSettings } from "../lib/header-settings";
import { managedPageHref, type ManagedPage } from "../lib/page-settings";

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  desktopImage: string;
  mobileImage: string;
  active: boolean;
};

const projects = [
  {
    category: "EÄŸitim",
    title: "Bir Ã§ocuÄŸun eÄŸitim yolculuÄŸuna eÅŸlik ol",
    description: "KÄ±rtasiye, okul kÄ±yafeti ve eÄŸitim materyali desteÄŸiyle geleceÄŸe umut taÅŸÄ±.",
    image: "https://images.unsplash.com/photo-1504159506876-f8338247a14a?auto=format&fit=crop&w=1200&q=85",
    accent: "orange",
  },
  {
    category: "Temiz Su",
    title: "Bir damla su, binlerce yeni baÅŸlangÄ±Ã§",
    description: "Temiz suya eriÅŸimi olmayan bÃ¶lgelerde kalÄ±cÄ± su projelerine destek ver.",
    image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=85",
    accent: "blue",
  },
  {
    category: "GÄ±da",
    title: "Sofralara bereket, ailelere dayanÄ±ÅŸma",
    description: "Temel gÄ±da paketlerinin ihtiyaÃ§ sahibi ailelere ulaÅŸmasÄ±na katkÄ±da bulun.",
    image: "https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&w=1200&q=85",
    accent: "green",
  },
];

const supportAmounts = ["250", "500", "1.000", "2.500"];

const faqs = [
  ["YardÄ±mlar nasÄ±l doÄŸrulanÄ±yor?", "BaÅŸvurular belge ve saha kontrolleriyle incelenir. Bu sitedeki kampanyalar ÅŸu an Ã¶rnek iÃ§eriktir; gerÃ§ek doÄŸrulama sistemi yÃ¶netim paneliyle birlikte kurulacaktÄ±r."],
  ["DesteÄŸimin sonucunu gÃ¶rebilecek miyim?", "Ãœyelik sistemi tamamlandÄ±ÄŸÄ±nda destek geÃ§miÅŸi, kampanya gÃ¼ncellemeleri ve etki raporlarÄ± kiÅŸisel hesabÄ±nÄ±zda gÃ¶rÃ¼ntÃ¼lenecektir."],
  ["Åu anda gerÃ§ek Ã¶deme alÄ±nÄ±yor mu?", "HayÄ±r. Mevcut akÄ±ÅŸ gÃ¼venli bir demodur; kart bilgisi istemez ve herhangi bir Ã¼cret tahsil etmez."],
];

function MobileMenuIcon({ name }: { name?: string }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10M9.5 20v-6h5v6" /></>,
    building: <><path d="M3 20h18M5 9h14M7 9v9M11 9v9M15 9v9M19 9v9M4 6l8-3 8 3v3H4z" /></>,
    heart: <><path d="M12 20s-8-4.7-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.3-8 10-8 10Z" /><path d="M7 15h3l1.2-2.5L13 16l1.2-2H17" /></>,
    news: <><path d="M5 4h14v16H5z" /><path d="M8 8h4v4H8zM14 8h2M14 11h2M8 15h8M8 18h8" /></>,
    users: <><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 15c3.5 0 5.5 1.7 6 5" /></>,
    phone: <path d="M7 3h4l1 5-2.5 1.5a16 16 0 0 0 5 5L16 12l5 1v4c0 2.2-1.8 4-4 4C9.3 21 3 14.7 3 7c0-2.2 1.8-4 4-4Z" />,
    book: <><path d="M4 5.5c3-1 5.7-.5 8 1.5v13c-2.3-2-5-2.5-8-1.5zM20 5.5c-3-1-5.7-.5-8 1.5v13c2.3-2 5-2.5 8-1.5z" /></>,
    droplet: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name || "home"] || paths.home}</svg>;
}

export default function HomeClient({ initialSlides, headerSettings, managedPages }: { initialSlides: Slide[]; headerSettings: HeaderSettings; managedPages: ManagedPage[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMobileMenuId, setOpenMobileMenuId] = useState<string | null>(null);
  const [donationOpen, setDonationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState("500");
  const [selectedProject, setSelectedProject] = useState("Genel Destek");
  const [demoComplete, setDemoComplete] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [slides] = useState<Slide[]>(initialSlides);
  const [sliderPosition, setSliderPosition] = useState(slides.length > 1 ? 1 : 0);
  const [dragOffset, setDragOffset] = useState(0);
  const [draggingSlider, setDraggingSlider] = useState(false);
  const desktopMenuPages = managedPages.filter((page) => !page.parentId && page.enabled);
  const configuredMobileItems = headerSettings.mobileMenuItems.filter((item) => item.enabled && item.sourcePageId);
  const activeMobileItems = configuredMobileItems.length ? configuredMobileItems : desktopMenuPages.map((page) => ({
    id: `mobile-${page.id}`,
    label: page.title,
    href: page.menuType === "direct" ? managedPageHref(page) : "#",
    enabled: true,
    newTab: false,
    sourcePageId: page.id,
    mobileIcon: page.id === "projects" ? "heart" : page.id === "about" ? "building" : page.id === "stories" ? "news" : page.id === "contact" ? "phone" : "home",
    mobileIconBg: "#4f86df",
  }));
  const [sliderAnimated, setSliderAnimated] = useState(true);
  const [timerReset, setTimerReset] = useState(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const autoplayTimer = useRef<number | null>(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (autoplayTimer.current !== null) {
      window.clearTimeout(autoplayTimer.current);
      autoplayTimer.current = null;
    }
    if (slides.length < 2 || draggingSlider) return;
    autoplayTimer.current = window.setTimeout(() => {
      autoplayTimer.current = null;
      setSliderAnimated(true);
      setSliderPosition((position) => {
        const safePosition = position <= 0
          ? slides.length
          : position >= slides.length + 1
            ? 1
            : position;
        return safePosition + 1;
      });
    }, 6500);
    return () => {
      if (autoplayTimer.current !== null) {
        window.clearTimeout(autoplayTimer.current);
        autoplayTimer.current = null;
      }
    };
  }, [slides.length, sliderPosition, draggingSlider, timerReset]);

  useEffect(() => {
    if (slides.length < 2) return;
    const isBeforeFirst = sliderPosition <= 0;
    const isAfterLast = sliderPosition >= slides.length + 1;
    if (!isBeforeFirst && !isAfterLast) return;

    const fallback = window.setTimeout(() => {
      setSliderAnimated(false);
      setDragOffset(0);
      setSliderPosition(isBeforeFirst ? slides.length : 1);
    }, 550);

    return () => window.clearTimeout(fallback);
  }, [slides.length, sliderPosition]);

  const currentSlide = slides.length
    ? (sliderPosition - 1 + slides.length) % slides.length
    : 0;
  const trackSlides = slides.length > 1
    ? [slides[slides.length - 1], ...slides, slides[0]]
    : slides;

  function clearAutoplayTimer() {
    if (autoplayTimer.current !== null) {
      window.clearTimeout(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  }

  function restartAutoplayTimer() {
    clearAutoplayTimer();
    setTimerReset((value) => value + 1);
  }

  function moveSlider(amount: number) {
    restartAutoplayTimer();
    setSliderAnimated(true);
    setDragOffset(0);
    setSliderPosition((position) => {
      const safePosition = position <= 0
        ? slides.length
        : position >= slides.length + 1
          ? 1
          : position;
      return safePosition + amount;
    });
  }

  function goToSlide(index: number) {
    restartAutoplayTimer();
    setSliderAnimated(true);
    setDragOffset(0);
    setSliderPosition(index + 1);
  }

  function startSliderDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (slides.length < 2) return;
    if ((event.target as HTMLElement).closest(".slider-controls")) return;
    clearAutoplayTimer();
    dragStart.current = { x: event.clientX, y: event.clientY };
    setSliderAnimated(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveSliderDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const horizontal = event.clientX - dragStart.current.x;
    const vertical = event.clientY - dragStart.current.y;
    if (Math.abs(horizontal) > 8 && Math.abs(horizontal) > Math.abs(vertical)) {
      setDraggingSlider(true);
      setDragOffset(horizontal);
    }
  }

  function finishSliderDrag(event: React.PointerEvent<HTMLDivElement>) {
    const start = dragStart.current;
    dragStart.current = null;
    setDraggingSlider(false);
    if (!start || slides.length < 2) return;
    const horizontal = event.clientX - start.x;
    const vertical = event.clientY - start.y;
    const threshold = Math.max(50, event.currentTarget.clientWidth * 0.12);
    setSliderAnimated(true);
    setDragOffset(0);
    if (Math.abs(horizontal) >= threshold && Math.abs(horizontal) > Math.abs(vertical)) {
      setSliderPosition((position) => {
        const safePosition = position <= 0
          ? slides.length
          : position >= slides.length + 1
            ? 1
            : position;
        return safePosition + (horizontal < 0 ? 1 : -1);
      });
    }
    restartAutoplayTimer();
  }

  function cancelSliderDrag() {
    dragStart.current = null;
    setDraggingSlider(false);
    setSliderAnimated(true);
    setDragOffset(0);
    restartAutoplayTimer();
  }

  function finishSliderTransition() {
    if (slides.length < 2) return;
    if (sliderPosition === 0) {
      setSliderAnimated(false);
      setSliderPosition(slides.length);
    } else if (sliderPosition === slides.length + 1) {
      setSliderAnimated(false);
      setSliderPosition(1);
    }
  }

  function openDonation(project = "Genel Destek") {
    setSelectedProject(project);
    setDemoComplete(false);
    setDonationOpen(true);
  }

  return (
    <main id="top">
      <div
        className={`site-header-shell${headerSettings.sticky ? " is-sticky" : ""}${headerSettings.menuUnderlineEnabled ? "" : " no-menu-underline"}${headerSettings.menuFontFamily === "serif" ? " menu-serif" : ""}`}
        style={{
          "--header-bg": headerSettings.backgroundColor,
          "--header-text": headerSettings.textColor,
          "--header-accent": headerSettings.accentColor,
          "--menu-desktop-size": `${headerSettings.menuDesktopSize}px`,
          "--menu-mobile-size": `${headerSettings.menuMobileSize}px`,
          "--menu-weight": headerSettings.menuFontWeight,
          "--menu-gap": `${headerSettings.menuGap}px`,
          "--menu-letter-spacing": `${headerSettings.menuLetterSpacing}px`,
          "--menu-transform": headerSettings.menuTextTransform,
          "--menu-alignment": headerSettings.menuAlignment,
          "--menu-hover": headerSettings.menuHoverColor,
          "--menu-active": headerSettings.menuActiveColor,
          "--menu-underline": headerSettings.menuUnderlineColor,
          "--menu-underline-thickness": `${headerSettings.menuUnderlineThickness}px`,
          "--mobile-menu-bg": headerSettings.mobileMenuBackgroundColor,
          "--mobile-menu-text": headerSettings.mobileMenuTextColor,
          "--mobile-menu-accent": headerSettings.mobileMenuAccentColor,
          "--mobile-menu-size": `${headerSettings.mobileMenuFontSize}px`,
          "--mobile-menu-weight": headerSettings.mobileMenuFontWeight,
          "--mobile-menu-gap": `${headerSettings.mobileMenuGap}px`,
        } as CSSProperties}
      >
        {headerSettings.topBarEnabled && (headerSettings.phone || headerSettings.email) && (
          <div className="header-contact-bar">
            <div>
              <span>Ä°yiliÄŸe birlikte ulaÅŸalÄ±m</span>
              <p>
                {headerSettings.phone && <a href={`tel:${headerSettings.phone.replace(/\s/g, "")}`}>{headerSettings.phone}</a>}
                {headerSettings.email && <a href={`mailto:${headerSettings.email}`}>{headerSettings.email}</a>}
              </p>
            </div>
          </div>
        )}
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Ä°yilik Adresim ana sayfa">
            {headerSettings.logoUrl
              ? <img className="brand-logo" src={headerSettings.logoUrl} alt={headerSettings.logoAlt} />
              : <span className="brand-symbol"><i>i</i><b>a</b></span>}
            {headerSettings.showBrandText && (
              <span className="brand-copy"><strong>{headerSettings.brandName}</strong><small>{headerSettings.brandTagline}</small></span>
            )}
          </Link>
          <button className={`menu-toggle${menuOpen ? " is-open" : ""}`} type="button" aria-label="MenÃ¼yÃ¼ aÃ§ veya kapat" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
          <nav className="main-nav" aria-label="Ana menÃ¼">
            {desktopMenuPages.map((page) => page.menuType === "dropdown" ? (
              <div className="desktop-dropdown" key={page.id}>
                <button type="button">{page.title} <span>âŒ„</span></button>
                <div className="desktop-dropdown-panel">
                  {managedPages.filter((child) => child.parentId === page.id && child.enabled).map((child) => <Link href={`/${child.slug}`} key={child.id}>{child.title}</Link>)}
                </div>
              </div>
            ) : <Link href={managedPageHref(page)} key={page.id}>{page.title}</Link>)}
          </nav>
          <div className="header-actions">
            {headerSettings.accountEnabled && (
              headerSettings.accountHref === "#uye-girisi"
                ? <button className="account-button" type="button" onClick={() => setAccountOpen(true)}><span>â—‹</span> {headerSettings.accountLabel}</button>
                : <a className="account-button" href={headerSettings.accountHref}><span>â—‹</span> {headerSettings.accountLabel}</a>
            )}
            {headerSettings.supportEnabled && (
              headerSettings.supportHref === "#destek"
                ? <button className="donate-button compact" type="button" onClick={() => openDonation()}>{headerSettings.supportLabel} <span>â†—</span></button>
                : <a className="donate-button compact" href={headerSettings.supportHref}>{headerSettings.supportLabel} <span>â†—</span></a>
            )}
          </div>
        </header>
        <div
          className={`mobile-menu-overlay ${menuOpen ? "is-open" : ""} ${headerSettings.mobileMenuLayout === "drawer" ? "is-drawer" : "is-dropdown"} ${headerSettings.mobileMenuAnimation === "fade" ? "is-fade" : "is-slide"}`}
          aria-hidden={!menuOpen}
        >
          <div className="mobile-menu-body">
            <nav aria-label="Mobil menÃ¼">
              {activeMobileItems.map((item) => {
                const sourcePage = item.sourcePageId ? managedPages.find((page) => page.id === item.sourcePageId) : undefined;
                const children = sourcePage?.menuType === "dropdown" ? managedPages.filter((page) => page.parentId === sourcePage.id && page.enabled) : [];
                const mobileLabel = sourcePage?.title || item.label;
                const mobileHref = sourcePage?.menuType === "direct" ? managedPageHref(sourcePage) : item.href;
                return (
                  <div className={`mobile-menu-card${openMobileMenuId === item.id ? " is-expanded" : ""}`} key={item.id}>
                    {children.length ? (
                      <button type="button" onClick={() => setOpenMobileMenuId((current) => current === item.id ? null : item.id)}>
                        <i className="mobile-card-icon" style={{ background: item.mobileIconBg || "#4f86df" }}><MobileMenuIcon name={item.mobileIcon} /></i>
                        <span>{mobileLabel}</span><b>{openMobileMenuId === item.id ? "âˆ’" : "+"}</b>
                      </button>
                    ) : (
                      <a href={mobileHref} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noreferrer" : undefined} onClick={() => setMenuOpen(false)}>
                        <i className="mobile-card-icon" style={{ background: item.mobileIconBg || "#4f86df" }}><MobileMenuIcon name={item.mobileIcon} /></i>
                        <span>{mobileLabel}</span><b>â€º</b>
                      </a>
                    )}
                    {children.length > 0 && openMobileMenuId === item.id && <div className="mobile-submenu">{children.map((child) => <a href={`/${child.slug}`} key={child.id} onClick={() => setMenuOpen(false)}>{child.title}</a>)}</div>}
                  </div>
                );
              })}
            </nav>
            <div className="mobile-menu-actions">
              {headerSettings.mobileMenuShowAccount && headerSettings.accountEnabled && (
                <button type="button" onClick={() => { setMenuOpen(false); setAccountOpen(true); }}>{headerSettings.accountLabel}</button>
              )}
              {headerSettings.mobileMenuShowSupport && headerSettings.supportEnabled && (
                <button type="button" onClick={() => { setMenuOpen(false); openDonation(); }}>{headerSettings.supportLabel} <span>â†—</span></button>
              )}
            </div>
          </div>
          <div className="mobile-menu-footer">
            <p>{headerSettings.mobileMenuDescription}</p>
            {headerSettings.mobileMenuShowContact && <div>{headerSettings.phone && <a href={`tel:${headerSettings.phone.replace(/\s/g, "")}`}>{headerSettings.phone}</a>}{headerSettings.email && <a href={`mailto:${headerSettings.email}`}>{headerSettings.email}</a>}</div>}
            <nav aria-label="Sosyal medya">{headerSettings.mobileMenuInstagram && <a href={headerSettings.mobileMenuInstagram}>Instagram</a>}{headerSettings.mobileMenuFacebook && <a href={headerSettings.mobileMenuFacebook}>Facebook</a>}{headerSettings.mobileMenuX && <a href={headerSettings.mobileMenuX}>X</a>}</nav>
          </div>
        </div>
      </div>

      <section className="hero" aria-roledescription="carousel" aria-label="Ä°yilik Adresim duyurularÄ±">
        <div
          className={`hero-image${draggingSlider ? " is-dragging" : ""}`}
          onPointerDown={startSliderDrag}
          onPointerMove={moveSliderDrag}
          onPointerUp={finishSliderDrag}
          onPointerCancel={cancelSliderDrag}
        >
          <div
            className={`hero-track${sliderAnimated ? " is-animated" : ""}`}
            style={{ transform: `translate3d(calc(${-sliderPosition * 100}% + ${dragOffset}px), 0, 0)` }}
            onTransitionEnd={finishSliderTransition}
          >
            {trackSlides.map((item, index) => (
              <picture className="hero-media" key={`${item.id}-${index}`}>
                <source media="(max-width: 760px)" srcSet={item.mobileImage} />
                <img src={item.desktopImage} alt="" draggable={false} />
              </picture>
            ))}
          </div>
          {slides.length > 1 && (
            <div className="slider-controls" onPointerDown={(event) => event.stopPropagation()}>
              <button type="button" aria-label="Ã–nceki slayt" onClick={() => moveSlider(-1)}>â†</button>
              <div>{slides.map((item, index) => <button type="button" aria-label={`${index + 1}. slayta git`} aria-current={index === currentSlide} key={item.id} onClick={() => goToSlide(index)}><span /></button>)}</div>
              <button type="button" aria-label="Sonraki slayt" onClick={() => moveSlider(1)}>â†’</button>
            </div>
          )}
        </div>

        <div className="quick-support">
          <div className="quick-title"><span>HÄ±zlÄ± Destek</span><small>3 kolay adÄ±mda</small></div>
          <div className="quick-steps">
            <label><b>1</b><span>Proje seÃ§</span>
              <select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}>
                <option>Genel Destek</option><option>EÄŸitim DesteÄŸi</option><option>Temiz Su Projesi</option><option>GÄ±da DesteÄŸi</option>
              </select>
            </label>
            <label><b>2</b><span>Tutar belirle</span>
              <div className="quick-amounts">
                {supportAmounts.slice(0, 3).map((amount) => (
                  <button key={amount} className={selectedAmount === amount ? "active" : ""} type="button" onClick={() => setSelectedAmount(amount)}>{amount} â‚º</button>
                ))}
              </div>
            </label>
            <button className="quick-submit" type="button" onClick={() => openDonation(selectedProject)}>DesteÄŸi Tamamla <span>â†’</span></button>
          </div>
          <p>ğŸ”’ GÃ¼venli demo Â· Kart bilgisi istenmez</p>
        </div>
      </section>

      <section className="trust-band" aria-label="Platform deÄŸerleri">
        <div><span>01</span><strong>DoÄŸrulanmÄ±ÅŸ ihtiyaÃ§lar</strong><small>Ä°nceleme ve onay sÃ¼reci</small></div>
        <div><span>02</span><strong>Åeffaf bilgilendirme</strong><small>SÃ¼recin her adÄ±mÄ±nÄ± takip et</small></div>
        <div><span>03</span><strong>KalÄ±cÄ± iyilik</strong><small>SÃ¼rdÃ¼rÃ¼lebilir sosyal etki</small></div>
        <div><span>04</span><strong>GÃ¼venli altyapÄ±</strong><small>Verileriniz Ã¶zenle korunur</small></div>
      </section>

      <section className="section projects" id="projeler">
        <div className="section-top">
          <div><span className="section-label">GÃ¼ncel projelerimiz</span><h2>Ä°yiliÄŸin bir parÃ§asÄ± ol.</h2></div>
          <p>Her destek, doÄŸru planlandÄ±ÄŸÄ±nda kalÄ±cÄ± bir deÄŸiÅŸime dÃ¶nÃ¼ÅŸÃ¼r. Sana yakÄ±n gelen iyilik alanÄ±nÄ± seÃ§.</p>
          <a href="#projeler">TÃ¼m projeleri gÃ¶r <span>â†—</span></a>
        </div>
        <div className="project-grid">
          {projects.map((project, index) => (
            <article className="project-card" key={project.title}>
              <div className="project-image">
                <img src={project.image} alt="" />
                <span className={`project-tag ${project.accent}`}>{project.category}</span><b>0{index + 1}</b>
              </div>
              <div className="project-body">
                <h3>{project.title}</h3><p>{project.description}</p>
                <div className="progress"><span style={{ width: `${42 + index * 17}%` }} /></div>
                <div className="project-meta"><small>Ã–rnek ilerleme</small><strong>%{42 + index * 17}</strong></div>
                <button type="button" onClick={() => openDonation(project.title)}>Projeyi Ä°ncele <span>â†’</span></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section" id="hakkimizda">
        <div className="about-image">
          <img src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1400&q=85" alt="DayanÄ±ÅŸma iÃ§in bir araya gelen gÃ¶nÃ¼llÃ¼ler" />
          <div className="experience-stamp"><strong>Ä°YÄ°LÄ°K</strong><span>paylaÅŸtÄ±kÃ§a Ã§oÄŸalÄ±r</span></div>
        </div>
        <div className="about-copy">
          <span className="section-label light-label">Biz kimiz?</span>
          <h2>Ä°yiliÄŸi gÃ¼venle<br />buluÅŸturan bir adres.</h2>
          <p className="lead">Ä°yilik Adresim; yardÄ±m etmek isteyenlerle desteÄŸe ihtiyaÃ§ duyanlar arasÄ±nda gÃ¼venilir, anlaÅŸÄ±lÄ±r ve insan odaklÄ± bir kÃ¶prÃ¼ kurmak iÃ§in tasarlandÄ±.</p>
          <div className="about-points">
            <div><span>âœ“</span><p><strong>AÃ§Ä±k iletiÅŸim</strong>Her aÅŸamada sade ve dÃ¼zenli bilgilendirme.</p></div>
            <div><span>âœ“</span><p><strong>Ä°nsan odaklÄ±</strong>Ä°htiyaca saygÄ±lÄ±, kapsayÄ±cÄ± yaklaÅŸÄ±m.</p></div>
            <div><span>âœ“</span><p><strong>Ã–lÃ§Ã¼lebilir etki</strong>SonuÃ§larÄ±n raporlandÄ±ÄŸÄ± ÅŸeffaf sÃ¼reÃ§.</p></div>
          </div>
          <a className="dark-link" href="#seffaflik">HikÃ¢yemizi keÅŸfet <span>â†—</span></a>
        </div>
      </section>

      <section className="impact-section" id="seffaflik">
        <div className="impact-copy">
          <span className="section-label light-label">ÅeffaflÄ±k sÃ¶zÃ¼mÃ¼z</span>
          <h2>Ä°yiliÄŸin her adÄ±mÄ±<br />gÃ¶rÃ¼nÃ¼r olmalÄ±.</h2>
          <p>YardÄ±mÄ±n nereden baÅŸlayÄ±p nasÄ±l sonuca ulaÅŸtÄ±ÄŸÄ±nÄ± aÃ§Ä±kÃ§a gÃ¶stermeyi hedefliyoruz. AÅŸaÄŸÄ±daki rakamlar sistem tamamlanana kadar Ã¶rnek veridir.</p>
          <a href="#sorular">NasÄ±l Ã§alÄ±ÅŸtÄ±ÄŸÄ±nÄ± Ã¶ÄŸren <span>â†’</span></a>
        </div>
        <div className="impact-numbers">
          <div><strong>4.800<sup>+</sup></strong><span>Ã–rnek destekÃ§i</span></div>
          <div><strong>126</strong><span>Ã–rnek tamamlanan proje</span></div>
          <div><strong>32</strong><span>Ã–rnek aktif Ã§alÄ±ÅŸma</span></div>
          <div><strong>%100</strong><span>ÅeffaflÄ±k hedefi</span></div>
        </div>
      </section>

      <section className="section stories" id="hikayeler">
        <div className="section-top simple">
          <div><span className="section-label">Ä°yilik hikÃ¢yeleri</span><h2>Birlikte mÃ¼mkÃ¼n.</h2></div>
          <p>YakÄ±nda saha Ã§alÄ±ÅŸmalarÄ±mÄ±zdan doÄŸrulanmÄ±ÅŸ gÃ¶rÃ¼ntÃ¼ ve hikÃ¢yeleri burada paylaÅŸacaÄŸÄ±z.</p>
        </div>
        <div className="story-grid">
          <article className="story-main">
            <div className="play-button">â–¶</div>
            <div><span>YakÄ±nda</span><h3>Bir desteÄŸin yolculuÄŸu</h3><p>HazÄ±rlÄ±ktan teslimata, iyiliÄŸin tÃ¼m adÄ±mlarÄ±.</p></div>
          </article>
          <article className="quote-card">
            <span className="quote-mark">â€œ</span>
            <blockquote>GÃ¼ven, yalnÄ±zca sÃ¶zlerle deÄŸil; gÃ¶rÃ¼lebilen ve takip edilebilen bir sÃ¼reÃ§le kurulur.</blockquote>
            <div><b>Ä°yilik Adresim</b><small>ÅeffaflÄ±k ilkesi</small></div>
          </article>
        </div>
      </section>

      <section className="faq-section" id="sorular">
        <div>
          <span className="section-label">Merak ettikleriniz</span><h2>SÄ±kÃ§a sorulan<br />sorular.</h2>
          <p>AradÄ±ÄŸÄ±n cevabÄ± bulamadÄ±n mÄ±?</p><a href="mailto:merhaba@iyilikadresim.org">Bize ulaÅŸ <span>â†—</span></a>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <article className={openFaq === index ? "open" : ""} key={question}>
              <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                <span>0{index + 1}</span>{question}<b>{openFaq === index ? "âˆ’" : "+"}</b>
              </button>
              {openFaq === index && <p>{answer}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div><span>BugÃ¼n bir iyiliÄŸe yer aÃ§</span><h2>DeÄŸiÅŸim, bir kiÅŸinin<br /><em>â€œBen varÄ±mâ€</em> demesiyle baÅŸlar.</h2></div>
        <button className="donate-button light" type="button" onClick={() => openDonation()}>Ä°yiliÄŸe Ortak Ol <span>â†—</span></button>
      </section>

      <footer id="iletisim">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="brand inverted" href="#top">
              <span className="brand-symbol"><i>i</i><b>a</b></span>
              <span className="brand-copy"><strong>Ä°yilik</strong><small>Adresim</small></span>
            </a>
            <p>Ä°yiliÄŸin gÃ¼venilir ve ÅŸeffaf adresi.</p><a href="mailto:merhaba@iyilikadresim.org">merhaba@iyilikadresim.org</a>
          </div>
          <div><strong>Kurumsal</strong><a href="#hakkimizda">HakkÄ±mÄ±zda</a><a href="#seffaflik">ÅeffaflÄ±k</a><a href="#iletisim">Ä°letiÅŸim</a></div>
          <div><strong>Projeler</strong><a href="#projeler">EÄŸitim</a><a href="#projeler">Temiz Su</a><a href="#projeler">GÄ±da</a></div>
          <div><strong>Bilgilendirme</strong><a href="#sorular">SÄ±k Sorulanlar</a><a href="#iletisim">KVKK</a><a href="#iletisim">Gizlilik</a></div>
        </div>
        <div className="footer-bottom"><small>Â© 2026 Ä°yilik Adresim. TÃ¼m haklarÄ± saklÄ±dÄ±r.</small><span>Demo proje Â· GerÃ§ek Ã¶deme alÄ±nmaz.</span></div>
      </footer>

      {donationOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDonationOpen(false)}>
          <section className="support-modal" role="dialog" aria-modal="true" aria-labelledby="support-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={() => setDonationOpen(false)}>Ã—</button>
            {!demoComplete ? (
              <>
                <span className="modal-badge">GÃœVENLÄ° DEMO</span><h2 id="support-title">Ä°yiliÄŸe ortak ol</h2>
                <p className="selected-project">{selectedProject}</p>
                <p>Bu ekran yalnÄ±zca baÄŸÄ±ÅŸ akÄ±ÅŸÄ±nÄ± gÃ¶stermek iÃ§indir. Kart bilgisi istenmez ve gerÃ§ek Ã¶deme alÄ±nmaz.</p>
                <label>Ã–rnek destek tutarÄ±</label>
                <div className="modal-amounts">
                  {supportAmounts.map((amount) => <button className={selectedAmount === amount ? "active" : ""} type="button" key={amount} onClick={() => setSelectedAmount(amount)}>{amount} â‚º</button>)}
                </div>
                <button className="modal-submit" type="button" onClick={() => setDemoComplete(true)}>Demo adÄ±mÄ±nÄ± tamamla <span>â†’</span></button>
                <small>CanlÄ± Ã¶deme, gerekli yasal ve gÃ¼venlik kontrolleri tamamlandÄ±ktan sonra baÄŸlanacaktÄ±r.</small>
              </>
            ) : (
              <div className="success-state">
                <span>âœ“</span><h2 id="support-title">TeÅŸekkÃ¼rler!</h2>
                <p>{selectedAmount} â‚º tutarÄ±ndaki Ã¶rnek desteÄŸin baÅŸarÄ±yla canlandÄ±rÄ±ldÄ±. Herhangi bir Ã¶deme yapÄ±lmadÄ±.</p>
                <button className="modal-submit" type="button" onClick={() => setDonationOpen(false)}>Siteye dÃ¶n</button>
              </div>
            )}
          </section>
        </div>
      )}

      {accountOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setAccountOpen(false)}>
          <section className="support-modal account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={() => setAccountOpen(false)}>Ã—</button>
            <span className="modal-badge">Ã‡OK YAKINDA</span><h2 id="account-title">Ãœyelik sistemi</h2>
            <p>GÃ¼venli Ã¼yelik, destek geÃ§miÅŸi ve kiÅŸisel bildirimler bir sonraki aÅŸamada bu ekrana baÄŸlanacak.</p>
            <div className="coming-features"><span>âœ“ GÃ¼venli giriÅŸ</span><span>âœ“ Destek geÃ§miÅŸi</span><span>âœ“ Kampanya bildirimleri</span></div>
            <button className="modal-submit" type="button" onClick={() => setAccountOpen(false)}>AnladÄ±m</button>
          </section>
        </div>
      )}
    </main>
  );
}
