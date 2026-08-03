"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";
import { defaultSlides } from "../../lib/slides";
import { defaultHeaderSettings, type HeaderSettings } from "../../lib/header-settings";
import { defaultManagedPages, normalizeSlug, type ManagedPage } from "../../lib/page-settings";

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
  ["overview", "⌂", "Genel Bakış"],
  ["header", "▰", "Header Yönetimi"],
  ["mobileMenu", "☰", "Mobil Menü Yönetimi"],
  ["slider", "▣", "Slider Yönetimi"],
  ["campaigns", "◇", "Kampanyalar"],
  ["applications", "◫", "Başvurular"],
  ["members", "◎", "Üyeler"],
  ["content", "▤", "İçerik Yönetimi"],
  ["settings", "⚙", "Site Ayarları"],
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
      showToast("Veriler yüklenemedi. Lütfen sayfayı yenile.");
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
          <Link className={styles.brand} href="/" aria-label="İyilik Adresim ana sayfa">
            <span className={styles.brandMark}>ia</span>
            <span><strong>İyilik</strong><small>Adresim</small></span>
          </Link>
          <button className={styles.closeMenu} type="button" onClick={() => setSidebarOpen(false)}>×</button>
        </div>

        <div className={styles.workspace}>
          <span>Çalışma alanı</span>
          <button type="button"><i>İA</i><b>İyilik Adresim</b><em>⌄</em></button>
        </div>

        <nav className={styles.nav} aria-label="Yönetim paneli menüsü">
          <span className={styles.navLabel}>Yönetim</span>
          {navItems.map(([id, icon, label]) => (
            <button className={`${active === id ? styles.activeNav : ""} ${id === "mobileMenu" ? styles.navMobileMenu : ""}`} type="button" key={id} onClick={() => selectSection(id)}>
              <i>{icon}</i><span>{label}</span>
              {id === "applications" && applications.length > 0 && <b>{applications.length}</b>}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.demoNotice}><span>✓</span><p><strong>Güvenli bağlantı</strong>Supabase veritabanı aktif.</p></div>
          <div className={styles.profile}>
            <span>EK</span><p><strong>Emre Kök</strong><small>Yönetici</small></p>
            <button
              className={styles.accountMenuButton}
              type="button"
              aria-label="Hesap menüsünü aç"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >⚙</button>
            {accountMenuOpen && (
              <>
                <button className={styles.accountMenuOverlay} type="button" aria-label="Hesap menüsünü kapat" onClick={() => setAccountMenuOpen(false)} />
                <div className={styles.accountMenu}>
                  <div className={styles.accountMenuHeader}>
                    <span>EK</span>
                    <p><strong>Emre Kök</strong><small>Güvenli yönetici oturumu</small><em>Yönetici hesabı</em></p>
                  </div>
                  <nav aria-label="Hesap işlemleri">
                    <Link href="/admin/account"><i>⚿</i><span><strong>Şifre değiştir</strong><small>Hesabının şifresini güncelle</small></span><b>›</b></Link>
                    <a href="/" target="_blank" rel="noreferrer"><i>↗</i><span><strong>Siteyi görüntüle</strong><small>Canlı siteyi yeni sekmede aç</small></span><b>›</b></a>
                  </nav>
                  <form action="/admin/logout" method="post">
                    <button type="submit"><i>↪</i><span><strong>Güvenli çıkış yap</strong><small>Yönetici oturumunu kapat</small></span></button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className={styles.mobileOverlay} aria-label="Menüyü kapat" type="button" onClick={() => setSidebarOpen(false)} />}

      <section className={styles.content}>
        <header className={styles.topbar}>
          <button className={styles.mobileMenu} type="button" aria-label="Menüyü aç" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className={styles.breadcrumb}><span>Yönetim Paneli</span><b>/</b><strong>{navItems.find((item) => item[0] === active)?.[2]}</strong></div>
          <div className={styles.topActions}>
            <Link href="/" target="_blank">Siteyi Görüntüle ↗</Link>
            <button type="button" aria-label="Bildirimler">♢<b>3</b></button>
            <span>EK</span>
          </div>
        </header>

        <div className={styles.page}>
          {active === "overview" && (
            <>
              <div className={styles.pageHeading}>
                <div><p>2 Ağustos 2026, Pazar</p><h1>Günaydın, Emre 👋</h1><span>İyilik Adresim&apos;de bugün neler olduğuna göz at.</span></div>
                <button className={styles.primaryButton} type="button" onClick={() => setCampaignModal(true)}>＋ Yeni Kampanya</button>
              </div>

              <div className={styles.demoBanner}><span>✓</span><p><strong>Veritabanı bağlantısı aktif.</strong>Bu ekrandaki kampanya ve başvuru bilgileri Supabase&apos;den gerçek zamanlı olarak yüklenir.</p></div>

              <section className={styles.stats}>
                <article><div className={styles.statIcon}>↗</div><span>Kayıtlı destek</span><strong>{formatMoney(totalRaised)}</strong><small className={styles.up}>Canlı <i>veritabanı toplamı</i></small></article>
                <article><div className={styles.statIcon}>◇</div><span>Yayındaki kampanya</span><strong>{campaigns.filter((item) => item.status === "published").length}</strong><small className={styles.up}>{campaigns.length} <i>toplam kampanya</i></small></article>
                <article><div className={styles.statIcon}>◎</div><span>Taslak kampanya</span><strong>{campaigns.filter((item) => item.status === "draft").length}</strong><small className={styles.up}>Hazırlanıyor</small></article>
                <article><div className={styles.statIcon}>◫</div><span>Bekleyen başvuru</span><strong>{applications.filter((item) => item.status === "new").length}</strong><small className={styles.warn}>{applications.length} <i>toplam başvuru</i></small></article>
              </section>

              <div className={styles.dashboardGrid}>
                <section className={styles.card}>
                  <div className={styles.cardHeader}><div><h2>Destek özeti</h2><p>Gerçek kayıtların toplamı</p></div></div>
                  <div className={styles.realEmpty}><span>↗</span><strong>{formatMoney(totalRaised)}</strong><p>{loading ? "Veriler yükleniyor..." : totalRaised > 0 ? "Kampanyalara kaydedilen toplam destek" : "Henüz destek kaydı bulunmuyor."}</p></div>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardHeader}><div><h2>Hızlı işlemler</h2><p>Sık kullanılan işlemler</p></div></div>
                  <div className={styles.quickActions}>
                    <button type="button" onClick={() => setCampaignModal(true)}><i>＋</i><span><strong>Kampanya oluştur</strong><small>Yeni bir yardım kampanyası ekle</small></span><b>›</b></button>
                    <button type="button" onClick={() => selectSection("mobileMenu")}><i>☰</i><span><strong>Mobil menüyü tasarla</strong><small>Telefona özel menü yönetimi</small></span><b>›</b></button>
                    <button type="button" onClick={() => selectSection("applications")}><i>◫</i><span><strong>Başvuruları incele</strong><small>{applications.length} kayıt bulunuyor</small></span><b>›</b></button>
                    <button type="button" onClick={() => selectSection("content")}><i>▤</i><span><strong>İçerikleri düzenle</strong><small>Ana sayfa ve duyurular</small></span><b>›</b></button>
                    <button type="button" onClick={() => selectSection("settings")}><i>⚙</i><span><strong>Site ayarları</strong><small>Genel görünüm ve bilgiler</small></span><b>›</b></button>
                  </div>
                </section>
              </div>

              <section className={`${styles.card} ${styles.recentCard}`}>
                <div className={styles.cardHeader}><div><h2>Son başvurular</h2><p>Yeni gelen mesaj ve talepler</p></div><button type="button" onClick={() => selectSection("applications")}>Tümünü Gör →</button></div>
                <ApplicationTable applications={applications} />
              </section>
            </>
          )}

          {active === "slider" && <SliderManager slides={slides} setSlides={setSlides} showToast={showToast} />}
          {active === "header" && <HeaderManager showToast={showToast} />}
          {active === "mobileMenu" && <MobileMenuManager showToast={showToast} />}

          {active === "campaigns" && (
            <>
              <div className={styles.pageHeading}><div><p>İçerik yönetimi</p><h1>Kampanyalar</h1><span>Yardım kampanyalarını oluştur, düzenle ve yayınla.</span></div><button className={styles.primaryButton} type="button" onClick={() => setCampaignModal(true)}>＋ Yeni Kampanya</button></div>
              <section className={styles.card}>
                <div className={styles.toolbar}><input aria-label="Kampanya ara" placeholder="Kampanya ara..." /><select aria-label="Durum filtresi"><option>Tüm durumlar</option><option>Yayında</option><option>Taslak</option></select></div>
                <div className={styles.campaignList}>
                  {!loading && campaigns.length === 0 && <div className={styles.listEmpty}><span>◇</span><strong>Henüz kampanya yok</strong><p>İlk gerçek kampanyanı “Yeni Kampanya” düğmesiyle oluşturabilirsin.</p></div>}
                  {campaigns.map((campaign) => (
                    <article key={campaign.id}>
                      <div className={styles.campaignThumb}>{campaign.category.slice(0, 1)}</div>
                      <div className={styles.campaignName}><strong>{campaign.title}</strong><span>{campaign.category}</span></div>
                      <div className={styles.campaignProgress}><div><span style={{ width: `${campaign.target_amount > 0 ? Math.min(100, (campaign.raised_amount / campaign.target_amount) * 100) : 0}%` }} /></div><small>{formatMoney(campaign.raised_amount)} / {formatMoney(campaign.target_amount)}</small></div>
                      <span className={campaign.status === "published" ? styles.liveStatus : styles.draftStatus}>● {campaign.status === "published" ? "Yayında" : campaign.status === "draft" ? "Taslak" : "Arşiv"}</span>
                      <button type="button" onClick={() => showToast(`${campaign.title} düzenleme ekranı yakında bağlanacak.`)}>Düzenle</button>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {active === "applications" && (
            <>
              <div className={styles.pageHeading}><div><p>İletişim merkezi</p><h1>Başvurular</h1><span>Gönüllü başvurularını, yardım taleplerini ve mesajları takip et.</span></div></div>
              <section className={styles.card}><ApplicationTable applications={applications} detailed /></section>
            </>
          )}

          {active === "members" && <Placeholder title="Üyeler" text="Kayıtlı destekçileri, yöneticileri ve kullanıcı yetkilerini buradan yöneteceksin." icon="◎" />}
          {active === "content" && <Placeholder title="İçerik Yönetimi" text="Ana sayfa metinleri, duyurular, iyilik hikâyeleri ve sık sorulan sorular burada düzenlenecek." icon="▤" />}

          {active === "settings" && (
            <>
              <div className={styles.pageHeading}><div><p>Sistem</p><h1>Site Ayarları</h1><span>Sitenin genel durumunu ve iletişim bilgilerini yönet.</span></div><button className={styles.primaryButton} type="button" onClick={() => showToast("Ayarlar güvenli veritabanına kaydedilecek şekilde hazırlanıyor.")}>Değişiklikleri Kaydet</button></div>
              <div className={styles.settingsGrid}>
                <section className={styles.card}>
                  <div className={styles.cardHeader}><div><h2>Genel bilgiler</h2><p>Sitede görüntülenecek temel bilgiler</p></div></div>
                  <div className={styles.formGrid}>
                    <label>Site adı<input defaultValue="İyilik Adresim" /></label>
                    <label>E-posta<input defaultValue="merhaba@iyilikadresim.org" /></label>
                    <label className={styles.fullField}>Kısa açıklama<textarea defaultValue="İyiliğin güvenilir ve şeffaf adresi." /></label>
                  </div>
                </section>
                <section className={styles.card}>
                  <div className={styles.cardHeader}><div><h2>Yayın durumu</h2><p>Ziyaretçilerin siteye erişimini yönet</p></div></div>
                  <div className={styles.publishSetting}><span className={siteLive ? styles.onlineDot : styles.offlineDot} /><p><strong>{siteLive ? "Site yayında" : "Bakım modu"}</strong><small>{siteLive ? "Ziyaretçiler siteye erişebilir." : "Site yalnızca yöneticilere açık."}</small></p><button className={siteLive ? styles.switchOn : styles.switchOff} type="button" onClick={() => setSiteLive(!siteLive)}><span /></button></div>
                </section>
              </div>
            </>
          )}
        </div>
      </section>

      {campaignModal && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setCampaignModal(false)}>
          <form className={styles.modal} onSubmit={(event) => { event.preventDefault(); addCampaign(new FormData(event.currentTarget)); }} onMouseDown={(event) => event.stopPropagation()}>
            <button className={styles.modalClose} type="button" aria-label="Pencereyi kapat" onClick={() => setCampaignModal(false)}>×</button>
            <span>Yeni kayıt</span><h2>Kampanya oluştur</h2><p>Kampanya önce taslak olarak kaydedilecek.</p>
            <label>Kampanya adı<input name="title" required placeholder="Örn. Eğitim Destek Paketi" /></label>
            <div className={styles.modalRow}>
              <label>Kategori<select name="category"><option>Eğitim</option><option>Temiz Su</option><option>Gıda</option><option>Sağlık</option><option>Genel</option></select></label>
              <label>Hedef tutar<input name="target" type="number" min="0" placeholder="100000" /></label>
            </div>
            <div className={styles.modalActions}><button type="button" onClick={() => setCampaignModal(false)}>Vazgeç</button><button type="submit">Taslak Oluştur</button></div>
          </form>
        </div>
      )}

      {toast && <div className={styles.toast}><span>✓</span>{toast}</div>}
    </main>
  );
}

function ApplicationTable({ applications, detailed = false }: { applications: Application[]; detailed?: boolean }) {
  const typeLabels = { volunteer: "Gönüllü başvurusu", aid_request: "Yardım talebi", contact: "İletişim mesajı" };
  const statusLabels = { new: "Yeni", reviewing: "İnceleniyor", answered: "Yanıtlandı", closed: "Kapatıldı" };

  return (
    <div className={styles.tableWrap}>
      <table>
        <thead><tr><th>Başvuran</th><th>Başvuru türü</th><th>Tarih</th><th>Durum</th>{detailed && <th>İşlem</th>}</tr></thead>
        <tbody>
          {applications.length === 0 && <tr><td colSpan={detailed ? 5 : 4} className={styles.emptyCell}>Henüz başvuru bulunmuyor.</td></tr>}
          {applications.map((application) => (
            <tr key={application.id}>
              <td><span className={styles.avatar}>{application.name.split(" ").map((part) => part[0]).join("")}</span><strong>{application.name}</strong></td>
              <td>{typeLabels[application.type]}</td><td>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(application.created_at))}</td>
              <td><span className={`${styles.status} ${application.status === "new" ? styles.statusNew : application.status === "reviewing" ? styles.statusReview : styles.statusDone}`}>● {statusLabels[application.status]}</span></td>
              {detailed && <td><button className={styles.tableButton} type="button">İncele</button></td>}
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
      .catch(() => showToast("Sayfalar yüklenemedi."))
      .finally(() => setLoadingPages(false));
  }, []);

  function updatePage(id: string, patch: Partial<ManagedPage>) {
    setPages((current) => current.map((page) => page.id === id ? { ...page, ...patch } : page));
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
    showToast("Sayfalar kaydedildi ve yayınlandı.");
  }

  const mainPages = pages.filter((page) => !page.parentId);

  if (loadingPages) return <div className={styles.realEmpty}><span>◌</span><strong>Sayfalar yükleniyor</strong></div>;

  return (
    <>
      {embedded ? (
        <div className={styles.integratedPagesHeading}>
          <div><p>HEADER MENÜ SAYFALARI</p><h2>Sayfalar ve Açılır Menüler</h2><span>Canlı önizlemede görünen bütün web menülerini buradan yönet.</span></div>
          <div className={styles.pageHeadingActions}><button type="button" onClick={addTopLevelPage}>＋ Yeni Sayfa Oluştur</button><button className={styles.primaryButton} type="button" disabled={saving} onClick={savePages}>{saving ? "Kaydediliyor..." : "Sayfaları Kaydet"}</button></div>
        </div>
      ) : (
        <>
          <div className={styles.pageHeading}>
            <div><p>WEB SİTESİ</p><h1>Sayfa Yönetimi</h1><span>Her menüyü doğrudan sayfa veya alt sayfalı açılır menü olarak düzenle.</span></div>
            <div className={styles.pageHeadingActions}><button type="button" onClick={addTopLevelPage}>＋ Yeni Sayfa Oluştur</button><button className={styles.primaryButton} type="button" disabled={saving} onClick={savePages}>{saving ? "Kaydediliyor..." : "Kaydet ve Yayınla"}</button></div>
          </div>
          <div className={styles.pageStructureInfo}>
            <div><i>▤</i><span><strong>Gerçek sayfa yapısı hazır</strong>Her sayfada şimdilik yalnızca header, boş içerik alanı ve footer bulunur.</span></div>
            <a href="/biz-kimiz" target="_blank">Örnek sayfayı aç ↗</a>
          </div>
        </>
      )}

      <div className={styles.menuTree}>
        {mainPages.map((page) => {
          const children = pages.filter((item) => item.parentId === page.id);
          return (
            <section className={`${styles.card} ${styles.menuTreeGroup}`} key={page.id}>
              <button className={`${styles.pageAccordionRow} ${expandedPageId === page.id ? styles.pageAccordionRowOpen : ""}`} type="button" aria-expanded={expandedPageId === page.id} onClick={() => setExpandedPageId((current) => current === page.id ? null : page.id)}>
                <span className={styles.pageTypeIcon}>{page.menuType === "dropdown" ? "⌄" : "▤"}</span>
                <span><strong>{page.title}</strong><small>/{page.slug}</small></span>
                <em className={page.enabled ? styles.pagePublished : styles.pageHidden}>{page.enabled ? "Header'da görünür" : "Gizli"}</em>
                <b>{page.menuType === "dropdown" ? `Açılır menü · ${children.length} alt sayfa` : "Doğrudan sayfa"}</b>
                <i>{expandedPageId === page.id ? "−" : "+"}</i>
              </button>

              {expandedPageId === page.id && (
                <div className={styles.pageAccordionContent}>
                  <div className={styles.menuTreeHeader}>
                    <span className={styles.pageTypeIcon}>{page.menuType === "dropdown" ? "⌄" : "▤"}</span>
                    <label>Header menü adı<input value={page.title} onChange={(event) => updatePage(page.id, { title: event.target.value })} /></label>
                    <label>Ana sayfa adresi<span className={styles.slugInput}><b>/</b><input value={page.slug} disabled={page.menuType === "dropdown"} onChange={(event) => updatePage(page.id, { slug: normalizeSlug(event.target.value) })} /></span></label>
                    <button className={`${styles.submenuSwitch} ${page.menuType === "dropdown" ? styles.submenuSwitchOn : ""}`} type="button" role="switch" aria-checked={page.menuType === "dropdown"} onClick={() => updatePage(page.id, { menuType: page.menuType === "dropdown" ? "direct" : "dropdown" })}><i /><span><strong>Alt sayfalar</strong><small>{page.menuType === "dropdown" ? "Açık · Açılır menü" : "Kapalı · Doğrudan sayfa"}</small></span></button>
                    <label className={styles.tinyCheck}><input type="checkbox" checked={page.enabled} onChange={(event) => updatePage(page.id, { enabled: event.target.checked })} /> Header&apos;da göster</label>
                    <div className={styles.menuTreeActions}>{page.menuType === "direct" && <a href={`/${page.slug}`} target="_blank">Aç ↗</a>}{!page.locked && <button type="button" onClick={() => setPages((current) => current.filter((item) => item.id !== page.id && item.parentId !== page.id))}>Sil</button>}</div>
                  </div>

                  <div className={`${styles.childPages} ${page.menuType === "dropdown" ? styles.childPagesActive : styles.childPagesInactive}`}>
                    <div><strong>Alt sayfalar</strong><span>{page.menuType === "dropdown" ? "Açık: Header'da üzerine gelince aşağıdaki sayfalar açılır." : "Kapalı: Alt sayfalar saklanır, ana sayfa doğrudan açılır."}</span><button type="button" onClick={() => addChildPage(page.id)}>＋ Alt Sayfa Ekle</button></div>
                    {children.length === 0 && <p>Henüz alt sayfa yok. “Alt Sayfa Ekle” düğmesini kullanabilirsin.</p>}
                    {children.map((child) => (
                      <article key={child.id}>
                        <span>↳</span>
                        <label>Alt sayfa adı<input value={child.title} onChange={(event) => updatePage(child.id, { title: event.target.value, slug: normalizeSlug(event.target.value) })} /></label>
                        <label>Sayfa adresi<span className={styles.slugInput}><b>/</b><input value={child.slug} onChange={(event) => updatePage(child.id, { slug: normalizeSlug(event.target.value) })} /></span></label>
                        <label className={styles.tinyCheck}><input type="checkbox" checked={child.enabled} onChange={(event) => updatePage(child.id, { enabled: event.target.checked })} /> Göster</label>
                        <div><a href={`/${child.slug}`} target="_blank">Aç ↗</a><button type="button" onClick={() => setPages((current) => current.filter((item) => item.id !== child.id))}>Sil</button></div>
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
            href: page.menuType === "direct" ? `/${page.slug}` : "#",
            enabled: true,
            newTab: false,
            sourcePageId: page.id,
          })),
        });
      })
      .catch(() => showToast("Mobil menü ayarları yüklenemedi."))
      .finally(() => setLoadingMenu(false));
  }, []);

  async function save() {
    setSaving(true);
    const cleanMobileSettings = { ...settings, mobileMenuItems: settings.mobileMenuItems.filter((item) => item.sourcePageId) };
    const response = await fetch("/api/admin/header", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cleanMobileSettings) });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return showToast(result.error || "Mobil menü kaydedilemedi.");
    setSettings(result.settings);
    showToast("Mobil menü canlı siteye kaydedildi.");
  }

  function toggleWebPage(page: ManagedPage) {
    setSettings((current) => {
      const exists = current.mobileMenuItems.some((item) => item.sourcePageId === page.id);
      return {
        ...current,
        mobileMenuItems: exists
          ? current.mobileMenuItems.filter((item) => item.sourcePageId !== page.id)
          : [...current.mobileMenuItems, { id: crypto.randomUUID(), label: page.title, href: page.menuType === "direct" ? `/${page.slug}` : "#", enabled: true, newTab: false, sourcePageId: page.id }],
      };
    });
  }

  if (loadingMenu) return <section className={`${styles.card} ${styles.placeholder}`}><div>☰</div><h2>Mobil menü yükleniyor</h2><p>Güncel ayarlar güvenli depolama alanından alınıyor.</p></section>;

  const visibleItems = settings.mobileMenuItems.filter((item) => item.enabled && item.sourcePageId);
  return (
    <>
      <div className={styles.pageHeading}>
        <div><p>Mobil görünüm</p><h1>Mobil Menü Yönetimi</h1><span>Telefonlarda açılan profesyonel menüyü masaüstünden bağımsız olarak düzenle.</span></div>
        <button className={styles.primaryButton} type="button" onClick={save} disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet ve Yayınla"}</button>
      </div>
      <div className={styles.mobileMenuWorkspace}>
        <aside className={styles.phoneMenuPreview}>
          <div className={styles.phoneSpeaker} />
          <div className={styles.phoneScreen} style={{ background: settings.mobileMenuBackgroundColor, color: settings.mobileMenuTextColor }}>
            <header><strong>MEVCUT HEADER</strong><b>×</b></header>
            <nav>
              {visibleItems.map((item, index) => <span key={item.id} style={{ fontSize: Math.min(18, settings.mobileMenuFontSize * .62), fontWeight: settings.mobileMenuFontWeight }}>{settings.mobileMenuShowNumbers && <small style={{ color: settings.mobileMenuAccentColor }}>{String(index + 1).padStart(2, "0")}</small>}{item.label}<b>›</b></span>)}
            </nav>
            <div className={styles.phoneMenuButtons}>{settings.mobileMenuShowAccount && <span>{settings.accountLabel}</span>}{settings.mobileMenuShowSupport && <b style={{ background: settings.mobileMenuAccentColor }}>{settings.supportLabel}</b>}</div>
            <footer><p>{settings.mobileMenuDescription}</p>{settings.mobileMenuShowContact && <small>{settings.phone || settings.email || "İletişim bilgileri"}</small>}</footer>
          </div>
        </aside>
        <div className={styles.mobileMenuControls}>
          <section className={styles.card}>
            <div className={styles.cardHeader}><div><h2>Görünüm ve animasyon</h2><p>Menünün açılış biçimini ve renklerini belirle.</p></div></div>
            <div className={styles.headerForm}>
              <label>Menü biçimi<select value={settings.mobileMenuLayout} onChange={(event) => setSettings({ ...settings, mobileMenuLayout: event.target.value as HeaderSettings["mobileMenuLayout"] })}><option value="dropdown">Header altından açılan liste</option><option value="drawer">Sağdan açılan panel</option></select></label>
              <label>Açılış animasyonu<select value={settings.mobileMenuAnimation} onChange={(event) => setSettings({ ...settings, mobileMenuAnimation: event.target.value as HeaderSettings["mobileMenuAnimation"] })}><option value="slide">Yumuşak kayma</option><option value="fade">Yumuşak belirme</option></select></label>
              <label>Arka plan<span className={styles.colorField}><input type="color" value={settings.mobileMenuBackgroundColor} onChange={(event) => setSettings({ ...settings, mobileMenuBackgroundColor: event.target.value })} /><input value={settings.mobileMenuBackgroundColor} onChange={(event) => setSettings({ ...settings, mobileMenuBackgroundColor: event.target.value })} /></span></label>
              <label>Yazı rengi<span className={styles.colorField}><input type="color" value={settings.mobileMenuTextColor} onChange={(event) => setSettings({ ...settings, mobileMenuTextColor: event.target.value })} /><input value={settings.mobileMenuTextColor} onChange={(event) => setSettings({ ...settings, mobileMenuTextColor: event.target.value })} /></span></label>
              <label>Vurgu rengi<span className={styles.colorField}><input type="color" value={settings.mobileMenuAccentColor} onChange={(event) => setSettings({ ...settings, mobileMenuAccentColor: event.target.value })} /><input value={settings.mobileMenuAccentColor} onChange={(event) => setSettings({ ...settings, mobileMenuAccentColor: event.target.value })} /></span></label>
              <label>Yazı boyutu <b>{settings.mobileMenuFontSize} px</b><input type="range" min="18" max="40" value={settings.mobileMenuFontSize} onChange={(event) => setSettings({ ...settings, mobileMenuFontSize: Number(event.target.value) })} /></label>
              <label>Yazı kalınlığı<select value={settings.mobileMenuFontWeight} onChange={(event) => setSettings({ ...settings, mobileMenuFontWeight: Number(event.target.value) })}><option value="400">Normal</option><option value="500">Orta</option><option value="600">Yarı kalın</option><option value="700">Kalın</option><option value="800">Çok kalın</option><option value="900">En kalın</option></select></label>
              <label>Menü aralığı <b>{settings.mobileMenuGap} px</b><input type="range" min="0" max="25" value={settings.mobileMenuGap} onChange={(event) => setSettings({ ...settings, mobileMenuGap: Number(event.target.value) })} /></label>
              <label className={styles.headerCheck}><input type="checkbox" checked={settings.mobileMenuShowNumbers} onChange={(event) => setSettings({ ...settings, mobileMenuShowNumbers: event.target.checked })} /> Menülerin yanında sıra numarası göster</label>
            </div>
          </section>
          <section className={styles.card}><div className={styles.cardHeader}><div><h2>Sade header bağlantısı</h2><p>Menü mevcut mobil header&apos;ın altından açılır; ikinci logo veya arama alanı kullanılmaz.</p></div></div><div className={styles.headerForm}><label className={styles.fullField}>Menü alt açıklaması<input value={settings.mobileMenuDescription} onChange={(event) => setSettings({ ...settings, mobileMenuDescription: event.target.value })} /></label></div></section>
        </div>
      </div>
      <section className={`${styles.card} ${styles.headerSection}`}>
        <div className={styles.cardHeader}><div><h2>Web sayfalarını mobile ekle</h2><p>Web için oluşturduğun sayfaları mobil menüde bağımsız olarak göster veya gizle.</p></div></div>
        <div className={styles.mobilePagePicker}>
          {managedPages.filter((page) => !page.parentId && page.enabled).map((page) => {
            const selected = settings.mobileMenuItems.some((item) => item.sourcePageId === page.id);
            const childCount = managedPages.filter((item) => item.parentId === page.id && item.enabled).length;
            return <button className={selected ? styles.mobilePageSelected : ""} type="button" key={page.id} onClick={() => toggleWebPage(page)}><i>{selected ? "✓" : "+"}</i><span><strong>{page.title}</strong><small>{page.menuType === "dropdown" ? `${childCount} alt sayfalı açılır menü` : "Doğrudan sayfa"}</small></span><b>{selected ? "Mobilde gösteriliyor" : "Mobile ekle"}</b></button>;
          })}
        </div>
      </section>
      <div className={styles.headerSettingsGrid}>
        <section className={styles.card}><div className={styles.cardHeader}><div><h2>Düğmeler ve iletişim</h2><p>Mobil menünün alt bölümünü düzenle.</p></div></div><div className={styles.headerForm}>
          <label className={styles.headerCheck}><input type="checkbox" checked={settings.mobileMenuShowAccount} onChange={(event) => setSettings({ ...settings, mobileMenuShowAccount: event.target.checked })} /> Üye Girişi düğmesini göster</label>
          <label className={styles.headerCheck}><input type="checkbox" checked={settings.mobileMenuShowSupport} onChange={(event) => setSettings({ ...settings, mobileMenuShowSupport: event.target.checked })} /> Destek Ol düğmesini göster</label>
          <label className={styles.headerCheck}><input type="checkbox" checked={settings.mobileMenuShowContact} onChange={(event) => setSettings({ ...settings, mobileMenuShowContact: event.target.checked })} /> Telefon ve e-postayı göster</label>
        </div></section>
        <section className={styles.card}><div className={styles.cardHeader}><div><h2>Sosyal medya</h2><p>Boş bırakılan bağlantı gösterilmez.</p></div></div><div className={styles.headerForm}>
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
      .catch(() => showToast("Header ayarları yüklenemedi."))
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
      showToast(result.error || "Header ayarları kaydedilemedi.");
      return;
    }
    setSettings(result.settings);
    showToast("Header ayarları canlı siteye kaydedildi.");
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/admin/header/upload", { method: "POST", body });
    const result = await response.json();
    setUploading(false);
    if (!response.ok) {
      showToast(result.error || "Logo yüklenemedi.");
      return;
    }
    setSettings((current) => ({ ...current, logoUrl: result.url }));
    showToast("Logo yüklendi. Canlıya almak için ayarları kaydet.");
  }

  if (loadingHeader) return <section className={`${styles.card} ${styles.placeholder}`}><div>▰</div><h2>Header yükleniyor</h2><p>Güncel ayarlar güvenli depolama alanından alınıyor.</p></section>;

  return (
    <>
      <div className={styles.pageHeading}>
        <div><p>Site görünümü</p><h1>Header Yönetimi</h1><span>Logo, menüler, iletişim bilgileri, düğmeler ve header renklerini tek yerden yönet.</span></div>
        <button className={styles.primaryButton} type="button" onClick={save} disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet ve Yayınla"}</button>
      </div>

      <section className={styles.headerPreviewCard}>
        <div className={styles.previewLabel}>CANLI ÖNİZLEME</div>
        {settings.topBarEnabled && <div className={styles.headerPreviewTop} style={{ background: settings.textColor }}><span>{settings.phone || "Telefon"}</span><span>{settings.email || "E-posta"}</span></div>}
        <div className={styles.headerPreview} style={{ background: settings.backgroundColor, color: settings.textColor }}>
          <div className={styles.headerPreviewBrand}>
            {settings.logoUrl ? <img src={settings.logoUrl} alt="" /> : <b>ia</b>}
            {settings.showBrandText && <span><strong>{settings.brandName}</strong><small style={{ color: settings.accentColor }}>{settings.brandTagline}</small></span>}
          </div>
          <nav style={{ gap: settings.menuGap, fontSize: settings.menuDesktopSize, fontWeight: settings.menuFontWeight, letterSpacing: settings.menuLetterSpacing, textTransform: settings.menuTextTransform, fontFamily: settings.menuFontFamily === "serif" ? "Georgia, serif" : "Arial, sans-serif", color: settings.textColor }}>{managedPages.filter((page) => !page.parentId && page.enabled).map((page) => <span className={page.menuType === "dropdown" ? styles.previewDropdownItem : ""} key={page.id}>{page.title}{page.menuType === "dropdown" && <i>⌄</i>}</span>)}</nav>
          <div>{settings.accountEnabled && <span>{settings.accountLabel}</span>}{settings.supportEnabled && <b style={{ background: settings.accentColor }}>{settings.supportLabel}</b>}</div>
        </div>
      </section>

      <div className={styles.headerSettingsGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>Logo ve marka</h2><p>Önerilen SVG, 360×120 oranı, en fazla 1 MB</p></div></div>
          <div className={styles.headerForm}>
            <label className={styles.fullField}>Logo adresi
              <span className={styles.logoUploadRow}><input value={settings.logoUrl} onChange={(event) => setSettings({ ...settings, logoUrl: event.target.value })} placeholder="Logo yükleyin veya adres girin" /><b>{uploading ? "Yükleniyor..." : "Logo Seç"}<input type="file" accept=".svg,.webp,.png,image/svg+xml,image/webp,image/png" disabled={uploading} onChange={(event) => event.target.files?.[0] && uploadLogo(event.target.files[0])} /></b></span>
            </label>
            <label>Logo açıklaması<input value={settings.logoAlt} onChange={(event) => setSettings({ ...settings, logoAlt: event.target.value })} /></label>
            <label className={styles.headerCheck}><input type="checkbox" checked={settings.showBrandText} onChange={(event) => setSettings({ ...settings, showBrandText: event.target.checked })} /> Logonun yanında marka yazısını göster</label>
            <label>Marka adı<input value={settings.brandName} onChange={(event) => setSettings({ ...settings, brandName: event.target.value })} /></label>
            <label>Alt marka yazısı<input value={settings.brandTagline} onChange={(event) => setSettings({ ...settings, brandTagline: event.target.value })} /></label>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>Görünüm ve renkler</h2><p>Header davranışı ve kurumsal renkler</p></div></div>
          <div className={styles.headerForm}>
            <label className={styles.headerCheck}><input type="checkbox" checked={settings.sticky} onChange={(event) => setSettings({ ...settings, sticky: event.target.checked })} /> Sayfa kaydırılırken üstte sabit kalsın</label>
            <label>Arka plan rengi<span className={styles.colorField}><input type="color" value={settings.backgroundColor} onChange={(event) => setSettings({ ...settings, backgroundColor: event.target.value })} /><input value={settings.backgroundColor} onChange={(event) => setSettings({ ...settings, backgroundColor: event.target.value })} /></span></label>
            <label>Yazı rengi<span className={styles.colorField}><input type="color" value={settings.textColor} onChange={(event) => setSettings({ ...settings, textColor: event.target.value })} /><input value={settings.textColor} onChange={(event) => setSettings({ ...settings, textColor: event.target.value })} /></span></label>
            <label>Vurgu rengi<span className={styles.colorField}><input type="color" value={settings.accentColor} onChange={(event) => setSettings({ ...settings, accentColor: event.target.value })} /><input value={settings.accentColor} onChange={(event) => setSettings({ ...settings, accentColor: event.target.value })} /></span></label>
          </div>
        </section>
      </div>

      <section className={`${styles.card} ${styles.headerSection}`}>
        <div className={styles.cardHeader}><div><h2>Menü tasarımı</h2><p>Header menülerinin yazı tipi, boyutu, konumu ve renklerini düzenle.</p></div></div>
        <div className={styles.menuDesignPanel}>
          <div><strong>MENÜ TASARIMI</strong><span>Masaüstü ve mobil yazı görünümünü profesyonel sınırlar içinde düzenle.</span></div>
          <label>Masaüstü yazı boyutu <b>{settings.menuDesktopSize} px</b><input type="range" min="11" max="22" value={settings.menuDesktopSize} onChange={(event) => setSettings({ ...settings, menuDesktopSize: Number(event.target.value) })} /></label>
          <label>Mobil yazı boyutu <b>{settings.menuMobileSize} px</b><input type="range" min="12" max="24" value={settings.menuMobileSize} onChange={(event) => setSettings({ ...settings, menuMobileSize: Number(event.target.value) })} /></label>
          <label>Yazı kalınlığı<select value={settings.menuFontWeight} onChange={(event) => setSettings({ ...settings, menuFontWeight: Number(event.target.value) })}><option value="400">Normal</option><option value="500">Orta</option><option value="600">Yarı kalın</option><option value="700">Kalın</option><option value="800">Çok kalın</option><option value="900">En kalın</option></select></label>
          <label>Yazı tipi<select value={settings.menuFontFamily} onChange={(event) => setSettings({ ...settings, menuFontFamily: event.target.value as HeaderSettings["menuFontFamily"] })}><option value="sans">Modern / Sade</option><option value="serif">Klasik / Kurumsal</option></select></label>
          <label>Harf görünümü<select value={settings.menuTextTransform} onChange={(event) => setSettings({ ...settings, menuTextTransform: event.target.value as HeaderSettings["menuTextTransform"] })}><option value="none">Normal</option><option value="uppercase">Tümü büyük</option></select></label>
          <label>Menü konumu<select value={settings.menuAlignment} onChange={(event) => setSettings({ ...settings, menuAlignment: event.target.value as HeaderSettings["menuAlignment"] })}><option value="start">Logoya yakın</option><option value="center">Ortada</option><option value="end">Düğmelere yakın</option></select></label>
          <label>Menü aralığı <b>{settings.menuGap} px</b><input type="range" min="8" max="55" value={settings.menuGap} onChange={(event) => setSettings({ ...settings, menuGap: Number(event.target.value) })} /></label>
          <label>Harf aralığı <b>{settings.menuLetterSpacing} px</b><input type="range" min="-1" max="4" step=".25" value={settings.menuLetterSpacing} onChange={(event) => setSettings({ ...settings, menuLetterSpacing: Number(event.target.value) })} /></label>
          <label>Üzerine gelince<span className={styles.colorField}><input type="color" value={settings.menuHoverColor} onChange={(event) => setSettings({ ...settings, menuHoverColor: event.target.value })} /><input value={settings.menuHoverColor} onChange={(event) => setSettings({ ...settings, menuHoverColor: event.target.value })} /></span></label>
          <label>Aktif menü rengi<span className={styles.colorField}><input type="color" value={settings.menuActiveColor} onChange={(event) => setSettings({ ...settings, menuActiveColor: event.target.value })} /><input value={settings.menuActiveColor} onChange={(event) => setSettings({ ...settings, menuActiveColor: event.target.value })} /></span></label>
          <label>Alt çizgi rengi<span className={styles.colorField}><input type="color" value={settings.menuUnderlineColor} onChange={(event) => setSettings({ ...settings, menuUnderlineColor: event.target.value })} /><input value={settings.menuUnderlineColor} onChange={(event) => setSettings({ ...settings, menuUnderlineColor: event.target.value })} /></span></label>
          <label>Alt çizgi kalınlığı <b>{settings.menuUnderlineThickness} px</b><input type="range" min="1" max="5" value={settings.menuUnderlineThickness} onChange={(event) => setSettings({ ...settings, menuUnderlineThickness: Number(event.target.value) })} /></label>
          <label className={styles.headerCheck}><input type="checkbox" checked={settings.menuUnderlineEnabled} onChange={(event) => setSettings({ ...settings, menuUnderlineEnabled: event.target.checked })} /> Menü alt çizgi efektini göster</label>
        </div>
      </section>

      <PageManager showToast={showToast} embedded onPagesChange={setManagedPages} />

      <div className={styles.headerSettingsGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>Header düğmeleri</h2><p>Üyelik ve destek çağrılarını yönet.</p></div></div>
          <div className={styles.headerForm}>
            <label className={styles.headerCheck}><input type="checkbox" checked={settings.accountEnabled} onChange={(event) => setSettings({ ...settings, accountEnabled: event.target.checked })} /> Üye Girişi düğmesini göster</label>
            <label>Düğme yazısı<input value={settings.accountLabel} onChange={(event) => setSettings({ ...settings, accountLabel: event.target.value })} /></label>
            <label>Bağlantı<input value={settings.accountHref} onChange={(event) => setSettings({ ...settings, accountHref: event.target.value })} /></label>
            <label className={styles.headerCheck}><input type="checkbox" checked={settings.supportEnabled} onChange={(event) => setSettings({ ...settings, supportEnabled: event.target.checked })} /> Destek Ol düğmesini göster</label>
            <label>Düğme yazısı<input value={settings.supportLabel} onChange={(event) => setSettings({ ...settings, supportLabel: event.target.value })} /></label>
            <label>Bağlantı<input value={settings.supportHref} onChange={(event) => setSettings({ ...settings, supportHref: event.target.value })} /></label>
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>İletişim üst şeridi</h2><p>Header üzerinde ince iletişim alanı.</p></div></div>
          <div className={styles.headerForm}>
            <label className={styles.headerCheck}><input type="checkbox" checked={settings.topBarEnabled} onChange={(event) => setSettings({ ...settings, topBarEnabled: event.target.checked })} /> Üst iletişim şeridini göster</label>
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
      showToast(result.error || "Slider ayarları kaydedilemedi.");
      return false;
    }
    setSlides(result.slides);
    showToast("Slider ayarları canlı siteye kaydedildi.");
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
      showToast(result.error || "Görsel yüklenemedi.");
      return;
    }
    setEditing((current) => current ? { ...current, [kind === "desktop" ? "desktopImage" : "mobileImage"]: result.url } : current);
    await loadImages();
    showToast("Görsel başarıyla yüklendi.");
  }

  async function deleteImage(image: SliderImage) {
    const response = await fetch("/api/admin/slides/images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: image.path }),
    });
    const result = await response.json();
    if (!response.ok) {
      showToast(result.error || "Görsel silinemedi.");
      return;
    }
    setImages((current) => current.filter((item) => item.path !== image.path));
    showToast("Görsel kalıcı olarak silindi.");
  }

  return (
    <>
      <div className={styles.pageHeading}>
        <div><p>Ana sayfa</p><h1>Slider Yönetimi</h1><span>Masaüstü ve mobil ziyaretçiler için ayrı görsellerle profesyonel duyurular hazırlayın.</span></div>
        <button className={styles.primaryButton} type="button" onClick={newSlide}>＋ Yeni Slayt</button>
      </div>
      <div className={styles.sliderInfo}><span>i</span><p><strong>İki ayrı görünüm kullanılır</strong>Masaüstü ve mobil görsellerini ayrı ayrı yükleyin. Böylece kırpılma olmadan her ekranda profesyonel sonuç alınır.</p></div>
      <section className={styles.slideManager}>
        {slides.length === 0 && <div className={styles.listEmpty}><span>▣</span><strong>Henüz slayt yok</strong><p>İlk slaytı ekleyerek ana sayfanızı canlandırın.</p></div>}
        {slides.map((slide, index) => (
          <article className={styles.slideCard} key={slide.id}>
            <div className={styles.slidePreview}>
              {slide.desktopImage ? <img src={slide.desktopImage} alt="" /> : <span>Görsel bekleniyor</span>}
              <b>0{index + 1}</b>
            </div>
            <div className={styles.slideCardBody}>
              <div><span className={slide.active ? styles.liveStatus : styles.draftStatus}>● {slide.active ? "Yayında" : "Gizli"}</span><small>Masaüstü + mobil görsel</small></div>
              <button type="button" onClick={() => setEditing(slide)}>Düzenle</button>
              <button type="button" onClick={() => persist(slides.filter((item) => item.id !== slide.id))}>Sil</button>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.mediaLibrary}>
        <div className={styles.mediaLibraryHeading}>
          <div><span>MEDYA YÖNETİMİ</span><h2>Görsel Kütüphanesi</h2><p>Slider için yüklediğiniz bütün görselleri burada görebilir ve kullanılmayanları silebilirsiniz.</p></div>
          <b>{images.length} görsel</b>
        </div>
        {images.length === 0 ? (
          <div className={styles.mediaEmpty}>Henüz bilgisayardan yüklenmiş slider görseli yok.</div>
        ) : (
          <div className={styles.mediaGrid}>
            {images.map((image) => {
              const inUse = slides.some((slide) => slide.desktopImage === image.url || slide.mobileImage === image.url);
              return (
                <article key={image.path}>
                  <img src={image.url} alt="Yüklenmiş slider görseli" />
                  <div>
                    <span>{image.path.split("/").pop()}</span>
                    <small>{image.size ? `${(image.size / 1024 / 1024).toFixed(2)} MB` : "Slider görseli"}</small>
                  </div>
                  {inUse
                    ? <b>Kullanımda</b>
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
            <button className={styles.modalClose} type="button" onClick={() => setEditing(null)}>×</button>
            <span>SLIDER AYARLARI</span><h2>Slaytı Düzenle</h2><p>Masaüstü ve mobil görsellerini ayrı ayrı düzenleyin.</p>
            <label className={styles.checkLabel}><input name="active" type="checkbox" defaultChecked={editing.active} /> Bu slayt yayında</label>
            <section className={styles.desktopUploadSection}>
              <div><span>MASAÜSTÜ SLIDER</span><strong>1920 × 900 piksel</strong><small>Yatay görsel · Önerilen oran 16:7,5 · En fazla 5 MB</small></div>
              <label className={styles.uploadField}>Masaüstü görseli
                <span><input name="desktopImage" type="url" value={editing.desktopImage} onChange={(event) => setEditing({ ...editing, desktopImage: event.target.value })} placeholder="Görsel adresi veya yükleme" required /><b>{uploading === "desktop" ? "Yükleniyor..." : "Bilgisayardan Seç"}<input type="file" accept="image/*" disabled={Boolean(uploading)} onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0], "desktop")} /></b></span>
              </label>
              {editing.desktopImage && <div className={styles.desktopImagePreview}><img src={editing.desktopImage} alt="Masaüstü slider önizlemesi" /></div>}
            </section>
            <section className={styles.mobileUploadSection}>
              <div className={styles.mobileUploadCopy}><span>MOBİL SLIDER — AYRI GÖRSEL</span><strong>900 × 1050 piksel</strong><small>Dikey görsel · Önerilen oran 6:7 · Minimum 720×840 · En fazla 5 MB</small><p>Önemli kişi veya nesneyi görselin orta bölümünde tutun. Buton alt tarafta yer alacağı için görselin alt kısmını sade bırakın.</p></div>
              <div className={styles.mobileUploadGrid}>
                <label className={styles.uploadField}>Mobil görseli
                  <span><input name="mobileImage" type="url" value={editing.mobileImage} onChange={(event) => setEditing({ ...editing, mobileImage: event.target.value })} placeholder="Mobil görsel adresi veya yükleme" required /><b>{uploading === "mobile" ? "Yükleniyor..." : "Mobil Görsel Seç"}<input type="file" accept="image/*" disabled={Boolean(uploading)} onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0], "mobile")} /></b></span>
                </label>
                <div className={styles.phonePreview}>{editing.mobileImage ? <img src={editing.mobileImage} alt="Mobil slider önizlemesi" /> : <span>Mobil<br />önizleme</span>}<i /></div>
              </div>
            </section>
            <div className={styles.modalActions}><button type="button" onClick={() => setEditing(null)}>Vazgeç</button><button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet ve Yayınla"}</button></div>
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
      <div className={styles.pageHeading}><div><p>Yönetim</p><h1>{title}</h1><span>{text}</span></div></div>
      <section className={`${styles.card} ${styles.placeholder}`}>
        <div>{icon}</div><h2>{title}</h2><p>Bu bölüm güvenli veritabanına bağlıdır. Yeni kayıtlar eklendikçe burada görüntülenecek.</p><span>Bağlantı aktif</span>
      </section>
    </>
  );
}
