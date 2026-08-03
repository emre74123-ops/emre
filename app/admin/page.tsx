"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";
import { defaultSlides } from "../../lib/slides";
import { defaultHeaderSettings, type HeaderSettings } from "../../lib/header-settings";
import { defaultManagedPages, managedPageHref, normalizeSlug, type ManagedPage } from "../../lib/page-settings";

type Campaign = {
  id: string;
  title: string;
  category: string;
  status: "draft" | "published" | "archived";
  target_amount: number;
  raised_amount: number;
  created_at: string;
};

type Application = {
  id: string;
  name: string;
  email: string;
  type: "volunteer" | "aid_request" | "contact";
  status: "new" | "reviewing" | "answered" | "closed";
  created_at: string;
};

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

type SliderImage = {
  path: string;
  url: string;
  size: number;
  createdAt: string | null;
};

const navItems = [
  ["overview", "âŒ‚", "Genel BakÄ±ÅŸ"],
  ["header", "â–°", "Header YÃ¶netimi"],
  ["mobileMenu", "â˜°", "Mobil MenÃ¼ YÃ¶netimi"],
  ["slider", "â–£", "Slider YÃ¶netimi"],
  ["campaigns", "â—‡", "Kampanyalar"],
  ["applications", "â—«", "BaÅŸvurular"],
  ["members", "â—", "Ãœyeler"],
  ["content", "â–¤", "Ä°Ã§erik YÃ¶netimi"],
  ["settings", "âš™", "Site AyarlarÄ±"],
];

const mobileIconOptions = [
  ["home", "âŒ‚", "Ana sayfa"],
  ["building", "â–¥", "Kurum / Bina"],
  ["heart", "â™¥", "YardÄ±m / Kalp"],
  ["news", "â–¤", "Haber / Medya"],
  ["users", "â—", "Topluluk"],
  ["phone", "â˜", "Ä°letiÅŸim"],
  ["book", "â–§", "EÄŸitim / Kitap"],
  ["droplet", "â—‰", "Su / Damla"],
];

