"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { HeaderSettings } from "../lib/header-settings";
import { managedPageHref, type ManagedPage } from "../lib/page-settings";

export default function ManagedPageClient({ page, pages, headerSettings }: { page: ManagedPage; pages: ManagedPage[]; headerSettings: HeaderSettings }) {
  const menuPages = pages.filter((item) => !item.parentId && item.enabled);
  const directPages = menuPages.filter((item) => item.menuType === "direct");
  const childPages = pages.filter((item) => item.parentId && item.enabled);

  return (
    <main className="managed-page">
      <div className={`site-header-shell${headerSettings.sticky ? " is-sticky" : ""}`} style={{
        "--header-bg": headerSettings.backgroundColor,
        "--header-text": headerSettings.textColor,
        "--header-accent": headerSettings.accentColor,
        "--menu-desktop-size": `${headerSettings.menuDesktopSize}px`,
        "--menu-weight": headerSettings.menuFontWeight,
        "--menu-gap": `${headerSettings.menuGap}px`,
        "--menu-hover": headerSettings.menuHoverColor,
      } as CSSProperties}>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Ä°yilik Adresim ana sayfa">
            {headerSettings.logoUrl
              ? <img className="brand-logo" src={headerSettings.logoUrl} alt={headerSettings.logoAlt} />
              : <span className="brand-symbol"><i>i</i><b>a</b></span>}
            {headerSettings.showBrandText && <span className="brand-copy"><strong>{headerSettings.brandName}</strong><small>{headerSettings.brandTagline}</small></span>}
          </Link>
          <nav className="main-nav desktop-page-nav" aria-label="Ana menÃ¼">
            {menuPages.map((item) => item.menuType === "dropdown" ? (
              <div className="desktop-dropdown" key={item.id}>
                <button type="button">{item.title} <span>âŒ„</span></button>
                <div className="desktop-dropdown-panel">
                  {pages.filter((child) => child.parentId === item.id && child.enabled).map((child) => <Link href={`/${child.slug}`} key={child.id}>{child.title}</Link>)}
                </div>
              </div>
            ) : <Link className={item.slug === page.slug ? "is-current" : ""} href={managedPageHref(item)} key={item.id}>{item.title}</Link>)}
          </nav>
          <div className="header-actions">
            {headerSettings.accountEnabled && <a className="account-button" href={headerSettings.accountHref}><span>â—‹</span> {headerSettings.accountLabel}</a>}
            {headerSettings.supportEnabled && <a className="donate-button compact" href={headerSettings.supportHref}>{headerSettings.supportLabel} <span>â†—</span></a>}
          </div>
        </header>
      </div>

      <section className="empty-page-space" aria-label={`${page.title} iÃ§erik alanÄ±`}>
        <span>Ä°Ã‡ERÄ°K ALANI</span>
        <h1>{page.title}</h1>
        <p>Bu sayfanÄ±n iÃ§eriÄŸi daha sonra yÃ¶netim panelinden dÃ¼zenlenecek.</p>
      </section>

      <footer>
        <div className="footer-main">
          <div className="footer-brand">
            <Link className="brand inverted" href="/"><span className="brand-symbol"><i>i</i><b>a</b></span><span className="brand-copy"><strong>Ä°yilik</strong><small>Adresim</small></span></Link>
            <p>Ä°yiliÄŸin gÃ¼venilir ve ÅŸeffaf adresi.</p><a href="mailto:merhaba@iyilikadresim.org">merhaba@iyilikadresim.org</a>
          </div>
          <div><strong>Kurumsal</strong>{directPages.map((item) => <Link href={`/${item.slug}`} key={item.id}>{item.title}</Link>)}</div>
          <div><strong>Alt Sayfalar</strong>{childPages.map((item) => <Link href={`/${item.slug}`} key={item.id}>{item.title}</Link>)}</div>
          <div><strong>Bilgilendirme</strong><a href="#">SÄ±k Sorulanlar</a><a href="#">KVKK</a><a href="#">Gizlilik</a></div>
        </div>
        <div className="footer-bottom"><small>Â© 2026 Ä°yilik Adresim. TÃ¼m haklarÄ± saklÄ±dÄ±r.</small></div>
      </footer>
    </main>
  );
}
