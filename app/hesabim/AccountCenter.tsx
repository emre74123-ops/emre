"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { User } from "@supabase/supabase-js";
import { createMemberClient } from "../../lib/supabase/member-browser";
import type { HeaderSettings } from "../../lib/header-settings";
import { managedPageHref, type ManagedPage } from "../../lib/page-settings";
import MemberAccountNav from "../components/MemberAccountNav";
import MobileMenuIcon from "../components/MobileMenuIcon";

type Section = "bagislarim" | "kurban" | "sponsorluklar" | "su-kuyularim" | "projelerim" | "ayarlar";
type Profile = {
  full_name: string; phone: string; second_phone: string; birth_date: string; gender: string;
  occupation: string; blood_type: string; country: string; city: string; district: string;
  neighborhood: string; address: string; sms_opt_out: boolean; email_opt_out: boolean;
};

const initialProfile: Profile = {
  full_name: "", phone: "", second_phone: "", birth_date: "", gender: "", occupation: "",
  blood_type: "", country: "Türkiye", city: "", district: "", neighborhood: "", address: "",
  sms_opt_out: false, email_opt_out: false,
};

const sections: { id: Section; label: string; icon: string }[] = [
  { id: "bagislarim", label: "Bağışlarım", icon: "♥" },
  { id: "kurban", label: "Kurban Bağışlarım", icon: "◉" },
  { id: "sponsorluklar", label: "Sponsorluklarım", icon: "◎" },
  { id: "su-kuyularim", label: "Su Kuyularım", icon: "◇" },
  { id: "projelerim", label: "Projelerim", icon: "▤" },
  { id: "ayarlar", label: "Ayarlar", icon: "◆" },
];

