"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

type Campaign = {
  id: number;
  title: string;
  category: string;
  status: "Yayında" | "Taslak";
  progress: number;
  target: string;
  raised: string;
};

const initialCampaigns: Campaign[] = [
  { id: 1, title: "Bir Çocuğun Eğitim Yolculuğu", category: "Eğitim", status: "Yayında", progress: 42, target: "120.000 ₺", raised: "50.400 ₺" },
  { id: 2, title: "Temiz Su, Yeni Başlangıçlar", category: "Temiz Su", status: "Yayında", progress: 59, target: "250.000 ₺", raised: "147.500 ₺" },
  { id: 3, title: "Sofralara Bereket", category: "Gıda", status: "Taslak", progress: 76, target: "80.000 ₺", raised: "60.800 ₺" },
];

const applications = [
  { name: "Zeynep Kaya", type: "Gönüllü başvurusu", date: "Bugün, 10:42", status: "Yeni" },
  { name: "Mehmet Yılmaz", type: "Yardım talebi", date: "Dün, 16:18", status: "İnceleniyor" },
  { name: "Ayşe Demir", type: "İletişim mesajı", date: "Dün, 11:05", status: "Yanıtlandı" },
  { name: "Emre Akın", type: "Gönüllü başvurusu", date: "30 Tem, 14:22", status: "Yeni" },
];

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
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [campaignModal, setCampaignModal] = useState(false);
  const [toast, setToast] = useState("");
  const [siteLive, setSiteLive] = useState(true);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function addCampaign(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "Genel");
    const target = String(formData.get("target") || "0");
    if (!title) return;
    setCampaigns((current) => [
      ...current,
      {
        id: Date.now(),
        title,
        category,
        status: "Taslak",
        progress: 0,
        target: `${target} ₺`,
        raised: "0 ₺",
      },
    ]);
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
              {id === "applications" && <b>4</b>}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.demoNotice}><span>i</span><p><strong>Demo paneli</strong>Veriler şimdilik örnektir.</p></div>
          <div className={styles.profile}>
            <span>EK</span><p><strong>Emre Kök</strong><small>Yönetici</small></p><button type="button">•••</button>
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

              <div className={styles.demoBanner}><span>i</span><p><strong>Panel önizleme modunda çalışıyor.</strong>Gösterilen rakamlar ve kayıtlar örnek veridir. Supabase bağlantısından sonra gerçek veriler burada görünecek.</p><button type="button" onClick={() => showToast("Veritabanı bağlantısı bir sonraki aşamada kurulacak.")}>Bağlantı bilgisi</button></div>

              <section className={styles.stats}>
                <article><div className={styles.statIcon}>↗</div><span>Toplam destek</span><strong>258.700 ₺</strong><small className={styles.up}>↑ %12,4 <i>geçen aya göre</i></small></article>
                <article><div className={styles.statIcon}>◇</div><span>Aktif kampanya</span><strong>12</strong><small className={styles.up}>↑ 2 yeni <i>bu ay</i></small></article>
                <article><div className={styles.statIcon}>◎</div><span>Toplam üye</span><strong>4.862</strong><small className={styles.up}>↑ 184 <i>bu ay</i></small></article>
                <article><div className={styles.statIcon}>◫</div><span>Bekleyen başvuru</span><strong>7</strong><small className={styles.warn}>3 acil <i>inceleme bekliyor</i></small></article>
              </section>

              <div className={styles.dashboardGrid}>
                <section className={styles.card}>
                  <div className={styles.cardHeader}><div><h2>Destek özeti</h2><p>Son 6 aylık örnek hareket</p></div><select aria-label="Tarih aralığı"><option>Son 6 ay</option><option>Bu yıl</option></select></div>
                  <div className={styles.chart}>
                    <div className={styles.chartLabels}><span>80B</span><span>60B</span><span>40B</span><span>20B</span><span>0</span></div>
                    <div className={styles.chartArea}>
                      <svg viewBox="0 0 600 210" preserveAspectRatio="none" aria-label="Örnek destek grafiği">
                        <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a9675" stopOpacity=".3" /><stop offset="100%" stopColor="#1a9675" stopOpacity="0" /></linearGradient></defs>
                        <path d="M0 185 C65 180 70 140 130 150 S210 115 265 125 S345 70 400 88 S485 35 600 42 L600 210 L0 210 Z" fill="url(#chartFill)" />
                        <path d="M0 185 C65 180 70 140 130 150 S210 115 265 125 S345 70 400 88 S485 35 600 42" fill="none" stroke="#168765" strokeWidth="4" />
                      </svg>
                      <div className={styles.months}><span>Mar</span><span>Nis</span><span>May</span><span>Haz</span><span>Tem</span><span>Ağu</span></div>
                    </div>
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardHeader}><div><h2>Hızlı işlemler</h2><p>Sık kullanılan işlemler</p></div></div>
                  <div className={styles.quickActions}>
                    <button type="button" onClick={() => setCampaignModal(true)}><i>＋</i><span><strong>Kampanya oluştur</strong><small>Yeni bir yardım kampanyası ekle</small></span><b>›</b></button>
                    <button type="button" onClick={() => selectSection("applications")}><i>◫</i><span><strong>Başvuruları incele</strong><small>7 kayıt değerlendirme bekliyor</small></span><b>›</b></button>
                    <button type="button" onClick={() => selectSection("content")}><i>▤</i><span><strong>İçerikleri düzenle</strong><small>Ana sayfa ve duyurular</small></span><b>›</b></button>
                    <button type="button" onClick={() => selectSection("settings")}><i>⚙</i><span><strong>Site ayarları</strong><small>Genel görünüm ve bilgiler</small></span><b>›</b></button>
                  </div>
                </section>
              </div>

              <section className={`${styles.card} ${styles.recentCard}`}>
                <div className={styles.cardHeader}><div><h2>Son başvurular</h2><p>Yeni gelen mesaj ve talepler</p></div><button type="button" onClick={() => selectSection("applications")}>Tümünü Gör →</button></div>
                <ApplicationTable />
              </section>
            </>
          )}

          {active === "campaigns" && (
            <>
              <div className={styles.pageHeading}><div><p>İçerik yönetimi</p><h1>Kampanyalar</h1><span>Yardım kampanyalarını oluştur, düzenle ve yayınla.</span></div><button className={styles.primaryButton} type="button" onClick={() => setCampaignModal(true)}>＋ Yeni Kampanya</button></div>
              <section className={styles.card}>
                <div className={styles.toolbar}><input aria-label="Kampanya ara" placeholder="Kampanya ara..." /><select aria-label="Durum filtresi"><option>Tüm durumlar</option><option>Yayında</option><option>Taslak</option></select></div>
                <div className={styles.campaignList}>
                  {campaigns.map((campaign) => (
                    <article key={campaign.id}>
                      <div className={styles.campaignThumb}>{campaign.category.slice(0, 1)}</div>
                      <div className={styles.campaignName}><strong>{campaign.title}</strong><span>{campaign.category}</span></div>
                      <div className={styles.campaignProgress}><div><span style={{ width: `${campaign.progress}%` }} /></div><small>{campaign.raised} / {campaign.target}</small></div>
                      <span className={campaign.status === "Yayında" ? styles.liveStatus : styles.draftStatus}>● {campaign.status}</span>
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
              <section className={styles.card}><ApplicationTable detailed /></section>
            </>
          )}

          {active === "members" && <Placeholder title="Üyeler" text="Kayıtlı destekçileri, yöneticileri ve kullanıcı yetkilerini buradan yöneteceksin." icon="◎" />}
          {active === "content" && <Placeholder title="İçerik Yönetimi" text="Ana sayfa metinleri, duyurular, iyilik hikâyeleri ve sık sorulan sorular burada düzenlenecek." icon="▤" />}

          {active === "settings" && (
            <>
              <div className={styles.pageHeading}><div><p>Sistem</p><h1>Site Ayarları</h1><span>Sitenin genel durumunu ve iletişim bilgilerini yönet.</span></div><button className={styles.primaryButton} type="button" onClick={() => showToast("Ayarlar demo olarak kaydedildi.")}>Değişiklikleri Kaydet</button></div>
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

function ApplicationTable({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead><tr><th>Başvuran</th><th>Başvuru türü</th><th>Tarih</th><th>Durum</th>{detailed && <th>İşlem</th>}</tr></thead>
        <tbody>
          {applications.map((application) => (
            <tr key={`${application.name}-${application.type}`}>
              <td><span className={styles.avatar}>{application.name.split(" ").map((part) => part[0]).join("")}</span><strong>{application.name}</strong></td>
              <td>{application.type}</td><td>{application.date}</td>
              <td><span className={`${styles.status} ${application.status === "Yeni" ? styles.statusNew : application.status === "İnceleniyor" ? styles.statusReview : styles.statusDone}`}>● {application.status}</span></td>
              {detailed && <td><button className={styles.tableButton} type="button">İncele</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Placeholder({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <>
      <div className={styles.pageHeading}><div><p>Yönetim</p><h1>{title}</h1><span>{text}</span></div></div>
      <section className={`${styles.card} ${styles.placeholder}`}>
        <div>{icon}</div><h2>{title} altyapısı hazır</h2><p>Bu bölüm Supabase üyelik ve veritabanı bağlantısıyla birlikte gerçek verilerle çalışmaya başlayacak.</p><span>Sonraki aşama</span>
      </section>
    </>
  );
}

