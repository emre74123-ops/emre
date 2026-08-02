
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

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

const navItems = [
  ["overview", "⌂", "Genel Bakış"],
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
  const [loading, setLoading] = useState(true);
  const [campaignModal, setCampaignModal] = useState(false);
  const [toast, setToast] = useState("");
  const [siteLive, setSiteLive] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/campaigns").then((response) => response.json()),
      fetch("/api/admin/applications").then((response) => response.json()),
    ]).then(([campaignResult, applicationResult]) => {
      setCampaigns(campaignResult.campaigns || []);
      setApplications(applicationResult.applications || []);
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
            <button className={active === id ? styles.activeNav : ""} type="button" key={id} onClick={() => selectSection(id)}>
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
                    <a href="/admin/account"><i>⚿</i><span><strong>Şifre değiştir</strong><small>Hesabının şifresini güncelle</small></span><b>›</b></a>
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

