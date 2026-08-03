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
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {active === "applications" && (
            <>
              <div className={styles.pageHeading}><div><p>Ä°letiÅŸim merkezi</p><h1>BaÅŸvurular</h1><span>GÃ¶nÃ¼llÃ¼ baÅŸvurularÄ±nÄ±, yardÄ±m taleplerini ve mesajlarÄ± takip et.</span></div></div>
              <section className={styles.card}><ApplicationTable applications={applications} detailed /></section>
            </>
          )}

          {active === "members" && <Placeholder title="Ãœyeler" text="KayÄ±tlÄ± destekÃ§ileri, yÃ¶neticileri ve kullanÄ±cÄ± yetkilerini buradan yÃ¶neteceksin." icon="â—" />}
          {active === "content" && <Placeholder title="Ä°Ã§erik YÃ¶netimi" text="Ana sayfa metinleri, duyurular, iyilik hikÃ¢yeleri ve sÄ±k sorulan sorular burada dÃ¼zenlenecek." icon="â–¤" />}

          {active === "settings" && (
            <>
              <div className={styles.pageHeading}><div><p>Sistem</p><h1>Site AyarlarÄ±</h1><span>Sitenin genel durumunu ve iletiÅŸim bilgilerini yÃ¶net.</span></div><button className={styles.primaryButton} type="button" onClick={() => showToast("Ayarlar gÃ¼venli veritabanÄ±na kaydedilecek ÅŸekilde hazÄ±rlanÄ±yor.")}>DeÄŸiÅŸiklikleri Kaydet</button></div>
              <div className={styles.settingsGrid}>
                <section className={styles.card}>
                  <div className={styles.cardHeader}><div><h2>Genel bilgiler</h2><p>Sitede gÃ¶rÃ¼ntÃ¼lenecek temel bilgiler</p></div></div>
                  <div className={styles.formGrid}>
                    <label>Site adÄ±<input defaultValue="Ä°yilik Adresim" /></label>
                    <label>E-posta<input defaultValue="merhaba@iyilikadresim.org" /></label>
                    <label className={styles.fullField}>KÄ±sa aÃ§Ä±klama<textarea defaultValue="Ä°yiliÄŸin gÃ¼venilir ve ÅŸeffaf adresi." /></label>
                  </div>
                </section>
                <section className={styles.card}>
                  <div className={styles.cardHeader}><div><h2>YayÄ±n durumu</h2><p>ZiyaretÃ§ilerin siteye eriÅŸimini yÃ¶net</p></div></div>
                  <div className={styles.publishSetting}><span className={siteLive ? styles.onlineDot : styles.offlineDot} /><p><strong>{siteLive ? "Site yayÄ±nda" : "BakÄ±m modu"}</strong><small>{siteLive ? "ZiyaretÃ§iler siteye eriÅŸebilir." : "Site yalnÄ±zca yÃ¶neticilere aÃ§Ä±k."}</small></p><button className={siteLive ? styles.switchOn : styles.switchOff} type="button" onClick={() => setSiteLive(!siteLive)}><span /></button></div>
                </section>
              </div>
            </>
          )}
        </div>
      </section>

      {campaignModal && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setCampaignModal(false)}>
          <form className={styles.modal} onSubmit={(event) => { event.preventDefault(); addCampaign(new FormData(event.currentTarget)); }} onMouseDown={(event) => event.stopPropagation()}>
            <button className={styles.modalClose} type="button" aria-label="Pencereyi kapat" onClick={() => setCampaignModal(false)}>Ã—</button>
            <span>Yeni kayÄ±t</span><h2>Kampanya oluÅŸtur</h2><p>Kampanya Ã¶nce taslak olarak kaydedilecek.</p>
            <label>Kampanya adÄ±<input name="title" required placeholder="Ã–rn. EÄŸitim Destek Paketi" /></label>
            <div className={styles.modalRow}>
              <label>Kategori<select name="category"><option>EÄŸitim</option><option>Temiz Su</option><option>GÄ±da</option><option>SaÄŸlÄ±k</option><option>Genel</option></select></label>
              <label>Hedef tutar<input name="target" type="number" min="0" placeholder="100000" /></label>
            </div>
            <div className={styles.modalActions}><button type="button" onClick={() => setCampaignModal(false)}>VazgeÃ§</button><button type="submit">Taslak OluÅŸtur</button></div>
          </form>
        </div>
      )}

      {toast && <div className={styles.toast}><span>âœ“</span>{toast}</div>}
    </main>
  );
}