export default function AccountCenter({ settings, pages }: { settings: HeaderSettings; pages: ManagedPage[] }) {
  const supabase = useMemo(() => createMemberClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>("bagislarim");
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobilePageId, setOpenMobilePageId] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("bolum") as Section | null;
    if (requested && sections.some((item) => item.id === requested)) setSection(requested);
    supabase.auth.getUser().then(({ data }) => {
      const current = data.user;
      setUser(current);
      if (current) {
        const metadata = current.user_metadata || {};
        setProfile({ ...initialProfile, ...metadata, full_name: String(metadata.full_name || ""), phone: String(metadata.phone || "") });
      }
      setLoading(false);
    });
  }, [supabase]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const { data, error } = await supabase.auth.updateUser({ data: profile });
    if (data.user) setUser(data.user);
    setMessage(error ? error.message : "Bilgileriniz başarıyla güncellendi.");
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Şifreniz başarıyla değiştirildi.");
    if (!error) setPassword("");
  }

  if (loading) return <main className="account-center-loading">Hesabınız hazırlanıyor...</main>;
  if (!user) return (
    <main className="account-center-guest">
      <h1>Hesabınıza giriş yapın</h1><p>Bu sayfayı görüntülemek için üye girişi yapmanız gerekiyor.</p>
      <Link href="/?giris=1">Ana sayfaya dön ve giriş yap</Link>
    </main>
  );

  const name = String(user.user_metadata?.full_name || user.email?.split("@")[0] || "Üyemiz");
  const visibleSections = sections.filter((item) => {
    if (item.id === "bagislarim") return settings.accountMenuDonationsEnabled;
    if (item.id === "kurban") return settings.accountMenuQurbanEnabled;
    if (item.id === "sponsorluklar") return settings.accountMenuSponsorshipsEnabled;
    if (item.id === "su-kuyularim") return settings.accountMenuWellsEnabled;
    if (item.id === "projelerim") return settings.accountMenuProjectsEnabled;
    return true;
  });
  const menuPages = pages.filter((item) => !item.parentId && item.enabled);
  const configuredMobileItems = settings.mobileMenuItems.filter((item) => item.enabled && item.sourcePageId);
  const activeMobileItems = configuredMobileItems.length ? configuredMobileItems : menuPages.map((item) => ({
    id: `mobile-${item.id}`, label: item.title, href: managedPageHref(item), enabled: true, newTab: false,
    sourcePageId: item.id, mobileIcon: "home", mobileIconBg: settings.mobileMenuAccentColor, mobileDescription: "",
  }));

  return (
    <main className="account-center" style={{ "--account-accent": settings.accountPageAccentColor } as CSSProperties}>
      <div className={`site-header-shell account-site-header${settings.sticky ? " is-sticky" : ""}${settings.mobileHeaderSticky ? " mobile-is-sticky" : " mobile-not-sticky"}${settings.topBarEnabled && (settings.phone || settings.email) ? " has-contact-bar" : ""}${settings.menuUnderlineEnabled ? "" : " no-menu-underline"}${settings.menuFontFamily === "serif" ? " menu-serif" : ""}`} style={{
        "--header-bg": settings.backgroundColor,
        "--header-text": settings.textColor,
        "--header-accent": settings.accentColor,
        "--menu-desktop-size": `${settings.menuDesktopSize}px`,
        "--menu-mobile-size": `${settings.menuMobileSize}px`,
        "--menu-weight": settings.menuFontWeight,
        "--menu-gap": `${settings.menuGap}px`,
        "--menu-letter-spacing": `${settings.menuLetterSpacing}px`,
        "--menu-transform": settings.menuTextTransform,
        "--menu-alignment": settings.menuAlignment,
        "--menu-hover": settings.menuHoverColor,
        "--menu-active": settings.menuActiveColor,
        "--menu-underline": settings.menuUnderlineColor,
        "--menu-underline-thickness": `${settings.menuUnderlineThickness}px`,
        "--mobile-menu-bg": settings.mobileMenuBackgroundColor,
        "--mobile-menu-text": settings.mobileMenuTextColor,
        "--mobile-menu-accent": settings.mobileMenuAccentColor,
        "--mobile-menu-size": `${settings.mobileMenuFontSize}px`,
        "--mobile-title-color": settings.mobileMenuTitleColor,
        "--mobile-title-size": `${settings.mobileMenuTitleSize}px`,
        "--mobile-description-color": settings.mobileMenuDescriptionColor,
        "--mobile-description-size": `${settings.mobileMenuDescriptionSize}px`,
        "--mobile-active-text": settings.mobileMenuActiveTextColor,
        "--mobile-active-border": settings.mobileMenuActiveBorderColor,
        "--mobile-menu-weight": settings.mobileMenuFontWeight,
        "--mobile-menu-gap": `${settings.mobileMenuGap}px`,
      } as CSSProperties}>
        {settings.topBarEnabled && (settings.phone || settings.email) && (
          <div className="header-contact-bar"><div><span>İyiliğe birlikte ulaşalım</span><p>{settings.phone && <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>{settings.phone}</a>}{settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}</p></div></div>
        )}
        <header className="site-header">
          <Link className="brand" href="/" aria-label="İyilik Adresim ana sayfa">
            {settings.logoUrl ? <img className="brand-logo" src={settings.logoUrl} alt={settings.logoAlt} /> : <span className="brand-symbol"><i>i</i><b>a</b></span>}
            {settings.showBrandText && <span className="brand-copy"><strong>{settings.brandName}</strong><small>{settings.brandTagline}</small></span>}
          </Link>
          <button className={`menu-toggle${mobileMenuOpen ? " is-open" : ""}`} type="button" aria-label="Menüyü aç veya kapat" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((value) => !value)}>
            <span /><span /><span />
          </button>
          <nav className="main-nav desktop-page-nav" aria-label="Ana menü">
            {menuPages.map((item) => item.menuType === "dropdown" ? (
              <div className="desktop-dropdown" key={item.id}>
                <button type="button">{item.title} <span>⌄</span></button>
                <div className="desktop-dropdown-panel">{pages.filter((child) => child.parentId === item.id && child.enabled).map((child) => <Link href={`/${child.slug}`} key={child.id}>{child.title}</Link>)}</div>
              </div>
            ) : <Link href={managedPageHref(item)} key={item.id}>{item.title}</Link>)}
          </nav>
          <div className="header-actions">
            <MemberAccountNav signedOutLabel={settings.accountLabel} settings={settings} />
            {settings.supportEnabled && <Link className="donate-button compact" href={settings.supportHref}>{settings.supportLabel} <span>↗</span></Link>}
          </div>
        </header>
        <div className={`mobile-menu-overlay account-mobile-menu ${mobileMenuOpen ? "is-open" : ""} is-dropdown`} aria-hidden={!mobileMenuOpen}>
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
                        <i className="mobile-card-icon" style={{ background: item.mobileIconBg || settings.mobileMenuAccentColor }}><MobileMenuIcon name={item.mobileIcon} /></i>
                        <span className="mobile-card-copy"><strong>{label}</strong>{item.mobileDescription && <small>{item.mobileDescription}</small>}</span><b>{openMobilePageId === item.id ? "−" : "+"}</b>
                      </button>
                    ) : (
                      <Link href={href} onClick={() => setMobileMenuOpen(false)}>
                        <i className="mobile-card-icon" style={{ background: item.mobileIconBg || settings.mobileMenuAccentColor }}><MobileMenuIcon name={item.mobileIcon} /></i>
                        <span className="mobile-card-copy"><strong>{label}</strong>{item.mobileDescription && <small>{item.mobileDescription}</small>}</span><b>›</b>
                      </Link>
                    )}
                    {children.length > 0 && openMobilePageId === item.id && <div className="mobile-submenu">{children.map((child) => <Link href={`/${child.slug}`} key={child.id} onClick={() => setMobileMenuOpen(false)}>{child.title}</Link>)}</div>}
                  </div>
                );
              })}
            </nav>
            <div className="mobile-menu-actions">
              <Link href="/hesabim?bolum=bagislarim" onClick={() => setMobileMenuOpen(false)}>Hesabım</Link>
              {settings.supportEnabled && <Link href={settings.supportHref} onClick={() => setMobileMenuOpen(false)}>{settings.supportLabel} <span>↗</span></Link>}
            </div>
          </div>
          <div className="mobile-menu-footer"><p>{settings.mobileMenuDescription}</p></div>
        </div>
      </div>
      <div className="account-center-shell">
        <aside>
          <div className="account-profile-summary"><i>{name.slice(0, 1).toLocaleUpperCase("tr-TR")}</i><strong>{name}</strong><small>{user.email}</small></div>
          <nav>{visibleSections.map((item) => <button className={section === item.id ? "active" : ""} key={item.id} type="button" onClick={() => setSection(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>
        </aside>
        <section className="account-center-content">
          {section === "ayarlar" && (
            <>
              <div className="account-section-heading"><span>HESAP AYARLARI</span><h1>Ayarlar</h1><p>Profil, iletişim, adres ve güvenlik bilgilerinizi tek yerden yönetin.</p></div>
              <form className="account-profile-form" onSubmit={saveProfile}>
                <fieldset><legend>Genel Bilgiler</legend>
                  <label>Ad Soyad<input required value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></label>
                  <label>E-posta<input value={user.email || ""} disabled /></label>
                  <label>Cep Telefonu<input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+90 5xx xxx xx xx" /></label>
                  <label>İkinci Telefon<input value={profile.second_phone} onChange={(e) => setProfile({ ...profile, second_phone: e.target.value })} /></label>
                  <label>Doğum Tarihi<input type="date" value={profile.birth_date} onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })} /></label>
                  <label>Cinsiyet<select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}><option value="">Seçiniz</option><option>Kadın</option><option>Erkek</option><option>Belirtmek istemiyorum</option></select></label>
                  <label>Meslek<input value={profile.occupation} onChange={(e) => setProfile({ ...profile, occupation: e.target.value })} /></label>
                  <label>Kan Grubu<select value={profile.blood_type} onChange={(e) => setProfile({ ...profile, blood_type: e.target.value })}><option value="">Seçiniz</option>{["A+","A-","B+","B-","AB+","AB-","0+","0-"].map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label className="account-check"><input type="checkbox" checked={profile.sms_opt_out} onChange={(e) => setProfile({ ...profile, sms_opt_out: e.target.checked })} /> SMS almak istemiyorum</label>
                  <label className="account-check"><input type="checkbox" checked={profile.email_opt_out} onChange={(e) => setProfile({ ...profile, email_opt_out: e.target.checked })} /> E-posta almak istemiyorum</label>
                </fieldset>
                <fieldset><legend>Adres Bilgileri</legend>
                  <label>Ülke<input value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} /></label>
                  <label>İl<input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></label>
                  <label>İlçe<input value={profile.district} onChange={(e) => setProfile({ ...profile, district: e.target.value })} /></label>
                  <label>Mahalle<input value={profile.neighborhood} onChange={(e) => setProfile({ ...profile, neighborhood: e.target.value })} /></label>
                  <label className="account-full-field">Açık Adres<textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></label>
                </fieldset>
                {message && <p className="account-save-message">{message}</p>}
                <button className="account-save-button" type="submit">Bilgilerimi Güncelle</button>
              </form>
              <div className="account-security-heading"><h2>Şifre ve Güvenlik</h2><p>Hesabınız için güçlü ve benzersiz bir şifre kullanın.</p></div>
              <form className="account-security-form" onSubmit={changePassword}><label>Yeni Şifre<input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></label><button type="submit">Şifremi Değiştir</button></form>
            </>
          )}
          {section !== "ayarlar" && <EmptyAccountSection title={sections.find((item) => item.id === section)?.label || "İşlemlerim"} />}
        </section>
      </div>
      <footer>
        <div className="footer-main">
          <div className="footer-brand"><Link className="brand inverted" href="/"><span className="brand-symbol"><i>i</i><b>a</b></span><span className="brand-copy"><strong>İyilik</strong><small>Adresim</small></span></Link><p>İyiliğin güvenilir ve şeffaf adresi.</p><a href="mailto:merhaba@iyilikadresim.org">merhaba@iyilikadresim.org</a></div>
          <div><strong>Kurumsal</strong><Link href="/#hakkimizda">Hakkımızda</Link><Link href="/#seffaflik">Şeffaflık</Link><Link href="/#iletisim">İletişim</Link></div>
          <div><strong>Projeler</strong><Link href="/#projeler">Eğitim</Link><Link href="/#projeler">Temiz Su</Link><Link href="/#projeler">Gıda</Link></div>
          <div><strong>Bilgilendirme</strong><Link href="/#sorular">Sık Sorulanlar</Link><Link href="/#iletisim">KVKK</Link><Link href="/#iletisim">Gizlilik</Link></div>
        </div>
        <div className="footer-bottom"><small>© 2026 İyilik Adresim. Tüm hakları saklıdır.</small><span>Demo proje · Gerçek ödeme alınmaz.</span></div>
      </footer>
    </main>
  );
}

function EmptyAccountSection({ title }: { title: string }) {
  return <div className="account-empty-section"><span>◇</span><h1>{title}</h1><p>Henüz bu bölümde kayıtlı bir işleminiz bulunmuyor.</p><Link href="/#projeler">Projeleri incele</Link></div>;
}