export default function AdminPage() {
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [slides, setSlides] = useState<Slide[]>(defaultSlides);
  const [loading, setLoading] = useState(true);
  const [campaignModal, setCampaignModal] = useState(false);
  const [toast, setToast] = useState("");
  const [siteLive, setSiteLive] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/campaigns").then((response) => response.json()),
      fetch("/api/admin/applications").then((response) => response.json()),
      fetch("/api/admin/slides").then(async (response) => {
        const result = await response.json();
        if (response.ok && Array.isArray(result.slides) && result.slides.length) return result;
        const fallbackResponse = await fetch(`/api/slides?t=${Date.now()}`, { cache: "no-store" });
        return fallbackResponse.json();
      }),
    ]).then(([campaignResult, applicationResult, slideResult]) => {
      setCampaigns(campaignResult.campaigns || []);
      setApplications(applicationResult.applications || []);
      setSlides(Array.isArray(slideResult.slides) && slideResult.slides.length ? slideResult.slides : defaultSlides);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      showToast("Veriler yÃ¼klenemedi. LÃ¼tfen sayfayÄ± yenile.");
    });
  }, []);

  const totalRaised = useMemo(
    () => campaigns.reduce((sum, campaign) => sum + Number(campaign.raised_amount || 0), 0),
    [campaigns],
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  async function addCampaign(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "Genel");
    const target = String(formData.get("target") || "0");
    if (!title) return;
    const response = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, target_amount: Number(target) }),
    });
    const result = await response.json();
    if (!response.ok) {
      showToast(result.error || "Kampanya kaydedilemedi.");
      return;
    }
    setCampaigns((current) => [result.campaign, ...current]);
    setCampaignModal(false);
    showToast("Yeni kampanya taslak olarak eklendi.");
  }

  function selectSection(section: string) {
    setActive(section);
    setSidebarOpen(false);
  }

  return (
    <main className={styles.admin}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarTop}>
          <Link className={styles.brand} href="/" aria-label="Ä°yilik Adresim ana sayfa">
            <span className={styles.brandMark}>ia</span>
            <span><strong>Ä°yilik</strong><small>Adresim</small></span>
          </Link>
          <button className={styles.closeMenu} type="button" onClick={() => setSidebarOpen(false)}>Ã—</button>
        </div>

        <div className={styles.workspace}>
          <span>Ã‡alÄ±ÅŸma alanÄ±</span>
          <button type="button"><i>Ä°A</i><b>Ä°yilik Adresim</b><em>âŒ„</em></button>
        </div>

        <nav className={styles.nav} aria-label="YÃ¶netim paneli menÃ¼sÃ¼">
          <span className={styles.navLabel}>YÃ¶netim</span>
          {navItems.map(([id, icon, label]) => (
            <button className={`${active === id ? styles.activeNav : ""} ${id === "mobileMenu" ? styles.navMobileMenu : ""}`} type="button" key={id} onClick={() => selectSection(id)}>
              <i>{icon}</i><span>{label}</span>
              {id === "applications" && applications.length > 0 && <b>{applications.length}</b>}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.demoNotice}><span>âœ“</span><p><strong>GÃ¼venli baÄŸlantÄ±</strong>Supabase veritabanÄ± aktif.</p></div>
          <div className={styles.profile}>
            <span>EK</span><p><strong>Emre KÃ¶k</strong><small>YÃ¶netici</small></p>
            <button
              className={styles.accountMenuButton}
              type="button"
              aria-label="Hesap menÃ¼sÃ¼nÃ¼ aÃ§"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >âš™</button>
            {accountMenuOpen && (
              <>
                <button className={styles.accountMenuOverlay} type="button" aria-label="Hesap menÃ¼sÃ¼nÃ¼ kapat" onClick={() => setAccountMenuOpen(false)} />
                <div className={styles.accountMenu}>
                  <div className={styles.accountMenuHeader}>
                    <span>EK</span>
                    <p><strong>Emre KÃ¶k</strong><small>GÃ¼venli yÃ¶netici oturumu</small><em>YÃ¶netici hesabÄ±</em></p>
                  </div>
                  <nav aria-label="Hesap iÅŸlemleri">
                    <Link href="/admin/account"><i>âš¿</i><span><strong>Åifre deÄŸiÅŸtir</strong><small>HesabÄ±nÄ±n ÅŸifresini gÃ¼ncelle</small></span><b>â€º</b></Link>
                    <a href="/" target="_blank" rel="noreferrer"><i>â†—</i><span><strong>Siteyi gÃ¶rÃ¼ntÃ¼le</strong><small>CanlÄ± siteyi yeni sekmede aÃ§</small></span><b>â€º</b></a>
                  </nav>
                  <form action="/admin/logout" method="post">
                    <button type="submit"><i>â†ª</i><span><strong>GÃ¼venli Ã§Ä±kÄ±ÅŸ yap</strong><small>YÃ¶netici oturumunu kapat</small></span></button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className={styles.mobileOverlay} aria-label="MenÃ¼yÃ¼ kapat" type="button" onClick={() => setSidebarOpen(false)} />}

      <section className={styles.content}>
        <header className={styles.topbar}>
          <button className={styles.mobileMenu} type="button" aria-label="MenÃ¼yÃ¼ aÃ§" onClick={() => setSidebarOpen(true)}>â˜°</button>
          <div className={styles.breadcrumb}><span>YÃ¶netim Paneli</span><b>/</b><strong>{navItems.find((item) => item[0] === active)?.[2]}</strong></div>
          <div className={styles.topActions}>
            <Link href="/" target="_blank">Siteyi GÃ¶rÃ¼ntÃ¼le â†—</Link>
            <button type="button" aria-label="Bildirimler">â™¢<b>3</b></button>
            <span>EK</span>
          </div>
        </header>

        <div className={styles.page}>
          {active === "overview" && (
            <>
              <div className={styles.pageHeading}>
                <div><p>2 AÄŸustos 2026, Pazar</p><h1>GÃ¼naydÄ±n, Emre ğŸ‘‹</h1><span>Ä°yilik Adresim&apos;de bugÃ¼n neler olduÄŸuna gÃ¶z at.</span></div>
                <button className={styles.primaryButton} type="button" onClick={() => setCampaignModal(true)}>ï¼‹ Yeni Kampanya</button>
              </div>

              <div className={styles.demoBanner}><span>âœ“</span><p><strong>VeritabanÄ± baÄŸlantÄ±sÄ± aktif.</strong>Bu ekrandaki kampanya ve baÅŸvuru bilgileri Supabase&apos;den gerÃ§ek zamanlÄ± olarak yÃ¼klenir.</p></div>

              <section className={styles.stats}>
                <article><div className={styles.statIcon}>â†—</div><span>KayÄ±tlÄ± destek</span><strong>{formatMoney(totalRaised)}</strong><small className={styles.up}>CanlÄ± <i>veritabanÄ± toplamÄ±</i></small></article>
                <article><div className={styles.statIcon}>â—‡</div><span>YayÄ±ndaki kampanya</span><strong>{campaigns.filter((item) => item.status === "published").length}</strong><small className={styles.up}>{campaigns.length} <i>toplam kampanya</i></small></article>
                <article><div className={styles.statIcon}>â—</div><span>Taslak kampanya</span><strong>{campaigns.filter((item) => item.status === "draft").length}</strong><small className={styles.up}>HazÄ±rlanÄ±yor</small></article>
                <article><div className={styles.statIcon}>â—«</div><span>Bekleyen baÅŸvuru</span><strong>{applications.filter((item) => item.status === "new").length}</strong><small className={styles.warn}>{applications.length} <i>toplam baÅŸvuru</i></small></article>
              </section>

              <div className={styles.dashboardGrid}>
                <section className={styles.card}>
                  <div className={styles.cardHeader}><div><h2>Destek Ã¶zeti</h2><p>GerÃ§ek kayÄ±tlarÄ±n toplamÄ±</p></div></div>
                  <div className={styles.realEmpty}><span>â†—</span><strong>{formatMoney(totalRaised)}</strong><p>{loading ? "Veriler yÃ¼kleniyor..." : totalRaised > 0 ? "Kampanyalara kaydedilen toplam destek" : "HenÃ¼z destek kaydÄ± bulunmuyor."}</p></div>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardHeader}><div><h2>HÄ±zlÄ± iÅŸlemler</h2><p>SÄ±k kullanÄ±lan iÅŸlemler</p></div></div>
                  <div className={styles.quickActions}>
                    <button type="button" onClick={() => setCampaignModal(true)}><i>ï¼‹</i><span><strong>Kampanya oluÅŸtur</strong><small>Yeni bir yardÄ±m kampanyasÄ± ekle</small></span><b>â€º</b></button>
                    <button type="button" onClick={() => selectSection("mobileMenu")}><i>â˜°</i><span><strong>Mobil menÃ¼yÃ¼ tasarla</strong><small>Telefona Ã¶zel menÃ¼ yÃ¶netimi</small></span><b>â€º</b></button>
                    <button type="button" onClick={() => selectSection("applications")}><i>â—«</i><span><strong>BaÅŸvurularÄ± incele</strong><small>{applications.length} kayÄ±t bulunuyor</small></span><b>â€º</b></button>
                    <button type="button" onClick={() => selectSection("content")}><i>â–¤</i><span><strong>Ä°Ã§erikleri dÃ¼zenle</strong><small>Ana sayfa ve duyurular</small></span><b>â€º</b></button>
                    <button type="button" onClick={() => selectSection("settings")}><i>âš™</i><span><strong>Site ayarlarÄ±</strong><small>Genel gÃ¶rÃ¼nÃ¼m ve bilgiler</small></span><b>â€º</b></button>
                  </div>
                </section>
              </div>

              <section className={`${styles.card} ${styles.recentCard}`}>
                <div className={styles.cardHeader}><div><h2>Son baÅŸvurular</h2><p>Yeni gelen mesaj ve talepler</p></div><button type="button" onClick={() => selectSection("applications")}>TÃ¼mÃ¼nÃ¼ GÃ¶r â†’</button></div>
                <ApplicationTable applications={applications} />
              </section>
            </>
          )}

          {active === "slider" && <SliderManager slides={slides} setSlides={setSlides} showToast={showToast} />}
          {active === "header" && <HeaderManager showToast={showToast} />}
          {active === "mobileMenu" && <MobileMenuManager showToast={showToast} />}

          {active === "campaigns" && (
            <>
              <div className={styles.pageHeading}><div><p>Ä°Ã§erik yÃ¶netimi</p><h1>Kampanyalar</h1><span>YardÄ±m kampanyalarÄ±nÄ± oluÅŸtur, dÃ¼zenle ve yayÄ±nla.</span></div><button className={styles.primaryButton} type="button" onClick={() => setCampaignModal(true)}>ï¼‹ Yeni Kampanya</button></div>
              <section className={styles.card}>
                <div className={styles.toolbar}><input aria-label="Kampanya ara" placeholder="Kampanya ara..." /><select aria-label="Durum filtresi"><option>TÃ¼m durumlar</option><option>YayÄ±nda</option><option>Taslak</option></select></div>
                <div className={styles.campaignList}>
                  {!loading && campaigns.length === 0 && <div className={styles.listEmpty}><span>â—‡</span><strong>HenÃ¼z kampanya yok</strong><p>Ä°lk gerÃ§ek kampanyanÄ± â€œYeni Kampanyaâ€ dÃ¼ÄŸmesiyle oluÅŸturabilirsin.</p></div>}
                  {campaigns.map((campaign) => (
                    <article key={campaign.id}>
                      <div className={styles.campaignThumb}>{campaign.category.slice(0, 1)}</div>
                      <div className={styles.campaignName}><strong>{campaign.title}</strong><span>{campaign.category}</span></div>
                      <div className={styles.campaignProgress}><div><span style={{ width: `${campaign.target_amount > 0 ? Math.min(100, (campaign.raised_amount / campaign.target_amount) * 100) : 0}%` }} /></div><small>{formatMoney(campaign.raised_amount)} / {formatMoney(campaign.target_amount)}</small></div>
                      <span className={campaign.status === "published" ? styles.liveStatus : styles.draftStatus}>â— {campaign.status === "published" ? "YayÄ±nda" : campaign.status === "draft" ? "Taslak" : "ArÅŸiv"}</span>
                      <button type="button" onClick={() => showToast(`${campaign.title} dÃ¼zenleme ekranÄ± yakÄ±nda baÄŸlanacak.`)}>DÃ¼zenle</button>
                    </arti…12061 tokens truncated…</option><option value="900">En kalÄ±n</option></select></label>
          <label>YazÄ± tipi<select value={settings.menuFontFamily} onChange={(event) => setSettings({ ...settings, menuFontFamily: event.target.value as HeaderSettings["menuFontFamily"] })}><option value="sans">Modern / Sade</option><option value="serif">Klasik / Kurumsal</option></select></label>
          <label>Harf gÃ¶rÃ¼nÃ¼mÃ¼<select value={settings.menuTextTransform} onChange={(event) => setSettings({ ...settings, menuTextTransform: event.target.value as HeaderSettings["menuTextTransform"] })}><option value="none">Normal</option><option value="uppercase">TÃ¼mÃ¼ bÃ¼yÃ¼k</option></select></label>
          <label>MenÃ¼ konumu<select value={settings.menuAlignment} onChange={(event) => setSettings({ ...settings, menuAlignment: event.target.value as HeaderSettings["menuAlignment"] })}><option value="start">Logoya yakÄ±n</option><option value="center">Ortada</option><option value="end">DÃ¼ÄŸmelere yakÄ±n</option></select></label>
          <label>MenÃ¼ aralÄ±ÄŸÄ± <b>{settings.menuGap} px</b><input type="range" min="8" max="55" value={settings.menuGap} onChange={(event) => setSettings({ ...settings, menuGap: Number(event.target.value) })} /></label>
          <label>Harf aralÄ±ÄŸÄ± <b>{settings.menuLetterSpacing} px</b><input type="range" min="-1" max="4" step=".25" value={settings.menuLetterSpacing} onChange={(event) => setSettings({ ...settings, menuLetterSpacing: Number(event.target.value) })} /></label>
          <label>Ãœzerine gelince<span className={styles.colorField}><input type="color" value={settings.menuHoverColor} onChange={(event) => setSettings({ ...settings, menuHoverColor: event.target.value })} /><input value={settings.menuHoverColor} onChange={(event) => setSettings({ ...settings, menuHoverColor: event.target.value })} /></span></label>
          <label>Aktif menÃ¼ rengi<span className={styles.colorField}><input type="color" value={settings.menuActiveColor} onChange={(event) => setSettings({ ...settings, menuActiveColor: event.target.value })} /><input value={settings.menuActiveColor} onChange={(event) => setSettings({ ...settings, menuActiveColor: event.target.value })} /></span></label>
          <label>Alt Ã§izgi rengi<span className={styles.colorField}><input type="color" value={settings.menuUnderlineColor} onChange={(event) => setSettings({ ...settings, menuUnderlineColor: event.target.value })} /><input value={settings.menuUnderlineColor} onChange={(event) => setSettings({ ...settings, menuUnderlineColor: event.target.value })} /></span></label>
          <label>Alt Ã§izgi kalÄ±nlÄ±ÄŸÄ± <b>{settings.menuUnderlineThickness} px</b><input type="range" min="1" max="5" value={settings.menuUnderlineThickness} onChange={(event) => setSettings({ ...settings, menuUnderlineThickness: Number(event.target.value) })} /></label>
          <label className={styles.headerCheck}><input type="checkbox" checked={settings.menuUnderlineEnabled} onChange={(event) => setSettings({ ...settings, menuUnderlineEnabled: event.target.checked })} /> MenÃ¼ alt Ã§izgi efektini gÃ¶ster</label>
        </div>
      </section>

      <PageManager showToast={showToast} embedded onPagesChange={setManagedPages} />

      <div className={styles.headerSettingsGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>Header dÃ¼ÄŸmeleri</h2><p>Ãœyelik ve destek Ã§aÄŸrÄ±larÄ±nÄ± yÃ¶net.</p></div></div>
          <div className={styles.headerForm}>
            <label className={styles.headerCheck}><input type="checkbox" checked={settings.accountEnabled} onChange={(event) => setSettings({ ...settings, accountEnabled: event.target.checked })} /> Ãœye GiriÅŸi dÃ¼ÄŸmesini gÃ¶ster</label>
            <label>DÃ¼ÄŸme yazÄ±sÄ±<input value={settings.accountLabel} onChange={(event) => setSettings({ ...settings, accountLabel: event.target.value })} /></label>
            <label>BaÄŸlantÄ±<input value={settings.accountHref} onChange={(event) => setSettings({ ...settings, accountHref: event.target.value })} /></label>
            <label className={styles.headerCheck}><input type="checkbox" checked={settings.supportEnabled} onChange={(event) => setSettings({ ...settings, supportEnabled: event.target.checked })} /> Destek Ol dÃ¼ÄŸmesini gÃ¶ster</label>
            <label>DÃ¼ÄŸme yazÄ±sÄ±<input value={settings.supportLabel} onChange={(event) => setSettings({ ...settings, supportLabel: event.target.value })} /></label>
            <label>BaÄŸlantÄ±<input value={settings.supportHref} onChange={(event) => setSettings({ ...settings, supportHref: event.target.value })} /></label>
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>Ä°letiÅŸim Ã¼st ÅŸeridi</h2><p>Header Ã¼zerinde ince iletiÅŸim alanÄ±.</p></div></div>
          <div className={styles.headerForm}>
            <label className={styles.headerCheck}><input type="checkbox" checked={settings.topBarEnabled} onChange={(event) => setSettings({ ...settings, topBarEnabled: event.target.checked })} /> Ãœst iletiÅŸim ÅŸeridini gÃ¶ster</label>
            <label>Telefon<input value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} placeholder="+90 5xx xxx xx xx" /></label>
            <label>E-posta<input type="email" value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} /></label>
          </div>
        </section>
      </div>
    </>
  );
}

function SliderManager({ slides, setSlides, showToast }: { slides: Slide[]; setSlides: (slides: Slide[]) => void; showToast: (message: string) => void }) {
  const [editing, setEditing] = useState<Slide | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);
  const [images, setImages] = useState<SliderImage[]>([]);

  async function loadImages() {
    const response = await fetch(`/api/admin/slides/images?t=${Date.now()}`, { cache: "no-store" });
    const result = await response.json();
    if (response.ok) setImages(result.images || []);
  }

  useEffect(() => {
    fetch(`/api/admin/slides/images?t=${Date.now()}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => setImages(result.images || []))
      .catch(() => undefined);
  }, []);

  async function persist(nextSlides: Slide[]) {
    setSaving(true);
    const response = await fetch("/api/admin/slides", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slides: nextSlides }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      showToast(result.error || "Slider ayarlarÄ± kaydedilemedi.");
      return false;
    }
    setSlides(result.slides);
    showToast("Slider ayarlarÄ± canlÄ± siteye kaydedildi.");
    return true;
  }

  async function saveSlide(formData: FormData) {
    if (!editing) return;
    const updated: Slide = {
      ...editing,
      eyebrow: "",
      title: "",
      highlight: "",
      description: "",
      desktopImage: String(formData.get("desktopImage") || ""),
      mobileImage: String(formData.get("mobileImage") || ""),
      active: formData.get("active") === "on",
    };
    const exists = slides.some((slide) => slide.id === updated.id);
    const next = exists ? slides.map((slide) => slide.id === updated.id ? updated : slide) : [...slides, updated];
    if (await persist(next)) setEditing(null);
  }

  function newSlide() {
    setEditing({
      id: crypto.randomUUID(),
      eyebrow: "",
      title: "",
      highlight: "",
      description: "",
      desktopImage: "",
      mobileImage: "",
      active: true,
    });
  }

  async function uploadImage(file: File, kind: "desktop" | "mobile") {
    setUploading(kind);
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/admin/slides/upload", { method: "POST", body: form });
    const result = await response.json();
    setUploading(null);
    if (!response.ok) {
      showToast(result.error || "GÃ¶rsel yÃ¼klenemedi.");
      return;
    }
    setEditing((current) => current ? { ...current, [kind === "desktop" ? "desktopImage" : "mobileImage"]: result.url } : current);
    await loadImages();
    showToast("GÃ¶rsel baÅŸarÄ±yla yÃ¼klendi.");
  }

  async function deleteImage(image: SliderImage) {
    const response = await fetch("/api/admin/slides/images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: image.path }),
    });
    const result = await response.json();
    if (!response.ok) {
      showToast(result.error || "GÃ¶rsel silinemedi.");
      return;
    }
    setImages((current) => current.filter((item) => item.path !== image.path));
    showToast("GÃ¶rsel kalÄ±cÄ± olarak silindi.");
  }

  return (
    <>
      <div className={styles.pageHeading}>
        <div><p>Ana sayfa</p><h1>Slider YÃ¶netimi</h1><span>MasaÃ¼stÃ¼ ve mobil ziyaretÃ§iler iÃ§in ayrÄ± gÃ¶rsellerle profesyonel duyurular hazÄ±rlayÄ±n.</span></div>
        <button className={styles.primaryButton} type="button" onClick={newSlide}>ï¼‹ Yeni Slayt</button>
      </div>
      <div className={styles.sliderInfo}><span>i</span><p><strong>Ä°ki ayrÄ± gÃ¶rÃ¼nÃ¼m kullanÄ±lÄ±r</strong>MasaÃ¼stÃ¼ ve mobil gÃ¶rsellerini ayrÄ± ayrÄ± yÃ¼kleyin. BÃ¶ylece kÄ±rpÄ±lma olmadan her ekranda profesyonel sonuÃ§ alÄ±nÄ±r.</p></div>
      <section className={styles.slideManager}>
        {slides.length === 0 && <div className={styles.listEmpty}><span>â–£</span><strong>HenÃ¼z slayt yok</strong><p>Ä°lk slaytÄ± ekleyerek ana sayfanÄ±zÄ± canlandÄ±rÄ±n.</p></div>}
        {slides.map((slide, index) => (
          <article className={styles.slideCard} key={slide.id}>
            <div className={styles.slidePreview}>
              {slide.desktopImage ? <img src={slide.desktopImage} alt="" /> : <span>GÃ¶rsel bekleniyor</span>}
              <b>0{index + 1}</b>
            </div>
            <div className={styles.slideCardBody}>
              <div><span className={slide.active ? styles.liveStatus : styles.draftStatus}>â— {slide.active ? "YayÄ±nda" : "Gizli"}</span><small>MasaÃ¼stÃ¼ + mobil gÃ¶rsel</small></div>
              <button type="button" onClick={() => setEditing(slide)}>DÃ¼zenle</button>
              <button type="button" onClick={() => persist(slides.filter((item) => item.id !== slide.id))}>Sil</button>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.mediaLibrary}>
        <div className={styles.mediaLibraryHeading}>
          <div><span>MEDYA YÃ–NETÄ°MÄ°</span><h2>GÃ¶rsel KÃ¼tÃ¼phanesi</h2><p>Slider iÃ§in yÃ¼klediÄŸiniz bÃ¼tÃ¼n gÃ¶rselleri burada gÃ¶rebilir ve kullanÄ±lmayanlarÄ± silebilirsiniz.</p></div>
          <b>{images.length} gÃ¶rsel</b>
        </div>
        {images.length === 0 ? (
          <div className={styles.mediaEmpty}>HenÃ¼z bilgisayardan yÃ¼klenmiÅŸ slider gÃ¶rseli yok.</div>
        ) : (
          <div className={styles.mediaGrid}>
            {images.map((image) => {
              const inUse = slides.some((slide) => slide.desktopImage === image.url || slide.mobileImage === image.url);
              return (
                <article key={image.path}>
                  <img src={image.url} alt="YÃ¼klenmiÅŸ slider gÃ¶rseli" />
                  <div>
                    <span>{image.path.split("/").pop()}</span>
                    <small>{image.size ? `${(image.size / 1024 / 1024).toFixed(2)} MB` : "Slider gÃ¶rseli"}</small>
                  </div>
                  {inUse
                    ? <b>KullanÄ±mda</b>
                    : <button type="button" onClick={() => deleteImage(image)}>Sil</button>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editing && (
        <div className={styles.modalBackdrop}>
          <form className={`${styles.modal} ${styles.slideModal}`} action={saveSlide}>
            <button className={styles.modalClose} type="button" onClick={() => setEditing(null)}>Ã—</button>
            <span>SLIDER AYARLARI</span><h2>SlaytÄ± DÃ¼zenle</h2><p>MasaÃ¼stÃ¼ ve mobil gÃ¶rsellerini ayrÄ± ayrÄ± dÃ¼zenleyin.</p>
            <label className={styles.checkLabel}><input name="active" type="checkbox" defaultChecked={editing.active} /> Bu slayt yayÄ±nda</label>
            <section className={styles.desktopUploadSection}>
              <div><span>MASAÃœSTÃœ SLIDER</span><strong>1920 Ã— 900 piksel</strong><small>Yatay gÃ¶rsel Â· Ã–nerilen oran 16:7,5 Â· En fazla 5 MB</small></div>
              <label className={styles.uploadField}>MasaÃ¼stÃ¼ gÃ¶rseli
                <span><input name="desktopImage" type="url" value={editing.desktopImage} onChange={(event) => setEditing({ ...editing, desktopImage: event.target.value })} placeholder="GÃ¶rsel adresi veya yÃ¼kleme" required /><b>{uploading === "desktop" ? "YÃ¼kleniyor..." : "Bilgisayardan SeÃ§"}<input type="file" accept="image/*" disabled={Boolean(uploading)} onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0], "desktop")} /></b></span>
              </label>
              {editing.desktopImage && <div className={styles.desktopImagePreview}><img src={editing.desktopImage} alt="MasaÃ¼stÃ¼ slider Ã¶nizlemesi" /></div>}
            </section>
            <section className={styles.mobileUploadSection}>
              <div className={styles.mobileUploadCopy}><span>MOBÄ°L SLIDER â€” AYRI GÃ–RSEL</span><strong>900 Ã— 1050 piksel</strong><small>Dikey gÃ¶rsel Â· Ã–nerilen oran 6:7 Â· Minimum 720Ã—840 Â· En fazla 5 MB</small><p>Ã–nemli kiÅŸi veya nesneyi gÃ¶rselin orta bÃ¶lÃ¼mÃ¼nde tutun. Buton alt tarafta yer alacaÄŸÄ± iÃ§in gÃ¶rselin alt kÄ±smÄ±nÄ± sade bÄ±rakÄ±n.</p></div>
              <div className={styles.mobileUploadGrid}>
                <label className={styles.uploadField}>Mobil gÃ¶rseli
                  <span><input name="mobileImage" type="url" value={editing.mobileImage} onChange={(event) => setEditing({ ...editing, mobileImage: event.target.value })} placeholder="Mobil gÃ¶rsel adresi veya yÃ¼kleme" required /><b>{uploading === "mobile" ? "YÃ¼kleniyor..." : "Mobil GÃ¶rsel SeÃ§"}<input type="file" accept="image/*" disabled={Boolean(uploading)} onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0], "mobile")} /></b></span>
                </label>
                <div className={styles.phonePreview}>{editing.mobileImage ? <img src={editing.mobileImage} alt="Mobil slider Ã¶nizlemesi" /> : <span>Mobil<br />Ã¶nizleme</span>}<i /></div>
              </div>
            </section>
            <div className={styles.modalActions}><button type="button" onClick={() => setEditing(null)}>VazgeÃ§</button><button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet ve YayÄ±nla"}</button></div>
          </form>
        </div>
      )}
    </>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function Placeholder({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <>
      <div className={styles.pageHeading}><div><p>YÃ¶netim</p><h1>{title}</h1><span>{text}</span></div></div>
      <section className={`${styles.card} ${styles.placeholder}`}>
        <div>{icon}</div><h2>{title}</h2><p>Bu bÃ¶lÃ¼m gÃ¼venli veritabanÄ±na baÄŸlÄ±dÄ±r. Yeni kayÄ±tlar eklendikÃ§e burada gÃ¶rÃ¼ntÃ¼lenecek.</p><span>BaÄŸlantÄ± aktif</span>
      </section>
    </>
  );
}
