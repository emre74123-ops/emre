"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { HeaderSettings } from "../lib/header-settings";
import { managedPageHref, type ManagedPage } from "../lib/page-settings";
import MemberAccountNav from "./components/MemberAccountNav";
import MobileMenuIcon from "./components/MobileMenuIcon";
import SiteFooter from "./components/SiteFooter";

export default function ManagedPageClient({ page, pages, headerSettings }: { page: ManagedPage; pages: ManagedPage[]; headerSettings: HeaderSettings }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobilePageId, setOpenMobilePageId] = useState("");
  const menuPages = pages.filter((item) => !item.parentId && item.enabled);
  const configuredMobileItems = headerSettings.mobileMenuItems.filter((item) => item.enabled && item.sourcePageId);
  const activeMobileItems = configuredMobileItems.length ? configuredMobileItems : menuPages.map((item) => ({
    id: `mobile-${item.id}`, label: item.title, href: managedPageHref(item), enabled: true, newTab: false,
    sourcePageId: item.id, mobileIcon: "home", mobileIconBg: headerSettings.mobileMenuAccentColor, mobileDescription: "",
  }));

  return (
    <main className="managed-page">
      <div className={`site-header-shell${headerSettings.sticky ? " is-sticky" : ""}${headerSettings.mobileHeaderSticky ? " mobile-is-sticky" : " mobile-not-sticky"}${headerSettings.topBarEnabled && (headerSettings.phone || headerSettings.email) ? " has-contact-bar" : ""}${headerSettings.menuUnderlineEnabled ? "" : " no-menu-underline"}${headerSettings.menuFontFamily === "serif" ? " menu-serif" : ""}`} style={{
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
        "--mobile-title-color": headerSettings.mobileMenuTitleColor,
        "--mobile-title-size": `${headerSettings.mobileMenuTitleSize}px`,
        "--mobile-description-color": headerSettings.mobileMenuDescriptionColor,
        "--mobile-description-size": `${headerSettings.mobileMenuDescriptionSize}px`,
        "--mobile-active-text": headerSettings.mobileMenuActiveTextColor,
        "--mobile-active-border": headerSettings.mobileMenuActiveBorderColor,
        "--mobile-menu-weight": headerSettings.mobileMenuFontWeight,
        "--mobile-menu-gap": `${headerSettings.mobileMenuGap}px`,
      } as CSSProperties}>
        {headerSettings.topBarEnabled && (headerSettings.phone || headerSettings.email) && (
          <div className="header-contact-bar"><div><span>İyiliğe birlikte ulaşalım</span><p>{headerSettings.phone && <a href={`tel:${headerSettings.phone.replace(/\s/g, "")}`}>{headerSettings.phone}</a>}{headerSettings.email && <a href={`mailto:${headerSettings.email}`}>{headerSettings.email}</a>}</p></div></div>
        )}
        <header className="site-header">
          <Link className="brand" href="/" aria-label="İyilik Adresim ana sayfa">
            {headerSettings.logoUrl
              ? <img className="brand-logo" src={headerSettings.logoUrl} alt={headerSettings.logoAlt} />
              : <span className="brand-symbol"><i>i</i><b>a</b></span>}
            {headerSettings.showBrandText && <span className="brand-copy"><strong>{headerSettings.brandName}</strong><small>{headerSettings.brandTagline}</small></span>}
          </Link>
          <button className={`menu-toggle${mobileMenuOpen ? " is-open" : ""}`} type="button" aria-label="Menüyü aç veya kapat" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((value) => !value)}>
            <span /><span /><span />
          </button>
          <nav className="main-nav desktop-page-nav" aria-label="Ana menü">
            {menuPages.map((item) => item.menuType === "dropdown" ? (
              <div className="desktop-dropdown" key={item.id}>
                <button type="button">{item.title} <span>⌄</span></button>
                <div className="desktop-dropdown-panel">
                  {pages.filter((child) => child.parentId === item.id && child.enabled).map((child) => <Link href={`/${child.slug}`} key={child.id}>{child.title}</Link>)}
                </div>
              </div>
            ) : <Link className={item.slug === page.slug ? "is-current" : ""} href={managedPageHref(item)} key={item.id}>{item.title}</Link>)}
          </nav>
          <div className="header-actions">
            {headerSettings.accountEnabled && <MemberAccountNav signedOutLabel={headerSettings.accountLabel} settings={headerSettings} />}
            {headerSettings.supportEnabled && <a className="donate-button compact" href={headerSettings.supportHref}>{headerSettings.supportLabel} <span>↗</span></a>}
          </div>
        </header>
        <div className={`mobile-menu-overlay managed-page-mobile-menu ${mobileMenuOpen ? "is-open" : ""} ${headerSettings.mobileMenuLayout === "drawer" ? "is-drawer" : "is-dropdown"}`} aria-hidden={!mobileMenuOpen}>
          <div className="mobile-menu-body">
            <nav aria-label="Mobil menü">
              {activeMobileItems.map((item) => {
                const sourcePage = pages.find((candidate) => candidate.id === item.sourcePageId);
                const children = sourcePage?.menuType === "dropdown" ? pages.filter((child) => child.parentId === sourcePage.id && child.enabled) : [];
                const label = sourcePage?.title || item.label;
                const href = sourcePage?.menuType === "direct" ? managedPageHref(sourcePage) : item.href;
                return (
                  <div className={`mobile-menu-card${openMobilePageId === item.id ? " is-expanded" : ""}`} key={item.id}>
                    {children.length ? (
                      <button type="button" onClick={() => setOpenMobilePageId((current) => current === item.id ? "" : item.id)}>
                        <i className="mobile-card-icon" style={{ background: item.mobileIconBg || headerSettings.mobileMenuAccentColor }}><MobileMenuIcon name={item.mobileIcon} /></i>
                        <span className="mobile-card-copy"><strong style={{ fontWeight: headerSettings.mobileMenuFontWeight }}>{label}</strong>{item.mobileDescription && <small>{item.mobileDescription}</small>}</span><b>{openMobilePageId === item.id ? "−" : "+"}</b>
                      </button>
                    ) : (
                      <Link href={href} onClick={() => setMobileMenuOpen(false)}>
                        <i className="mobile-card-icon" style={{ background: item.mobileIconBg || headerSettings.mobileMenuAccentColor }}><MobileMenuIcon name={item.mobileIcon} /></i>
                        <span className="mobile-card-copy"><strong style={{ fontWeight: headerSettings.mobileMenuFontWeight }}>{label}</strong>{item.mobileDescription && <small>{item.mobileDescription}</small>}</span><b>›</b>
                      </Link>
                    )}
                    {children.length > 0 && openMobilePageId === item.id && <div className="mobile-submenu">{children.map((child) => <Link href={`/${child.slug}`} key={child.id} onClick={() => setMobileMenuOpen(false)}>{child.title}</Link>)}</div>}
                  </div>
                );
              })}
            </nav>
            <div className="mobile-menu-actions">
              {headerSettings.mobileMenuShowAccount && headerSettings.accountEnabled && <MemberAccountNav signedOutLabel={headerSettings.accountLabel} settings={headerSettings} />}
              {headerSettings.mobileMenuShowSupport && headerSettings.supportEnabled && <Link className="managed-mobile-support" href={headerSettings.supportHref} onClick={() => setMobileMenuOpen(false)}>{headerSettings.supportLabel} <span>↗</span></Link>}
            </div>
          </div>
          <div className="mobile-menu-footer">
            <p>{headerSettings.mobileMenuDescription}</p>
            {headerSettings.mobileMenuShowContact && <div>{headerSettings.phone && <a href={`tel:${headerSettings.phone.replace(/\s/g, "")}`}>{headerSettings.phone}</a>}{headerSettings.email && <a href={`mailto:${headerSettings.email}`}>{headerSettings.email}</a>}</div>}
          </div>
        </div>
      </div>

      <section className="empty-page-space" aria-label={`${page.title} içerik alanı`}>
        <span>İÇERİK ALANI</span>
        <h1>{page.title}</h1>
        <p>Bu sayfanın içeriği daha sonra yönetim panelinden düzenlenecek.</p>
      </section>

      <SiteFooter />
    </main>
  );
}