function ApplicationTable({ applications, detailed = false }: { applications: Application[]; detailed?: boolean }) {
  const typeLabels = { volunteer: "GÃ¶nÃ¼llÃ¼ baÅŸvurusu", aid_request: "YardÄ±m talebi", contact: "Ä°letiÅŸim mesajÄ±" };
  const statusLabels = { new: "Yeni", reviewing: "Ä°nceleniyor", answered: "YanÄ±tlandÄ±", closed: "KapatÄ±ldÄ±" };

  return (
    <div className={styles.tableWrap}>
      <table>
        <thead><tr><th>BaÅŸvuran</th><th>BaÅŸvuru tÃ¼rÃ¼</th><th>Tarih</th><th>Durum</th>{detailed && <th>Ä°ÅŸlem</th>}</tr></thead>
        <tbody>
          {applications.length === 0 && <tr><td colSpan={detailed ? 5 : 4} className={styles.emptyCell}>HenÃ¼z baÅŸvuru bulunmuyor.</td></tr>}
          {applications.map((application) => (
            <tr key={application.id}>
              <td><span className={styles.avatar}>{application.name.split(" ").map((part) => part[0]).join("")}</span><strong>{application.name}</strong></td>
              <td>{typeLabels[application.type]}</td><td>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(application.created_at))}</td>
              <td><span className={`${styles.status} ${application.status === "new" ? styles.statusNew : application.status === "reviewing" ? styles.statusReview : styles.statusDone}`}>â— {statusLabels[application.status]}</span></td>
              {detailed && <td><button className={styles.tableButton} type="button">Ä°ncele</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageManager({ showToast, embedded = false, onPagesChange }: { showToast: (message: string) => void; embedded?: boolean; onPagesChange?: (pages: ManagedPage[]) => void }) {
  const [pages, setPages] = useState<ManagedPage[]>(defaultManagedPages);
  const [loadingPages, setLoadingPages] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);

  useEffect(() => {
    onPagesChange?.(pages);
  }, [pages, onPagesChange]);

  useEffect(() => {
    fetch(`/api/admin/pages?t=${Date.now()}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setPages(result.pages);
      })
      .catch(() => showToast("Sayfalar yÃ¼klenemedi."))
      .finally(() => setLoadingPages(false));
  }, []);

  function updatePage(id: string, patch: Partial<ManagedPage>) {
    setPages((current) => current.map((page) => {
      if (patch.isHome === true && page.id !== id) return { ...page, isHome: false };
      return page.id === id ? { ...page, ...patch, ...(patch.isHome === true ? { menuType: "direct" as const, parentId: null } : {}) } : page;
    }));
  }

  function moveTopLevelPage(id: string, direction: -1 | 1) {
    setPages((current) => {
      const topLevel = current.filter((page) => !page.parentId);
      const index = topLevel.findIndex((page) => page.id === id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= topLevel.length) return current;
      const reordered = [...topLevel];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered.flatMap((page) => [page, ...current.filter((child) => child.parentId === page.id)]);
    });
  }

  function addTopLevelPage() {
    const title = "Yeni Sayfa";
    const id = crypto.randomUUID();
    setPages((current) => [...current, {
      id,
      title,
      slug: `${normalizeSlug(title)}-${current.filter((page) => !page.parentId).length + 1}`,
      kind: "standard",
      menuType: "direct",
      parentId: null,
      enabled: true,
      locked: false,
      isHome: false,
    }]);
    setExpandedPageId(id);
  }

  function addChildPage(parentId: string) {
    const title = "Yeni Alt Sayfa";
    setPages((current) => [...current, {
      id: crypto.randomUUID(),
      title,
      slug: `${normalizeSlug(title)}-${current.filter((page) => page.parentId === parentId).length + 1}`,
      kind: "project",
      menuType: "direct",
      parentId,
      enabled: true,
      locked: false,
      isHome: false,
    }]);
  }

  async function savePages() {
    setSaving(true);
    const response = await fetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pages }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return showToast(result.error || "Sayfalar kaydedilemedi.");
    setPages(result.pages);
    showToast("Sayfalar kaydedildi ve yayÄ±nlandÄ±.");
  }

  const mainPages = pages.filter((page) => !page.parentId);

  if (loadingPages) return <div className={styles.realEmpty}><span>â—Œ</span><strong>Sayfalar yÃ¼kleniyor</strong></div>;

  return (
    <>
      {embedded ? (
        <div className={styles.integratedPagesHeading}>
          <div><p>HEADER MENÃœ SAYFALARI</p><h2>Sayfalar ve AÃ§Ä±lÄ±r MenÃ¼ler</h2><span>CanlÄ± Ã¶nizlemede gÃ¶rÃ¼nen bÃ¼tÃ¼n web menÃ¼lerini buradan yÃ¶net.</span></div>
          <div className={styles.pageHeadingActions}><button type="button" onClick={addTopLevelPage}>ï¼‹ Yeni Sayfa OluÅŸtur</button><button className={styles.primaryButton} type="button" disabled={saving} onClick={savePages}>{saving ? "Kaydediliyor..." : "SayfalarÄ± Kaydet"}</button></div>
        </div>
      ) : (
        <>
          <div className={styles.pageHeading}>
            <div><p>WEB SÄ°TESÄ°</p><h1>Sayfa YÃ¶netimi</h1><span>Her menÃ¼yÃ¼ doÄŸrudan sayfa veya alt sayfalÄ± aÃ§Ä±lÄ±r menÃ¼ olarak dÃ¼zenle.</span></div>
            <div className={styles.pageHeadingActions}><button type="button" onClick={addTopLevelPage}>ï¼‹ Yeni Sayfa OluÅŸtur</button><button className={styles.primaryButton} type="button" disabled={saving} onClick={savePages}>{saving ? "Kaydediliyor..." : "Kaydet ve YayÄ±nla"}</button></div>
          </div>
          <div className={styles.pageStructureInfo}>
            <div><i>â–¤</i><span><strong>GerÃ§ek sayfa yapÄ±sÄ± hazÄ±r</strong>Her sayfada ÅŸimdilik yalnÄ±zca header, boÅŸ iÃ§erik alanÄ± ve footer bulunur.</span></div>
            <a href="/biz-kimiz" target="_blank">Ã–rnek sayfayÄ± aÃ§ â†—</a>
          </div>
        </>
      )}

      <div className={styles.menuTree}>
        {mainPages.map((page, pageIndex) => {
          const children = pages.filter((item) => item.parentId === page.id);
          return (
            <section className={`${styles.card} ${styles.menuTreeGroup}`} key={page.id}>
              <div className={styles.pageOrderControls} aria-label={`${page.title} sÄ±ralamasÄ±`}>
                <button type="button" disabled={pageIndex === 0} onClick={() => moveTopLevelPage(page.id, -1)} title="YukarÄ± taÅŸÄ±">â†‘</button>
                <span>{pageIndex + 1}</span>
                <button type="button" disabled={pageIndex === mainPages.length - 1} onClick={() => moveTopLevelPage(page.id, 1)} title="AÅŸaÄŸÄ± taÅŸÄ±">â†“</button>
              </div>
              <button className={`${styles.pageAccordionRow} ${expandedPageId === page.id ? styles.pageAccordionRowOpen : ""}`} type="button" aria-expanded={expandedPageId === page.id} onClick={() => setExpandedPageId((current) => current === page.id ? null : page.id)}>
                <span className={styles.pageTypeIcon}>{page.menuType === "dropdown" ? "âŒ„" : "â–¤"}</span>
                <span><strong>{page.title}</strong><small>{page.isHome ? "/" : `/${page.slug}`}</small></span>
                <em className={page.enabled ? styles.pagePublished : styles.pageHidden}>{page.enabled ? "Header'da gÃ¶rÃ¼nÃ¼r" : "Gizli"}</em>
                <b>{page.menuType === "dropdown" ? `AÃ§Ä±lÄ±r menÃ¼ Â· ${children.length} alt sayfa` : "DoÄŸrudan sayfa"}</b>
                <i>{expandedPageId === page.id ? "âˆ’" : "+"}</i>
              </button>

              {expandedPageId === page.id && (
                <div className={styles.pageAccordionContent}>
                  <div className={styles.menuTreeHeader}>
                    <span className={styles.pageTypeIcon}>{page.menuType === "dropdown" ? "âŒ„" : "â–¤"}</span>
                    <label>Header menÃ¼ adÄ±<input value={page.title} onChange={(event) => updatePage(page.id, { title: event.target.value })} /></label>
                    <label>Sayfa adresi<span className={styles.slugInput}><b>/</b><input value={page.isHome ? "" : page.slug} placeholder={page.isHome ? "Ana sayfa" : undefined} disabled={page.menuType === "dropdown" || page.isHome} onChange={(event) => updatePage(page.id, { slug: normalizeSlug(event.target.value) })} /></span></label>
                    <button className={`${styles.submenuSwitch} ${page.menuType === "dropdown" ? styles.submenuSwitchOn : ""}`} disabled={page.isHome} type="button" role="switch" aria-checked={page.menuType === "dropdown"} onClick={() => updatePage(page.id, { menuType: page.menuType === "dropdown" ? "direct" : "dropdown" })}><i /><span><strong>Alt sayfalar</strong><small>{page.isHome ? "Ana sayfada kullanÄ±lamaz" : page.menuType === "dropdown" ? "AÃ§Ä±k Â· AÃ§Ä±lÄ±r menÃ¼" : "KapalÄ± Â· DoÄŸrudan sayfa"}</small></span></button>
                    <label className={styles.tinyCheck}><input type="checkbox" checked={page.isHome} onChange={(event) => updatePage(page.id, { isHome: event.target.checked })} /> Ana sayfa yap (/)</label>
                    <label className={styles.tinyCheck}><input type="checkbox" checked={page.enabled} onChange={(event) => updatePage(page.id, { enabled: event.target.checked })} /> Header&apos;da gÃ¶ster</label>
                    <div className={styles.menuTreeActions}>{page.menuType === "direct" && <a href={managedPageHref(page)} target="_blank">AÃ§ â†—</a>}{!page.locked && <button type="button" onClick={() => setPages((current) => current.filter((item) => item.id !== page.id && item.parentId !== page.id))}>Sil</button>}</div>
                  </div>

                  <div className={`${styles.childPages} ${page.menuType === "dropdown" ? styles.childPagesActive : styles.childPagesInactive}`}>
                    <div><strong>Alt sayfalar</strong><span>{page.menuType === "dropdown" ? "AÃ§Ä±k: Header'da Ã¼zerine gelince aÅŸaÄŸÄ±daki sayfalar aÃ§Ä±lÄ±r." : "KapalÄ±: Alt sayfalar saklanÄ±r, ana sayfa doÄŸrudan aÃ§Ä±lÄ±r."}</span><button type="button" onClick={() => addChildPage(page.id)}>ï¼‹ Alt Sayfa Ekle</button></div>
                    {children.length === 0 && <p>HenÃ¼z alt sayfa yok. â€œAlt Sayfa Ekleâ€ dÃ¼ÄŸmesini kullanabilirsin.</p>}
                    {children.map((child) => (
                      <article key={child.id}>
                        <span>â†³</span>
                        <label>Alt sayfa adÄ±<input value={child.title} onChange={(event) => updatePage(child.id, { title: event.target.value, slug: normalizeSlug(event.target.value) })} /></label>
                        <label>Sayfa adresi<span className={styles.slugInput}><b>/</b><input value={child.slug} onChange={(event) => updatePage(child.id, { slug: normalizeSlug(event.target.value) })} /></span></label>
                        <label className={styles.tinyCheck}><input type="checkbox" checked={child.enabled} onChange={(event) => updatePage(child.id, { enabled: event.target.checked })} /> GÃ¶ster</label>
                        <div><a href={`/${child.slug}`} target="_blank">AÃ§ â†—</a><button type="button" onClick={() => setPages((current) => current.filter((item) => item.id !== child.id))}>Sil</button></div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

function MobileMenuManager({ showToast }: { showToast: (message: string) => void }) {
  const [settings, setSettings] = useState<HeaderSettings>(defaultHeaderSettings);
  const [managedPages, setManagedPages] = useState<ManagedPage[]>(defaultManagedPages);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/header?t=${Date.now()}`, { cache: "no-store" }),
      fetch(`/api/admin/pages?t=${Date.now()}`, { cache: "no-store" }),
    ])
      .then(async ([headerResponse, pagesResponse]) => {
        const [headerResult, pagesResult] = await Promise.all([headerResponse.json(), pagesResponse.json()]);
        if (!headerResponse.ok) throw new Error(headerResult.error);
        const nextPages: ManagedPage[] = pagesResult.pages || defaultManagedPages;
        const hasRealPages = headerResult.settings.mobileMenuItems.some((item: HeaderSettings["mobileMenuItems"][number]) => item.sourcePageId);
        setManagedPages(nextPages);
        setSettings({
          ...headerResult.settings,
          mobileMenuItems: hasRealPages ? headerResult.settings.mobileMenuItems : nextPages.filter((page) => !page.parentId && page.enabled).map((page) => ({
            id: crypto.randomUUID(),
            label: page.title,
            href: page.menuType === "direct" ? managedPageHref(page) : "#",
            enabled: true,
            newTab: false,
          sourcePageId: page.id,
          mobileIcon: page.id === "projects" ? "heart" : page.id === "about" ? "building" : page.id === "stories" ? "news" : page.id === "contact" ? "phone" : "home",
          mobileIconBg: "#4f86df",
          })),
        });
      })
      .catch(() => showToast("Mobil menÃ¼ ayarlarÄ± yÃ¼klenemedi."))
      .finally(() => setLoadingMenu(false));
  }, []);

  async function save() {
    setSaving(true);
    const cleanMobileSettings = { ...settings, mobileMenuItems: settings.mobileMenuItems.filter((item) => item.sourcePageId) };
    const response = await fetch("/api/admin/header", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cleanMobileSettings) });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return showToast(result.error || "Mobil menÃ¼ kaydedilemedi.");
    setSettings(result.settings);
    showToast("Mobil menÃ¼ canlÄ± siteye kaydedildi.");
  }

  function toggleWebPage(page: ManagedPage) {
    setSettings((current) => {
      const exists = current.mobileMenuItems.some((item) => item.sourcePageId === page.id);
      return {
        ...current,
        mobileMenuItems: exists
          ? current.mobileMenuItems.filter((item) => item.sourcePageId !== page.id)
          : [...current.mobileMenuItems, { id: crypto.randomUUID(), label: page.title, href: page.menuType === "direct" ? managedPageHref(page) : "#", enabled: true, newTab: false, sourcePageId: page.id, mobileIcon: page.id === "projects" ? "heart" : page.id === "about" ? "building" : page.id === "stories" ? "news" : page.id === "contact" ? "phone" : "home", mobileIconBg: "#4f86df" }],
      };
    });
  }

  function updateMobileIcon(itemId: string, patch: Partial<HeaderSettings["mobileMenuItems"][number]>) {
    setSettings((current) => ({ ...current, mobileMenuItems: current.mobileMenuItems.map((item) => item.id === itemId ? { ...item, ...patch } : item) }));
  }

  if (loadingMenu) return <section className={`${styles.card} ${styles.placeholder}`}><div>â˜°</div><h2>Mobil menÃ¼ yÃ¼kleniyor</h2><p>GÃ¼ncel ayarlar gÃ¼venli depolama alanÄ±ndan alÄ±nÄ±yor.</p></section>;

  const visibleItems = settings.mobileMenuItems.filter((item) => item.enabled && item.sourcePageId);
  return (
    <>
      <div className={styles.pageHeading}>
        <div><p>Mobil gÃ¶rÃ¼nÃ¼m</p><h1>Mobil MenÃ¼ YÃ¶netimi</h1><span>Telefonlarda aÃ§Ä±lan profesyonel menÃ¼yÃ¼ masaÃ¼stÃ¼nden baÄŸÄ±msÄ±z olarak dÃ¼zenle.</span></div>
        <button className={styles.primaryButton} type="button" onClick={save} disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet ve YayÄ±nla"}</button>
      </div>
      <div className={styles.mobileMenuWorkspace}>
        <aside className={styles.phoneMenuPreview}>
          <div className={styles.phoneSpeaker} />
          <div className={styles.phoneScreen} style={{ background: settings.mobileMenuBackgroundColor, color: settings.mobileMenuTextColor }}>
            <header><strong>MEVCUT HEADER</strong><b>Ã—</b></header>
            <nav>
              {visibleItems.map((item) => <span key={item.id} style={{ fontSize: Math.min(18, settings.mobileMenuFontSize * .62), fontWeight: settings.mobileMenuFontWeight }}><small className={styles.phoneIconPreview} style={{ background: item.mobileIconBg || "#4f86df" }}>{mobileIconOptions.find((icon) => icon[0] === item.mobileIcon)?.[1] || "âŒ‚"}</small>{managedPages.find((page) => page.id === item.sourcePageId)?.title || item.label}<b>â€º</b></span>)}
            </nav>
            <div className={styles.phoneMenuButtons}>{settings.mobileMenuShowAccount && <span>{settings.accountLabel}</span>}{settings.mobileMenuShowSupport && <b style={{ background: settings.mobileMenuAccentColor }}>{settings.supportLabel}</b>}</div>
            <footer><p>{settings.mobileMenuDescription}</p>{settings.mobileMenuShowContact && <small>{settings.phone || settings.email || "Ä°letiÅŸim bilgileri"}</small>}</footer>
          </div>
        </aside>
        <div className={styles.mobileMenuControls}>
          <section className={styles.card}>
            <div className={styles.cardHeader}><div><h2>GÃ¶rÃ¼nÃ¼m ve animasyon</h2><p>MenÃ¼nÃ¼n aÃ§Ä±lÄ±ÅŸ biÃ§imini ve renklerini belirle.</p></div></div>
            <div className={styles.headerForm}>
              <label>MenÃ¼ biÃ§imi<select value={settings.mobileMenuLayout} onChange={(event) => setSettings({ ...settings, mobileMenuLayout: event.target.value as HeaderSettings["mobileMenuLayout"] })}><option value="dropdown">Header altÄ±ndan aÃ§Ä±lan liste</option><option value="drawer">SaÄŸdan aÃ§Ä±lan panel</option></select></label>
              <label>AÃ§Ä±lÄ±ÅŸ animasyonu<select value={settings.mobileMenuAnimation} onChange={(event) => setSettings({ ...settings, mobileMenuAnimation: event.target.value as HeaderSettings["mobileMenuAnimation"] })}><option value="slide">YumuÅŸak kayma</option><option value="fade">YumuÅŸak belirme</option></select></label>
              <label>Arka plan<span className={styles.colorField}><input type="color" value={settings.mobileMenuBackgroundColor} onChange={(event) => setSettings({ ...settings, mobileMenuBackgroundColor: event.target.value })} /><input value={settings.mobileMenuBackgroundColor} onChange={(event) => setSettings({ ...settings, mobileMenuBackgroundColor: event.target.value })} /></span></label>
              <label>YazÄ± rengi<span className={styles.colorField}><input type="color" value={settings.mobileMenuTextColor} onChange={(event) => setSettings({ ...settings, mobileMenuTextColor: event.target.value })} /><input value={settings.mobileMenuTextColor} onChange={(event) => setSettings({ ...settings, mobileMenuTextColor: event.target.value })} /></span></label>
              <label>Vurgu rengi<span className={styles.colorField}><input type="color" value={settings.mobileMenuAccentColor} onChange={(event) => setSettings({ ...settings, mobileMenuAccentColor: event.target.value })} /><input value={settings.mobileMenuAccentColor} onChange={(event) => setSettings({ ...settings, mobileMenuAccentColor: event.target.value })} /></span></label>
              <label>YazÄ± boyutu <b>{settings.mobileMenuFontSize} px</b><input type="range" min="18" max="40" value={settings.mobileMenuFontSize} onChange={(event) => setSettings({ ...settings, mobileMenuFontSize: Number(event.target.value) })} /></label>
              <label>YazÄ± kalÄ±nlÄ±ÄŸÄ±<select value={settings.mobileMenuFontWeight} onChange={(event) => setSettings({ ...settings, mobileMenuFontWeight: Number(event.target.value) })}><option value="400">Normal</option><option value="500">Orta</option><option value="600">YarÄ± kalÄ±n</option><option value="700">KalÄ±n</option><option value="800">Ã‡ok kalÄ±n</option><option value="900">En kalÄ±n</option></select></label>
              <label>MenÃ¼ aralÄ±ÄŸÄ± <b>{settings.mobileMenuGap} px</b><input type="range" min="0" max="25" value={settings.mobileMenuGap} onChange={(event) => setSettings({ ...settings, mobileMenuGap: Number(event.target.value) })} /></label>
            </div>
          </section>
          <section className={styles.card}><div className={styles.cardHeader}><div><h2>Sade header baÄŸlantÄ±sÄ±</h2><p>MenÃ¼ mevcut mobil header&apos;Ä±n altÄ±ndan aÃ§Ä±lÄ±r; ikinci logo veya arama alanÄ± kullanÄ±lmaz.</p></div></div><div className={styles.headerForm}><label className={styles.fullField}>MenÃ¼ alt aÃ§Ä±klamasÄ±<input value={settings.mobileMenuDescription} onChange={(event) => setSettings({ ...settings, mobileMenuDescription: event.target.value })} /></label></div></section>
        </div>
      </div>
      <section className={`${styles.card} ${styles.headerSection}`}>
        <div className={styles.cardHeader}><div><h2>Web sayfalarÄ±nÄ± mobile ekle</h2><p>Web iÃ§in oluÅŸturduÄŸun sayfalarÄ± mobil menÃ¼de baÄŸÄ±msÄ±z olarak gÃ¶ster veya gizle.</p></div></div>
        <div className={styles.mobilePagePicker}>
          {managedPages.filter((page) => !page.parentId && page.enabled).map((page) => {
            const selected = settings.mobileMenuItems.some((item) => item.sourcePageId === page.id);
            const childCount = managedPages.filter((item) => item.parentId === page.id && item.enabled).length;
            return <button className={selected ? styles.mobilePageSelected : ""} type="button" key={page.id} onClick={() => toggleWebPage(page)}><i>{selected ? "âœ“" : "+"}</i><span><strong>{page.title}</strong><small>{page.menuType === "dropdown" ? `${childCount} alt sayfalÄ± aÃ§Ä±lÄ±r menÃ¼` : "DoÄŸrudan sayfa"}</small></span><b>{selected ? "Mobilde gÃ¶steriliyor" : "Mobile ekle"}</b></button>;
          })}
        </div>
      </section>
      <section className={`${styles.card} ${styles.headerSection}`}>
        <div className={styles.cardHeader}><div><h2>Mobil menÃ¼ ikonlarÄ±</h2><p>Her sayfanÄ±n ikonunu ve ikon kutusunun arka plan rengini ayrÄ± ayrÄ± seÃ§.</p></div></div>
        <div className={styles.mobileIconEditor}>
          {visibleItems.map((item) => {
            const page = managedPages.find((managedPage) => managedPage.id === item.sourcePageId);
            return <article key={item.id}><i style={{ background: item.mobileIconBg || "#4f86df" }}>{mobileIconOptions.find((icon) => icon[0] === item.mobileIcon)?.[1] || "âŒ‚"}</i><strong>{page?.title || item.label}</strong><label>Ä°kon<select value={item.mobileIcon || "home"} onChange={(event) => updateMobileIcon(item.id, { mobileIcon: event.target.value })}>{mobileIconOptions.map(([value, glyph, label]) => <option value={value} key={value}>{glyph} {label}</option>)}</select></label><label>Arka plan<span className={styles.colorField}><input type="color" value={item.mobileIconBg || "#4f86df"} onChange={(event) => updateMobileIcon(item.id, { mobileIconBg: event.target.value })} /><input value={item.mobileIconBg || "#4f86df"} onChange={(event) => updateMobileIcon(item.id, { mobileIconBg: event.target.value })} /></span></label></article>;
          })}
        </div>
      </section>
      <div className={styles.headerSettingsGrid}>
        <section className={styles.card}><div className={styles.cardHeader}><div><h2>DÃ¼ÄŸmeler ve iletiÅŸim</h2><p>Mobil menÃ¼nÃ¼n alt bÃ¶lÃ¼mÃ¼nÃ¼ dÃ¼zenle.</p></div></div><div className={styles.headerForm}>
          <label className={styles.headerCheck}><input type="checkbox" checked={settings.mobileMenuShowAccount} onChange={(event) => setSettings({ ...settings, mobileMenuShowAccount: event.target.checked })} /> Ãœye GiriÅŸi dÃ¼ÄŸmesini gÃ¶ster</label>
          <label className={styles.headerCheck}><input type="checkbox" checked={settings.mobileMenuShowSupport} onChange={(event) => setSettings({ ...settings, mobileMenuShowSupport: event.target.checked })} /> Destek Ol dÃ¼ÄŸmesini gÃ¶ster</label>
          <label className={styles.headerCheck}><input type="checkbox" checked={settings.mobileMenuShowContact} onChange={(event) => setSettings({ ...settings, mobileMenuShowContact: event.target.checked })} /> Telefon ve e-postayÄ± gÃ¶ster</label>
        </div></section>
        <section className={styles.card}><div className={styles.cardHeader}><div><h2>Sosyal medya</h2><p>BoÅŸ bÄ±rakÄ±lan baÄŸlantÄ± gÃ¶sterilmez.</p></div></div><div className={styles.headerForm}>
          <label>Instagram<input value={settings.mobileMenuInstagram} onChange={(event) => setSettings({ ...settings, mobileMenuInstagram: event.target.value })} placeholder="https://instagram.com/..." /></label>
          <label>Facebook<input value={settings.mobileMenuFacebook} onChange={(event) => setSettings({ ...settings, mobileMenuFacebook: event.target.value })} placeholder="https://facebook.com/..." /></label>
          <label className={styles.fullField}>X / Twitter<input value={settings.mobileMenuX} onChange={(event) => setSettings({ ...settings, mobileMenuX: event.target.value })} placeholder="https://x.com/..." /></label>
        </div></section>
      </div>
    </>
  );
}

