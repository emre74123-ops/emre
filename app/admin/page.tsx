"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import styles from "./admin.module.css";
import ModuleManager from "./ModuleManager";
import { defaultSlides } from "../../lib/slides";
import { defaultHeaderSettings, type HeaderSettings } from "../../lib/header-settings";
import { defaultManagedPages, managedPageHref, normalizeSlug, type ManagedPage } from "../../lib/page-settings";
import { defaultModuleSettings, donationCategoryOptions, type ModuleSettings } from "../../lib/module-settings";

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

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailConfirmed: boolean;
  createdAt: string;
  lastSignInAt: string | null;
};

const navItems = [
  ["overview", "âŒ‚", "Genel BakÄ±ÅŸ"],
  ["header", "â–°", "Header YÃ¶netimi"],
  ["mobileMenu", "â˜°", "Mobil MenÃ¼ YÃ¶netimi"],
  ["slider", "â–£", "Slider YÃ¶netimi"],
  ["modules", "â–¦", "ModÃ¼ller"],
  ["campaigns", "â—‡", "Kampanyalar"],
  ["applications", "â—«", "BaÅŸvurular"],
  ["members", "â—", "Ãœyeler"],
  ["memberArea", "â—‰", "Ãœye AlanÄ± YÃ¶netimi"],
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
  const [members, setMembers] = useState<Member[]>([]);
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
      fetch("/api/admin/members").then((response) => response.json()),
      fetch("/api/admin/slides").then(async (response) => {
        const result = await response.json();
        if (response.ok && Array.isArray(result.slides) && result.slides.length) return result;
        const fallbackResponse = await fetch(`/api/slides?t=${Date.now()}`, { cache: "no-store" });
        return fallbackResponse.json();
      }),
    ]).then(([campaignResult, applicationResult, memberResult, slideResult]) => {
      setCampaigns(campaignResult.campaigns || []);
      setApplications(applicationResult.applications || []);
      setMembers(memberResult.members || []);
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
          {active === "modules" && <ModuleManager showToast={showToast} />}

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
                      <div className={styles.campaignName}><strong>{campaign.title}</strong><span>{c×ŞtÒÚ$z{-®éÜj×$v—¦Æ’'ÓÂ÷7ããÇ6ÖÆÃäÖ6;Ç7L;Â²Öö&–Â|;g'6VÃÂ÷6ÖÆÃãÂöF—càĞ¢Æ'WGFöâG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6WDVF—F–ær‡6Æ–FR—ÓäL;Ç¦VæÆSÂö'WGFöãàĞ¢Æ'WGFöâG—SÒ&'WGFöâ"öä6Æ–6³×²‚’ÓâW'6—7B‡6Æ–FW2æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ–BÓÒ6Æ–FRæ–B’—Óå6–ÃÂö'WGFöãàĞ¢ÂöF—càĞ¢Âö'F–6ÆSàĞ¢’—ĞĞ¢Â÷6V7F–öãàĞ Ğ¢Ç6V7F–öâ6Æ74æÖS×·7G–ÆW2æÖVF–Æ–'&'—ÓàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖVF–Æ–'&'”†VF–æwÓàĞ¢ÆF—cãÇ7ãäÔTE”œ9däULKÜKÂ÷7ããÆƒ#ä|;g'6VÂ¼;ÇL;Ç†æW6“Âöƒ#ãÇå6Æ–FW"œ:v–âœ;Æ¶ÆVFœIö–æ—¢,;ÇL;Æâ|;g'6VÆÆW&’'W&F|;g&V&–Æ—"fR·VÆÆìKÆÖ–æÆ,K6–ÆV&–Æ—'6–æ—¢ãÂ÷ãÂöF—càĞ¢Æ#ç¶–ÖvW2æÆVæwF‡Ò|;g'6VÃÂö#àĞ¢ÂöF—càĞ¢¶–ÖvW2æÆVæwF‚ÓÓÒò€Ğ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖVF–V×G—Óä†Vì;Ç¢&–Æv—6–&Fâœ;Æ¶ÆVæÖœYò6Æ–FW"|;g'6VÆ’–ö²ãÂöF—càĞ¢’¢€Ğ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖVF–w&–GÓàĞ¢¶–ÖvW2æÖ‚†–ÖvR’Óâ°Ğ¢6öç7B–åW6RÒ6Æ–FW2ç6öÖR‚‡6Æ–FR’Óâ6Æ–FRæFW6·F÷–ÖvRÓÓÒ–ÖvRçW&ÂÇÂ6Æ–FRæÖö&–ÆT–ÖvRÓÓÒ–ÖvRçW&Â“°Ğ¢&WGW&â€Ğ¢Æ'F–6ÆR¶W“×¶–ÖvRçF‡ÓàĞ¢Æ–Ör7&3×¶–ÖvRçW&ÇÒÇCÒ%œ;Æ¶ÆVæÖœYò6Æ–FW"|;g'6VÆ’"óàĞ¢ÆF—càĞ¢Ç7ãç¶–ÖvRçF‚ç7Æ—B‚"ò"’ç÷‚—ÓÂ÷7ãàĞ¢Ç6ÖÆÃç¶–ÖvRç6—¦RòG²†–ÖvRç6—¦Rò#Bò#B’çFôf—†VBƒ"—ÒÔ&¢%6Æ–FW"|;g'6VÆ’'ÓÂ÷6ÖÆÃàĞ¢ÂöF—càĞ¢¶–åW6PĞ¢òÆ#ä·VÆÆìKÖFÂö#àĞ¢¢Æ'WGFöâG—SÒ&'WGFöâ"öä6Æ–6³×²‚’ÓâFVÆWFT–ÖvR†–ÖvR—Óå6–ÃÂö'WGFöãçĞĞ¢Âö'F–6ÆSàĞ¢“°Ğ¢Ò—ĞĞ¢ÂöF—càĞ¢—ĞĞ¢Â÷6V7F–öãàĞ Ğ¢¶VF—F–ærbb€Ğ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖöFÄ&6¶G&÷ÓàĞ¢Æf÷&Ò6Æ74æÖS×¶G·7G–ÆW2æÖöFÇÒG·7G–ÆW2ç6Æ–FTÖöFÇÖÒ7F–öã×·6fU6Æ–FWÓàĞ¢Æ'WGFöâ6Æ74æÖS×·7G–ÆW2æÖöFÄ6Æ÷6WÒG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6WDVF—F–ær†çVÆÂ—Óì9sÂö'WGFöãàĞ¢Ç7ãå4Ä”DU"”$Ä$“Â÷7ããÆƒ#å6Æ—LKL;Ç¦VæÆSÂöƒ#ãÇäÖ6;Ç7L;ÂfRÖö&–Â|;g'6VÆÆW&–æ’—,K—,KL;Ç¦VæÆW––âãÂ÷àĞ¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2æ6†V6´Æ&VÇÓãÆ–çWBæÖSÒ&7F—fR"G—SÒ&6†V6¶&÷‚"FVfVÇD6†V6¶VC×¶VF—F–æræ7F—fWÒóâ'R6Æ—B–œKæFÂöÆ&VÃàĞ¢Ç6V7F–öâ6Æ74æÖS×·7G–ÆW2æFW6·F÷WÆöE6V7F–öçÓàĞ¢ÆF—cãÇ7ãäÔ49Å5L9Â4Ä”DU#Â÷7ããÇ7G&öæsã“#9r“–·6VÃÂ÷7G&öæsãÇ6ÖÆÃå–F’|;g'6VÂ+r9fæW&–ÆVâ÷&âc£rÃR+rVâf¦ÆRÔ#Â÷6ÖÆÃãÂöF—càĞ¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2çWÆöDf–VÆGÓäÖ6;Ç7L;Â|;g'6VÆĞ¢Ç7ããÆ–çWBæÖSÒ&FW6·F÷–ÖvR"G—SÒ'W&Â"fÇVS×¶VF—F–æræFW6·F÷–ÖvWÒöä6†ævS×²†WfVçB’Óâ6WDVF—F–ær‡²ââæVF—F–ærÂFW6·F÷–ÖvS¢WfVçBçF&vWBçfÇVRÒ—ÒÆ6V†öÆFW#Ò$|;g'6VÂG&W6’fW–œ;Æ¶ÆVÖR"&WV—&VBóãÆ#ç·WÆöF–ærÓÓÒ&FW6·F÷"ò%œ;Æ¶ÆVæ—–÷"âââ"¢$&–Æv—6–&Fâ6\:r'ÓÆ–çWBG—SÒ&f–ÆR"66WCÒ&–ÖvRò¢"F—6&ÆVC×´&ööÆVâ‡WÆöF–ær—Òöä6†ævS×²†WfVçB’ÓâWfVçBçF&vWBæf–ÆW3òå³ÒbbWÆöD–ÖvR†WfVçBçF&vWBæf–ÆW5³ÒÂ&FW6·F÷"—ÒóãÂö#ãÂ÷7ãàĞ¢ÂöÆ&VÃàĞ¢¶VF—F–æræFW6·F÷–ÖvRbbÆF—b6Æ74æÖS×·7G–ÆW2æFW6·F÷–ÖvU&Wf–WwÓãÆ–Ör7&3×¶VF—F–æræFW6·F÷–ÖvWÒÇCÒ$Ö6;Ç7L;Â6Æ–FW";fæ—¦ÆVÖW6’"óãÂöF—cçĞĞ¢Â÷6V7F–öãàĞ¢Ç6V7F–öâ6Æ74æÖS×·7G–ÆW2æÖö&–ÆUWÆöE6V7F–öçÓàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖö&–ÆUWÆöD6÷—ÓãÇ7ãäÔô,KÂ4Ä”DU"(	B•$’|9e%4TÃÂ÷7ããÇ7G&öæsã“9rS–·6VÃÂ÷7G&öæsãÇ6ÖÆÃäF–¶W’|;g'6VÂ+r9fæW&–ÆVâ÷&âc£r+rÖ–æ–×VÒs#9sƒC+rVâf¦ÆRÔ#Â÷6ÖÆÃãÇì9fæVÖÆ’¶œYö’fW–æW6æW–’|;g'6VÆ–â÷'F,;fÌ;ÆÜ;ÆæFRGWGVââ'WFöâÇBF&gF–W"Æ6IüKœ:v–â|;g'6VÆ–âÇB¼K6ÜKìK6FR,K&¼KâãÂ÷ãÂöF—càĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖö&–ÆUWÆöDw&–GÓàĞ¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2çWÆöDf–VÆGÓäÖö&–Â|;g'6VÆĞ¢Ç7ããÆ–çWBæÖSÒ&Öö&–ÆT–ÖvR"G—SÒ'W&Â"fÇVS×¶VF—F–æræÖö&–ÆT–ÖvWÒöä6†ævS×²†WfVçB’Óâ6WDVF—F–ær‡²ââæVF—F–ærÂÖö&–ÆT–ÖvS¢WfVçBçF&vWBçfÇVRÒ—ÒÆ6V†öÆFW#Ò$Öö&–Â|;g'6VÂG&W6’fW–œ;Æ¶ÆVÖR"&WV—&VBóãÆ#ç·WÆöF–ærÓÓÒ&Öö&–ÆR"ò%œ;Æ¶ÆVæ—–÷"âââ"¢$Öö&–Â|;g'6VÂ6\:r'ÓÆ–çWBG—SÒ&f–ÆR"66WCÒ&–ÖvRò¢"F—6&ÆVC×´&ööÆVâ‡WÆöF–ær—Òöä6†ævS×²†WfVçB’ÓâWfVçBçF&vWBæf–ÆW3òå³ÒbbWÆöD–ÖvR†WfVçBçF&vWBæf–ÆW5³ÒÂ&Öö&–ÆR"—ÒóãÂö#ãÂ÷7ãàĞ¢ÂöÆ&VÃàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2ç†öæU&Wf–WwÓç¶VF—F–æræÖö&–ÆT–ÖvRòÆ–Ör7&3×¶VF—F–æræÖö&–ÆT–ÖvWÒÇCÒ$Öö&–Â6Æ–FW";fæ—¦ÆVÖW6’"óâ¢Ç7ãäÖö&–ÃÆ'"óì;fæ—¦ÆVÖSÂ÷7ãçÓÆ’óãÂöF—càĞ¢ÂöF—càĞ¢Â÷6V7F–öãàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖöFÄ7F–öç7ÓãÆ'WGFöâG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6WDVF—F–ær†çVÆÂ—Óåf¦v\:sÂö'WGFöããÆ'WGFöâG—SÒ'7V&Ö—B"F—6&ÆVC×·6f–æwÓç·6f–ærò$¶–FVF–Æ—–÷"âââ"¢$¶–FWBfR–œKæÆ'ÓÂö'WGFöããÂöF—càĞ¢Âöf÷&ÓàĞ¢ÂöF—càĞ¢—ĞĞ¢ÂóàĞ¢“°Ğ§ĞĞ Ğ¦gVæ7F–öâÖVÖ&W$&VÖævW"‡²6†÷uFö7BÓ¢²6†÷uFö7C¢†ÖW76vS¢7G&–ær’Óâfö–BÒ’°Ğ¢6öç7B·6WGF–æw2Â6WE6WGF–æw5ÒÒW6U7FFSÄ†VFW%6WGF–æw3â†FVfVÇD†VFW%6WGF–æw2“°Ğ¢6öç7B¶ÆöF–ærÂ6WDÆöF–æuÒÒW6U7FFR‡G'VR“°Ğ¢6öç7B·6f–ærÂ6WE6f–æuÒÒW6U7FFR†fÇ6R“°Ğ Ğ¢W6TVffV7B‚‚’Óâ°Ğ¢fWF6‚‚"ö’öFÖ–âö†VFW""’çF†Vâ‚‡&W7öç6R’Óâ&W7öç6Ræ§6öâ‚’’çF†Vâ‚‡&W7VÇB’Óâ°Ğ¢–b‡&W7VÇBç6WGF–æw2’6WE6WGF–æw2‡²ââæFVfVÇD†VFW%6WGF–æw2Âââç&W7VÇBç6WGF–æw2Ò“°Ğ¢Ò’æ6F6‚‚‚’Óâ6†÷uFö7B‚,9Ç–RÆìK–&Æ,Kœ;Æ¶ÆVæVÖVF’â"’’æf–æÆÇ’‚‚’Óâ6WDÆöF–ær†fÇ6R’“°Ğ¢ÒÂµÒ“°Ğ Ğ¢7–æ2gVæ7F–öâ6fR‚’°Ğ¢6WE6f–ær‡G'VR“°Ğ¢6öç7B&W7öç6RÒv—BfWF6‚‚"ö’öFÖ–âö†VFW""Â°Ğ¢ÖWF†öC¢%õ5B"ÀĞ¢†VFW'3¢²$6öçFVçBÕG—R#¢&Æ–6F–öâö§6öâ"ÒÀĞ¢&öG“¢¥4ôâç7G&–æv–g’‡6WGF–æw2’ÀĞ¢Ò“°Ğ¢6öç7B&W7VÇBÒv—B&W7öç6Ræ§6öâ‚“°Ğ¢6WE6f–ær†fÇ6R“°Ğ¢6†÷uFö7B‡&W7öç6Ræö²ò,9Ç–RÆìK–&Æ,K¶–FVF–ÆF’â"¢&W7VÇBæW'&÷"ÇÂ$–&Æ"¶–FVF–ÆVÖVF’â"“°Ğ¢ĞĞ Ğ¢–b†ÆöF–ær’&WGW&âÇ6V7F–öâ6Æ74æÖS×¶G·7G–ÆW2æ6&GÒG·7G–ÆW2çÆ6V†öÆFW'ÖÓãÆF—cî)x“ÂöF—cãÆƒ#ì9Ç–RÆìKœ;Æ¶ÆVæ—–÷#Âöƒ#ãÂ÷6V7F–öãã°Ğ Ğ¢&WGW&â€Ğ¢ÃàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2çvT†VF–æwÓàĞ¢ÆF—cãÇì9Ç–VÆ–²FVæW––Ö“Â÷ãÆƒì9Ç–RÆìKœ;fæWF–Ö“ÂöƒãÇ7ãä†VFW"†W6ÖVì;Ç<;Æì;ÂfR†W6,KÒ6–f<KæF¶’,;fÌ;ÆÖÆW&’'W&Fâœ;fæWBãÂ÷7ããÂöF—càĞ¢Æ'WGFöâ6Æ74æÖS×·7G–ÆW2ç&–Ö'”'WGFöçÒG—SÒ&'WGFöâ"F—6&ÆVC×·6f–æwÒöä6Æ–6³×·6fWÓç·6f–ærò$¶–FVF–Æ—–÷"âââ"¢$¶–FWBfR–œKæÆ'ÓÂö'WGFöãàĞ¢ÂöF—càĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æ†VFW%6WGF–æw4w&–GÓàĞ¢Ç6V7F–öâ6Æ74æÖS×·7G–ÆW2æ6&GÓàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æ6&D†VFW'ÓãÆF—cãÆƒ#ä†VFW"†W6ÆìKÂöƒ#ãÇäv—&œYò–KÆÖLKIüKæF|;g7FW&–ÆV6V²ÖWFæ’fR†W6ÖW&¶W¦–æ–â&Væv–æ’&VÆ—&ÆRãÂ÷ãÂöF—cãÂöF—càĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æ†VFW$f÷&×ÓàĞ¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2æ†VFW$6†V6·ÓãÆ–çWBG—SÒ&6†V6¶&÷‚"6†V6¶VC×·6WGF–æw2æ66÷VçDVæ&ÆVGÒöä6†ævS×²†WfVçB’Óâ6WE6WGF–æw2‡²ââç6WGF–æw2Â66÷VçDVæ&ÆVC¢WfVçBçF&vWBæ6†V6¶VBÒ—Òóâ9Ç–VÆ–²ÆìKìK|;g7FW#ÂöÆ&VÃàĞ¢ÆÆ&VÃäv—&œYòL;ÌIöÖW6’–¬K<KÆ–çWBfÇVS×·6WGF–æw2æ66÷VçDÆ&VÇÒöä6†ævS×²†WfVçB’Óâ6WE6WGF–æw2‡²ââç6WGF–æw2Â66÷VçDÆ&VÃ¢WfVçBçF&vWBçfÇVRÒ—ÒóãÂöÆ&VÃàĞ¢ÆÆ&VÃä†W6ÖW&¶W¦’&Væv“Æ–çWBG—SÒ&6öÆ÷""fÇVS×·6WGF–æw2æ66÷VçEvT66VçD6öÆ÷'Òöä6†ævS×²†WfVçB’Óâ6WE6WGF–æw2‡²ââç6WGF–æw2Â66÷VçEvT66VçD6öÆ÷#¢WfVçBçF&vWBçfÇVRÒ—ÒóãÂöÆ&VÃàĞ¢ÂöF—càĞ¢Â÷6V7F–öãàĞ¢Ç6V7F–öâ6Æ74æÖS×·7G–ÆW2æ6&GÓàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æ6&D†VFW'ÓãÆF—cãÆƒ#ä†W6,KÒÖVì;Ç<;ÃÂöƒ#ãÇä·VÆÆìK<KÆ,Kâ|;g&V&–ÆV6\Iö’œYöÆVÒ,;fÌ;ÆÖÆW&–æ’6\:rãÂ÷ãÂöF—cãÂöF—càĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æ†VFW$f÷&×ÓàĞ¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2æ†VFW$6†V6·ÓãÆ–çWBG—SÒ&6†V6¶&÷‚"6†V6¶VC×·6WGF–æw2æ66÷VçDÖVçTFöæF–öç4Væ&ÆVGÒöä6†ævS×²†WfVçB’Óâ6WE6WGF–æw2‡²ââç6WGF–æw2Â66÷VçDÖVçTFöæF–öç4Væ&ÆVC¢WfVçBçF&vWBæ6†V6¶VBÒ—Òóâ&IüKYöÆ,KÓÂöÆ&VÃàĞ¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2æ†VFW$6†V6·ÓãÆ–çWBG—SÒ&6†V6¶&÷‚"6†V6¶VC×·6WGF–æw2æ66÷VçDÖVçUW&&äVæ&ÆVGÒöä6†ævS×²†WfVçB’Óâ6WE6WGF–æw2‡²ââç6WGF–æw2Â66÷VçDÖVçUW&&äVæ&ÆVC¢WfVçBçF&vWBæ6†V6¶VBÒ—Òóâ·W&&â&IüKYöÆ,KÓÂöÆ&VÃàĞ¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2æ†VFW$6†V6·ÓãÆ–çWBG—SÒ&6†V6¶&÷‚"6†V6¶VC×·6WGF–æw2æ66÷VçDÖVçU7öç6÷'6†—4Væ&ÆVGÒöä6†ævS×²†WfVçB’Óâ6WE6WGF–æw2‡²ââç6WGF–æw2Â66÷VçDÖVçU7öç6÷'6†—4Væ&ÆVC¢WfVçBçF&vWBæ6†V6¶VBÒ—Òóâ7öç6÷&ÇV¶Æ,KÓÂöÆ&VÃàĞ¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2æ†VFW$6†V6·ÓãÆ–çWBG—SÒ&6†V6¶&÷‚"6†V6¶VC×·6WGF–æw2æ66÷VçDÖVçUvVÆÇ4Væ&ÆVGÒöä6†ævS×²†WfVçB’Óâ6WE6WGF–æw2‡²ââç6WGF–æw2Â66÷VçDÖVçUvVÆÇ4Væ&ÆVC¢WfVçBçF&vWBæ6†V6¶VBÒ—Òóâ7R·W—VÆ,KÓÂöÆ&VÃàĞ¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2æ†VFW$6†V6·ÓãÆ–çWBG—SÒ&6†V6¶&÷‚"6†V6¶VC×·6WGF–æw2æ66÷VçDÖVçU&ö¦V7G4Væ&ÆVGÒöä6†ævS×²†WfVçB’Óâ6WE6WGF–æw2‡²ââç6WGF–æw2Â66÷VçDÖVçU&ö¦V7G4Væ&ÆVC¢WfVçBçF&vWBæ6†V6¶VBÒ—Òóâ&ö¦VÆW&–ÓÂöÆ&VÃàĞ¢ÂöF—càĞ¢Â÷6V7F–öãàĞ¢ÂöF—càĞ¢ÂóàĞ¢“°Ğ§ĞĞ Ğ¦gVæ7F–öâÖVÖ&W$ÖævW"‡°Ğ¢ÖVÖ&W'2ÀĞ¢ÆöF–ærÀĞ¢öäÖVÖ&W$FVÆWFVBÀĞ¢6†÷uFö7BÀĞ§Ó¢°Ğ¢ÖVÖ&W'3¢ÖVÖ&W%µÓ°Ğ¢ÆöF–æs¢&ööÆVã°Ğ¢öäÖVÖ&W$FVÆWFVC¢‡W6W$–C¢7G&–ær’Óâfö–C°Ğ¢6†÷uFö7C¢†ÖW76vS¢7G&–ær’Óâfö–C°Ğ§Ò’°Ğ¢6öç7B·VW'’Â6WEVW'•ÒÒW6U7FFR‚""“°Ğ¢6öç7B¶f–ÇFW"Â6WDf–ÇFW%ÒÒW6U7FFSÂ&ÆÂ"Â&6öæf—&ÖVB"Â'†öæR#â‚&ÆÂ"“°Ğ¢6öç7B¶FVÆWF–æt–BÂ6WDFVÆWF–æt–EÒÒW6U7FFR‚""“°Ğ¢6öç7Bæ÷&ÖÆ—¦VEVW'’ÒVW'’çG&–Ò‚’çFôÆö6ÆTÆ÷vW$66R‚'G"ÕE""“°Ğ¢6öç7Bf—6–&ÆTÖVÖ&W'2ÒÖVÖ&W'2æf–ÇFW"‚†ÖVÖ&W"’Óâ°Ğ¢6öç7BÖF6†W5VW'’Òæ÷&ÖÆ—¦VEVW'’ÇÂG¶ÖVÖ&W"ææÖWÒG¶ÖVÖ&W"æVÖ–ÇÒG¶ÖVÖ&W"ç†öæWÖçFôÆö6ÆTÆ÷vW$66R‚'G"ÕE""’æ–æ6ÇVFW2†æ÷&ÖÆ—¦VEVW'’“°Ğ¢6öç7BÖF6†W4f–ÇFW"Òf–ÇFW"ÓÓÒ&ÆÂ"ÇÂ†f–ÇFW"ÓÓÒ&6öæf—&ÖVB"òÖVÖ&W"æVÖ–Ä6öæf—&ÖVB¢&ööÆVâ†ÖVÖ&W"ç†öæR’“°Ğ¢&WGW&âÖF6†W5VW'’bbÖF6†W4f–ÇFW#°Ğ¢Ò“°Ğ Ğ¢7–æ2gVæ7F–öâFVÆWFTÖVÖ&W"†ÖVÖ&W#¢ÖVÖ&W"’°Ğ¢6öç7BÖVÖ&W$Æ&VÂÒÖVÖ&W"æVÖ–ÂÇÂÖVÖ&W"ææÖRÇÂ$'R;Ç–R#°Ğ¢–b‚v–æF÷ræ6öæf—&Ò†G¶ÖVÖ&W$Æ&VÇÒ;Ç–VÆœIö’FÖÖVâ6–Æ–ç6–âÖ“õÆåÆä'RœYöÆVÒvW&’ÌKæÖ¢æ’’&WGW&ã°Ğ Ğ¢6WDFVÆWF–æt–B†ÖVÖ&W"æ–B“°Ğ¢G'’°Ğ¢6öç7B&W7öç6RÒv—BfWF6‚‚"ö’öFÖ–âöÖVÖ&W'2"Â°Ğ¢ÖWF†öC¢$DTÄUDR"ÀĞ¢†VFW'3¢²$6öçFVçBÕG—R#¢&Æ–6F–öâö§6öâ"ÒÀĞ¢&öG“¢¥4ôâç7G&–æv–g’‡²W6W$–C¢ÖVÖ&W"æ–BÒ’ÀĞ¢Ò“°Ğ¢6öç7B&W7VÇBÒv—B&W7öç6Ræ§6öâ‚“°Ğ¢–b‚&W7öç6Ræö²’F‡&÷ræWrW'&÷"‡&W7VÇBæW'&÷"ÇÂ,9Ç–VÆ–²6–Æ–æVÖVF’â"“°Ğ¢öäÖVÖ&W$FVÆWFVB†ÖVÖ&W"æ–B“°Ğ¢6†÷uFö7B‚,9Ç–VÆ–²FÖÖVâ6–Æ–æF’â–ìKR×÷7F–ÆR–Væ–FVâ¶œKBöÇVæ&–Æ—"â"“°Ğ¢Ò6F6‚†W'&÷"’°Ğ¢6†÷uFö7B†W'&÷"–ç7Fæ6VöbW'&÷"òW'&÷"æÖW76vR¢,9Ç–VÆ–²6–Æ–æVÖVF’â"“°Ğ¢Òf–æÆÇ’°Ğ¢6WDFVÆWF–æt–B‚""“°Ğ¢ĞĞ¢ĞĞ Ğ¢&WGW&â€Ğ¢ÃàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2çvT†VF–æwÓàĞ¢ÆF—cãÇì9Ç–VÆ–²ÖW&¶W¦“Â÷ãÆƒì9Ç–VÆW#ÂöƒãÇ7ãå¦—–&WL:v’;Ç–VÆW&–æ’|;g,;ÆçL;ÆÆRfR;Ç–VÆ–²GW'VÖÆ,KìKF¶—WBâœ;fæWF–6’†W6Æ,K'RÆ—7FW–RF†–ÂVF–ÆÖW¢ãÂ÷7ããÂöF—càĞ¢ÂöF—càĞ¢Ç6V7F–öâ6Æ74æÖS×·7G–ÆW2æÖVÖ&W%7FG7ÓàĞ¢Æ'F–6ÆSãÇ7ãåF÷ÆÒ¦—–&WL:v’;Ç–SÂ÷7ããÇ7G&öæsç¶ÖVÖ&W'2æÆVæwF‡ÓÂ÷7G&öæsãÇ6ÖÆÃåœ;fæWF–6’†W6Æ,K†&œ:sÂ÷6ÖÆÃãÂö'F–6ÆSàĞ¢Æ'F–6ÆSãÇ7ãäR×÷7F<KFüI÷'VÆæãÂ÷7ããÇ7G&öæsç¶ÖVÖ&W'2æf–ÇFW"‚†ÖVÖ&W"’ÓâÖVÖ&W"æVÖ–Ä6öæf—&ÖVB’æÆVæwF‡ÓÂ÷7G&öæsãÇ6ÖÆÃä|;ÇfVæÆ’†W6Â÷6ÖÆÃãÂö'F–6ÆSàĞ¢Æ'F–6ÆSãÇ7ãåFVÆVföçR¶œKFÌKÂ÷7ããÇ7G&öæsç¶ÖVÖ&W'2æf–ÇFW"‚†ÖVÖ&W"’ÓâÖVÖ&W"ç†öæR’æÆVæwF‡ÓÂ÷7G&öæsãÇ6ÖÆÃìKÆWFœYö–Ò&–Æv—6’'VÇVæãÂ÷6ÖÆÃãÂö'F–6ÆSàĞ¢Â÷6V7F–öãàĞ¢Ç6V7F–öâ6Æ74æÖS×·7G–ÆW2æ6&GÓàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖVÖ&W%FööÆ&'ÓàĞ¢ÆF—cãÇ7G&öæsì9Ç–RÆ—7FW6“Â÷7G&öæsãÇ7ãç·f—6–&ÆTÖVÖ&W'2æÆVæwF‡Ò¶œKB|;g7FW&–Æ—–÷#Â÷7ããÂöF—càĞ¢Æ–çWBfÇVS×·VW'—Òöä6†ævS×²†WfVçB’Óâ6WEVW'’†WfVçBçF&vWBçfÇVR—ÒÆ6V†öÆFW#Ò,K6–ÒÂR×÷7FfW–FVÆVföâ&âââ"&–ÖÆ&VÃÒ,9Ç–R&"óàĞ¢Ç6VÆV7BfÇVS×¶f–ÇFW'Òöä6†ævS×²†WfVçB’Óâ6WDf–ÇFW"†WfVçBçF&vWBçfÇVR2G—Vöbf–ÇFW"—Ò&–ÖÆ&VÃÒ,9Ç–Rf–ÇG&W6’#àĞ¢Æ÷F–öâfÇVSÒ&ÆÂ#åL;ÆÒ;Ç–VÆW#Âö÷F–öãàĞ¢Æ÷F–öâfÇVSÒ&6öæf—&ÖVB#äFüI÷'VÆæÜKYò†W6Æ#Âö÷F–öãàĞ¢Æ÷F–öâfÇVSÒ'†öæR#åFVÆVföçR¶œKFÌK;Ç–VÆW#Âö÷F–öãàĞ¢Â÷6VÆV7CàĞ¢ÂöF—càĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖVÖ&W%F&ÆUw&ÓàĞ¢ÇF&ÆR6Æ74æÖS×·7G–ÆW2æÖVÖ&W%F&ÆWÓàĞ¢ÇF†VCãÇG#ãÇFƒì9Ç–SÂ÷FƒãÇFƒåFVÆVföãÂ÷FƒãÇFƒäGW'VÓÂ÷FƒãÇFƒä¶œKBF&–†“Â÷FƒãÇFƒå6öâv—&œYóÂ÷FƒãÇFƒìKYöÆVÓÂ÷FƒãÂ÷G#ãÂ÷F†VCàĞ¢ÇF&öG“àĞ¢·f—6–&ÆTÖVÖ&W'2æÖ‚†ÖVÖ&W"’Óâ€Ğ¢ÇG"¶W“×¶ÖVÖ&W"æ–GÓàĞ¢ÇFCãÆ“ç²†ÖVÖ&W"ææÖRÇÂÖVÖ&W"æVÖ–ÂÇÂ,9Â"’ç6Æ–6RƒÂ’çFôÆö6ÆUWW$66R‚'G"ÕE""—ÓÂö“ãÇ7ããÇ7G&öæsç¶ÖVÖ&W"ææÖRÇÂ,K6–×6—¢;Ç–R'ÓÂ÷7G&öæsãÇ6ÖÆÃç¶ÖVÖ&W"æVÖ–ÇÓÂ÷6ÖÆÃãÂ÷7ããÂ÷FCàĞ¢ÇFCãÆ"6Æ74æÖS×·7G–ÆW2ç&÷f–FW$&FvWÓç¶ÖVÖ&W"ç†öæRÇÂ$&VÆ—'F–ÆÖVÖœYò'ÓÂö#ãÂ÷FCàĞ¢ÇFCãÆ"6Æ74æÖS×¶ÖVÖ&W"æVÖ–Ä6öæf—&ÖVBò7G–ÆW2æÖVÖ&W$6öæf—&ÖVB¢7G–ÆW2æÖVÖ&W%VæF–æwÓç¶ÖVÖ&W"æVÖ–Ä6öæf—&ÖVBò.)É2FüI÷'VÆæLK"¢$FüI÷'VÆÖ&V¶Æ—–÷"'ÓÂö#ãÂ÷FCàĞ¢ÇFCç¶f÷&ÖDFFR†ÖVÖ&W"æ7&VFVDB—ÓÂ÷FCàĞ¢ÇFCç¶ÖVÖ&W"æÆ7E6–vä–äBòf÷&ÖDFFR†ÖVÖ&W"æÆ7E6–vä–äB’¢$†Vì;Ç¢v—&œYò–ö²'ÓÂ÷FCàĞ¢ÇFCàĞ¢Æ'WGFöàĞ¢6Æ74æÖS×·7G–ÆW2æÖVÖ&W$FVÆWFT'WGFöçĞĞ¢G—SÒ&'WGFöâ Ğ¢F—6&ÆVC×¶FVÆWF–æt–BÓÓÒÖVÖ&W"æ–GĞĞ¢öä6Æ–6³×²‚’ÓâFVÆWFTÖVÖ&W"†ÖVÖ&W"—ĞĞ¢àĞ¢¶FVÆWF–æt–BÓÓÒÖVÖ&W"æ–Bò%6–Æ–æ—–÷"âââ"¢,9Ç–VÆœIö’6–Â'ĞĞ¢Âö'WGFöãàĞ¢Â÷FCàĞ¢Â÷G#àĞ¢’—ĞĞ¢Â÷F&öG“àĞ¢Â÷F&ÆSàĞ¢²ÆöF–ærbbf—6–&ÆTÖVÖ&W'2æÆVæwF‚ÓÓÒbbÆF—b6Æ74æÖS×·7G–ÆW2æÖVÖ&W$V×G—ÓãÇ7ãî)xãÂ÷7ããÇ7G&öæsì9Ç–R'VÇVæÖLKÂ÷7G&öæsãÇç¶ÖVÖ&W'2æÆVæwF‚ò$&ÖfW–f–ÇG&R;fÌ:|;ÇFÆW&–æ’F\IöœY÷F—&–ââ"¢%¦—–&WL:v–ÆW";Ç–RöÆGV¼:v¶œKFÆ,K'W&F|;g,;ÆæV6V²â'ÓÂ÷ãÂöF—cçĞĞ¢¶ÆöF–ærbbÆF—b6Æ74æÖS×·7G–ÆW2æÖVÖ&W$V×G—ÓãÇ7G&öæsì9Ç–VÆW"œ;Æ¶ÆVæ—–÷"ââãÂ÷7G&öæsãÂöF—cçĞĞ¢ÂöF—càĞ¢Â÷6V7F–öãàĞ¢ÂóàĞ¢“°Ğ§ĞĞ Ğ¦gVæ7F–öâf÷&ÖDFFR‡fÇVS¢7G&–ær’°Ğ¢&WGW&âæWr–çFÂäFFUF–ÖTf÷&ÖB‚'G"ÕE""Â²FFU7G–ÆS¢&ÖVF—VÒ"ÂF–ÖU7G–ÆS¢'6†÷'B"Ò’æf÷&ÖB†æWrFFR‡fÇVR’“°Ğ§ĞĞ Ğ¦gVæ7F–öâf÷&ÖDÖöæW’‡fÇVS¢çVÖ&W"’°Ğ¢&WGW&âæWr–çFÂäçVÖ&W$f÷&ÖB‚'G"ÕE""Â²7G–ÆS¢&7W'&Væ7’"Â7W'&Væ7“¢%E%’"ÂÖ†–×VÔg&7F–öäF–v—G3¢Ò’æf÷&ÖB„çVÖ&W"‡fÇVRÇÂ’“°Ğ§ĞĞ Ğ¦gVæ7F–öâÆ6V†öÆFW"‡²F—FÆRÂFW‡BÂ–6öâÓ¢²F—FÆS¢7G&–æs²FW‡C¢7G&–æs²–6öã¢7G&–ærÒ’°Ğ¢&WGW&â€Ğ¢ÃàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2çvT†VF–æwÓãÆF—cãÇåœ;fæWF–ÓÂ÷ãÆƒç·F—FÆWÓÂöƒãÇ7ãç·FW‡GÓÂ÷7ããÂöF—cãÂöF—càĞ¢Ç6V7F–öâ6Æ74æÖS×¶G·7G–ÆW2æ6&GÒG·7G–ÆW2çÆ6V†öÆFW'ÖÓàĞ¢ÆF—cç¶–6öçÓÂöF—cãÆƒ#ç·F—FÆWÓÂöƒ#ãÇä'R,;fÌ;ÆÒ|;ÇfVæÆ’fW&—F&ìKæ&IöÌKLK"â–Væ’¶œKFÆ"V¶ÆVæF–¼:vR'W&F|;g,;ÆçL;ÆÆVæV6V²ãÂ÷ãÇ7ãä&IöÆçLK·F–cÂ÷7ãàĞ¢Â÷6V7F–öãàĞ¢ÂóàĞ¢“°Ğ§ĞĞ