function HeaderManager({ showToast }: { showToast: (message: string) => void }) {
  const [settings, setSettings] = useState<HeaderSettings>(defaultHeaderSettings);
  const [managedPages, setManagedPages] = useState<ManagedPage[]>(defaultManagedPages);
  const [loadingHeader, setLoadingHeader] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/header?t=${Date.now()}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setSettings(result.settings);
      })
      .catch(() => showToast("Header ayarlarÄ± yÃ¼klenemedi."))
      .finally(() => setLoadingHeader(false));
  }, []);

  useEffect(() => {
    fetch(`/api/admin/pages?t=${Date.now()}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => result.pages && setManagedPages(result.pages))
      .catch(() => undefined);
  }, []);

  async function save() {
    setSaving(true);
    const response = await fetch("/api/admin/header", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      showToast(result.error || "Header ayarlarÄ± kaydedilemedi.");
      return;
    }
    setSettings(result.settings);
    showToast("Header ayarlarÄ± canlÄ± siteye kaydedildi.");
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/admin/header/upload", { method: "POST", body });
    const result = await response.json();
    setUploading(false);
    if (!response.ok) {
      showToast(result.error || "Logo yÃ¼klenemedi.");
      return;
    }
    setSettings((current) => ({ ...current, logoUrl: result.url }));
    showToast("Logo yÃ¼klendi. CanlÄ±ya almak iÃ§in ayarlarÄ± kaydet.");
  }

  if (loadingHeader) return <section className={`${styles.card} ${styles.placeholder}`}><div>â–°</div><h2>Header yÃ¼kleniyor</h2><p>GÃ¼ncel ayarlar gÃ¼venli depolama alanÄ±ndan alÄ±nÄ±yor.</p></section>;

  return (
    <>
      <div className={styles.pageHeading}>
        <div><p>Site gÃ¶rÃ¼nÃ¼mÃ¼</p><h1>Header YÃ¶netimi</h1><span>Logo, menÃ¼ler, iletiÅŸim bilgileri, dÃ¼ÄŸmeler ve header renklerini tek yerden yÃ¶net.</span></div>
        <button className={styles.primaryButton} type="button" onClick={save} disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet ve YayÄ±nla"}</button>
      </div>

      <section className={styles.headerPreviewCard}>
        <div className={styles.previewLabel}>CANLI Ã–NÄ°ZLEME</div>
        {settings.topBarEnabled && <div className={styles.headerPreviewTop} style={{ background: settings.textColor }}><span>{settings.phone || "Telefon"}</span><span>{settings.email || "E-posta"}</span></div>}
        <div className={styles.headerPreview} style={{ background: settings.backgroundColor, color: settings.textColor }}>
          <div className={styles.headerPreviewBrand}>
            {settings.logoUrl ? <img src={settings.logoUrl} alt="" /> : <b>ia</b>}
            {settings.showBrandText && <span><strong>{settings.brandName}</strong><small style={{ color: settings.accentColor }}>{settings.brandTagline}</small></span>}
          </div>
          <nav style={{ gap: settings.menuGap, fontSize: settings.menuDesktopSize, fontWeight: settings.menuFontWeight, letterSpacing: settings.menuLetterSpacing, textTransform: settings.menuTextTransform, fontFamily: settings.menuFontFamily === "serif" ? "Georgia, serif" : "Arial, sans-serif", color: settings.textColor }}>{managedPages.filter((page) => !page.parentId && page.enabled).map((page) => <span className={page.menuType === "dropdown" ? styles.previewDropdownItem : ""} key={page.id}>{page.title}{page.menuType === "dropdown" && <i>âŒ„</i>}</span>)}</nav>
          <div>{settings.accountEnabled && <span>{settings.accountLabel}</span>}{settings.supportEnabled && <b style={{ background: settings.accentColor }}>{settings.supportLabel}</b>}</div>
        </div>
      </section>

      <div className={styles.headerSettingsGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>Logo ve marka</h2><p>Ã–nerilen SVG, 360Ã—120 oranÄ±, en fazla 1 MB</p></div></div>
          <div className={styles.headerForm}>
            <label className={styles.fullField}>Logo adresi
              <span className={styles.logoUploadRow}><input value={settings.logoUrl} onChange={(event) => setSettings({ ...settings, logoUrl: event.target.value })} placeholder="Logo yÃ¼kleyin veya adres girin" /><b>{uploading ? "YÃ¼kleniyor..." : "Logo SeÃ§"}<input type="file" accept=".svg,.webp,.png,image/svg+xml,image/webp,image/png" disabled={uploading} onChange={(event) => event.target.files?.[0] && uploadLogo(event.target.files[0])} /></b></span>
            </label>
            <label>Logo aÃ§Ä±klamasÄ±<input value={settings.logoAlt} onChange={(event) => setSettings({ ...settings, logoAlt: event.target.value })} /></label>
            <label className={styles.headerCheck}><input type="checkbox" checked={settings.showBrandText} onChange={(event) => setSettings({ ...settings, showBrandText: event.target.checked })} /> Logonun yanÄ±nda marka yazÄ±sÄ±nÄ± gÃ¶ster</label>
            <label>Marka adÄ±<input value={settings.brandName} onChange={(event) => setSettings({ ...settings, brandName: event.target.value })} /></label>
            <label>Alt marka yazÄ±sÄ±<input value={settings.brandTagline} onChange={(event) => setSettings({ ...settings, brandTagline: event.target.value })} /></label>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>GÃ¶rÃ¼nÃ¼m ve renkler</h2><p>Header davranÄ±ÅŸÄ± ve kurumsal renkler</p></div></div>
          <div className={styles.headerForm}>
            <label className={styles.headerCheck}><input type="checkbox" checked={settings.sticky} onChange={(event) => setSettings({ ...settings, sticky: event.target.checked })} /> Sayfa kaydÄ±rÄ±lÄ±rken Ã¼stte sabit kalsÄ±n</label>
            <label>Arka plan rengi<span className={styles.colorField}><input type="color" value={settings.backgroundColor} onChange={(event) => setSettings({ ...settings, backgroundColor: event.target.value })} /><input value={settings.backgroundColor} onChange={(event) => setSettings({ ...settings, backgroundColor: event.target.value })} /></span></label>
            <label>YazÄ± rengi<span className={styles.colorField}><input type="color" value={settings.textColor} onChange={(event) => setSettings({ ...settings, textColor: event.target.value })} /><input value={settings.textColor} onChange={(event) => setSettings({ ...settings, textColor: event.target.value })} /></span></label>
            <label>Vurgu rengi<span className={styles.colorField}><input type="color" value={settings.accentColor} onChange={(event) => setSettings({ ...settings, accentColor: event.target.value })} /><input value={settings.accentColor} onChange={(event) => setSettings({ ...settings, accentColor: event.target.value })} /></span></label>
          </div>
        </section>
      </div>

      <section className={`${styles.card} ${styles.headerSection}`}>
        <div className={styles.cardHeader}><div><h2>MenÃ¼ tasarÄ±mÄ±</h2><p>Header menÃ¼lerinin yazÄ± tipi, boyutu, konumu ve renklerini dÃ¼zenle.</p></div></div>
        <div className={styles.menuDesignPanel}>
          <div><strong>MENÃœ TASARIMI</strong><span>MasaÃ¼stÃ¼ ve mobil yazÄ± gÃ¶rÃ¼nÃ¼mÃ¼nÃ¼ profesyonel sÄ±nÄ±rlar iÃ§inde dÃ¼zenle.</span></div>
          <label>MasaÃ¼stÃ¼ yazÄ± boyutu <b>{settings.menuDesktopSize} px</b><input type="range" min="11" max="22" value={settings.menuDesktopSize} onChange={(event) => setSettings({ ...settings, menuDesktopSize: Number(event.target.value) })} /></label>
          <label>Mobil yazÄ± boyutu <b>{settings.menuMobileSize} px</b><input type="range" min="12" max="24" value={settings.menuMobileSize} onChange={(event) => setSettings({ ...settings, menuMobileSize: Number(event.target.value) })} /></label>
          <label>YazÄ± kalÄ±nlÄ±ÄŸÄ±<select value={settings.menuFontWeight} onChange={(event) => setSettings({ ...settings, menuFontWeight: Number(event.target.value) })}><option value="400">Normal</option><option value="500">Orta</option><option value="600">YarÄ± kalÄ±n</option><option value="700">KalÄ±n</option><option value="800">Ã‡ok kalÄ±n</option><option value="900">En kalÄ±n</option></select></label>
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
