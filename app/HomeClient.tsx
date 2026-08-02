"use client";

import { useEffect, useRef, useState } from "react";

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
    category: "Eğitim",
    title: "Bir çocuğun eğitim yolculuğuna eşlik ol",
    description: "Kırtasiye, okul kıyafeti ve eğitim materyali desteğiyle geleceğe umut taşı.",
    image: "https://images.unsplash.com/photo-1504159506876-f8338247a14a?auto=format&fit=crop&w=1200&q=85",
    accent: "orange",
  },
  {
    category: "Temiz Su",
    title: "Bir damla su, binlerce yeni başlangıç",
    description: "Temiz suya erişimi olmayan bölgelerde kalıcı su projelerine destek ver.",
    image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=85",
    accent: "blue",
  },
  {
    category: "Gıda",
    title: "Sofralara bereket, ailelere dayanışma",
    description: "Temel gıda paketlerinin ihtiyaç sahibi ailelere ulaşmasına katkıda bulun.",
    image: "https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&w=1200&q=85",
    accent: "green",
  },
];

const supportAmounts = ["250", "500", "1.000", "2.500"];

const faqs = [
  ["Yardımlar nasıl doğrulanıyor?", "Başvurular belge ve saha kontrolleriyle incelenir. Bu sitedeki kampanyalar şu an örnek içeriktir; gerçek doğrulama sistemi yönetim paneliyle birlikte kurulacaktır."],
  ["Desteğimin sonucunu görebilecek miyim?", "Üyelik sistemi tamamlandığında destek geçmişi, kampanya güncellemeleri ve etki raporları kişisel hesabınızda görüntülenecektir."],
  ["Şu anda gerçek ödeme alınıyor mu?", "Hayır. Mevcut akış güvenli bir demodur; kart bilgisi istemez ve herhangi bir ücret tahsil etmez."],
];

export default function HomeClient({ initialSlides }: { initialSlides: Slide[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState("500");
  const [selectedProject, setSelectedProject] = useState("Genel Destek");
  const [demoComplete, setDemoComplete] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [slides] = useState<Slide[]>(initialSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [draggingSlider, setDraggingSlider] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setCurrentSlide((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide] || slides[0];

  function startSliderDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (slides.length < 2) return;
    dragStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveSliderDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const horizontal = Math.abs(event.clientX - dragStart.current.x);
    const vertical = Math.abs(event.clientY - dragStart.current.y);
    if (horizontal > 8 && horizontal > vertical) setDraggingSlider(true);
  }

  function finishSliderDrag(event: React.PointerEvent<HTMLDivElement>) {
    const start = dragStart.current;
    dragStart.current = null;
    setDraggingSlider(false);
    if (!start || slides.length < 2) return;
    const horizontal = event.clientX - start.x;
    const vertical = event.clientY - start.y;
    if (Math.abs(horizontal) < 45 || Math.abs(horizontal) <= Math.abs(vertical)) return;
    setCurrentSlide((current) => horizontal < 0
      ? (current + 1) % slides.length
      : (current - 1 + slides.length) % slides.length);
  }

  function openDonation(project = "Genel Destek") {
    setSelectedProject(project);
    setDemoComplete(false);
    setDonationOpen(true);
  }

  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="İyilik Adresim ana sayfa">
          <span className="brand-symbol"><i>i</i><b>a</b></span>
          <span className="brand-copy"><strong>İyilik</strong><small>Adresim</small></span>
        </a>
        <button className="menu-toggle" type="button" aria-label="Menüyü aç veya kapat" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
        <nav className={menuOpen ? "main-nav open" : "main-nav"} aria-label="Ana menü">
          <a href="#projeler" onClick={() => setMenuOpen(false)}>Projelerimiz</a>
          <a href="#hakkimizda" onClick={() => setMenuOpen(false)}>Biz Kimiz?</a>
          <a href="#seffaflik" onClick={() => setMenuOpen(false)}>Şeffaflık</a>
          <a href="#hikayeler" onClick={() => setMenuOpen(false)}>İyilik Hikâyeleri</a>
          <a href="#iletisim" onClick={() => setMenuOpen(false)}>İletişim</a>
        </nav>
        <div className="header-actions">
          <button className="account-button" type="button" onClick={() => setAccountOpen(true)}><span>○</span> Üye Girişi</button>
          <button className="donate-button compact" type="button" onClick={() => openDonation()}>Destek Ol <span>↗</span></button>
        </div>
      </header>

      <section className="hero" aria-roledescription="carousel" aria-label="İyilik Adresim duyuruları">
        <div
          className={`hero-image${draggingSlider ? " is-dragging" : ""}`}
          onPointerDown={startSliderDrag}
          onPointerMove={moveSliderDrag}
          onPointerUp={finishSliderDrag}
          onPointerCancel={() => { dragStart.current = null; setDraggingSlider(false); }}
        >
          {slide && <picture className="hero-media">
            <source media="(max-width: 760px)" srcSet={slide.mobileImage} />
            <img src={slide.desktopImage} alt="" />
          </picture>}
          {slide && slides.length > 1 && (
            <div className="slider-controls">
              <button type="button" aria-label="Önceki slayt" onClick={() => setCurrentSlide((current) => (current - 1 + slides.length) % slides.length)}>←</button>
              <div>{slides.map((item, index) => <button type="button" aria-label={`${index + 1}. slayta git`} aria-current={index === currentSlide} key={item.id} onClick={() => setCurrentSlide(index)}><span /></button>)}</div>
              <button type="button" aria-label="Sonraki slayt" onClick={() => setCurrentSlide((current) => (current + 1) % slides.length)}>→</button>
            </div>
          )}
        </div>

        <div className="quick-support">
          <div className="quick-title"><span>Hızlı Destek</span><small>3 kolay adımda</small></div>
          <div className="quick-steps">
            <label><b>1</b><span>Proje seç</span>
              <select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}>
                <option>Genel Destek</option><option>Eğitim Desteği</option><option>Temiz Su Projesi</option><option>Gıda Desteği</option>
              </select>
            </label>
            <label><b>2</b><span>Tutar belirle</span>
              <div className="quick-amounts">
                {supportAmounts.slice(0, 3).map((amount) => (
                  <button key={amount} className={selectedAmount === amount ? "active" : ""} type="button" onClick={() => setSelectedAmount(amount)}>{amount} ₺</button>
                ))}
              </div>
            </label>
            <button className="quick-submit" type="button" onClick={() => openDonation(selectedProject)}>Desteği Tamamla <span>→</span></button>
          </div>
          <p>🔒 Güvenli demo · Kart bilgisi istenmez</p>
        </div>
      </section>

      <section className="trust-band" aria-label="Platform değerleri">
        <div><span>01</span><strong>Doğrulanmış ihtiyaçlar</strong><small>İnceleme ve onay süreci</small></div>
        <div><span>02</span><strong>Şeffaf bilgilendirme</strong><small>Sürecin her adımını takip et</small></div>
        <div><span>03</span><strong>Kalıcı iyilik</strong><small>Sürdürülebilir sosyal etki</small></div>
        <div><span>04</span><strong>Güvenli altyapı</strong><small>Verileriniz özenle korunur</small></div>
      </section>

      <section className="section projects" id="projeler">
        <div className="section-top">
          <div><span className="section-label">Güncel projelerimiz</span><h2>İyiliğin bir parçası ol.</h2></div>
          <p>Her destek, doğru planlandığında kalıcı bir değişime dönüşür. Sana yakın gelen iyilik alanını seç.</p>
          <a href="#projeler">Tüm projeleri gör <span>↗</span></a>
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
                <div className="project-meta"><small>Örnek ilerleme</small><strong>%{42 + index * 17}</strong></div>
                <button type="button" onClick={() => openDonation(project.title)}>Projeyi İncele <span>→</span></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section" id="hakkimizda">
        <div className="about-image">
          <img src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1400&q=85" alt="Dayanışma için bir araya gelen gönüllüler" />
          <div className="experience-stamp"><strong>İYİLİK</strong><span>paylaştıkça çoğalır</span></div>
        </div>
        <div className="about-copy">
          <span className="section-label light-label">Biz kimiz?</span>
          <h2>İyiliği güvenle<br />buluşturan bir adres.</h2>
          <p className="lead">İyilik Adresim; yardım etmek isteyenlerle desteğe ihtiyaç duyanlar arasında güvenilir, anlaşılır ve insan odaklı bir köprü kurmak için tasarlandı.</p>
          <div className="about-points">
            <div><span>✓</span><p><strong>Açık iletişim</strong>Her aşamada sade ve düzenli bilgilendirme.</p></div>
            <div><span>✓</span><p><strong>İnsan odaklı</strong>İhtiyaca saygılı, kapsayıcı yaklaşım.</p></div>
            <div><span>✓</span><p><strong>Ölçülebilir etki</strong>Sonuçların raporlandığı şeffaf süreç.</p></div>
          </div>
          <a className="dark-link" href="#seffaflik">Hikâyemizi keşfet <span>↗</span></a>
        </div>
      </section>

      <section className="impact-section" id="seffaflik">
        <div className="impact-copy">
          <span className="section-label light-label">Şeffaflık sözümüz</span>
          <h2>İyiliğin her adımı<br />görünür olmalı.</h2>
          <p>Yardımın nereden başlayıp nasıl sonuca ulaştığını açıkça göstermeyi hedefliyoruz. Aşağıdaki rakamlar sistem tamamlanana kadar örnek veridir.</p>
          <a href="#sorular">Nasıl çalıştığını öğren <span>→</span></a>
        </div>
        <div className="impact-numbers">
          <div><strong>4.800<sup>+</sup></strong><span>Örnek destekçi</span></div>
          <div><strong>126</strong><span>Örnek tamamlanan proje</span></div>
          <div><strong>32</strong><span>Örnek aktif çalışma</span></div>
          <div><strong>%100</strong><span>Şeffaflık hedefi</span></div>
        </div>
      </section>

      <section className="section stories" id="hikayeler">
        <div className="section-top simple">
          <div><span className="section-label">İyilik hikâyeleri</span><h2>Birlikte mümkün.</h2></div>
          <p>Yakında saha çalışmalarımızdan doğrulanmış görüntü ve hikâyeleri burada paylaşacağız.</p>
        </div>
        <div className="story-grid">
          <article className="story-main">
            <div className="play-button">▶</div>
            <div><span>Yakında</span><h3>Bir desteğin yolculuğu</h3><p>Hazırlıktan teslimata, iyiliğin tüm adımları.</p></div>
          </article>
          <article className="quote-card">
            <span className="quote-mark">“</span>
            <blockquote>Güven, yalnızca sözlerle değil; görülebilen ve takip edilebilen bir süreçle kurulur.</blockquote>
            <div><b>İyilik Adresim</b><small>Şeffaflık ilkesi</small></div>
          </article>
        </div>
      </section>

      <section className="faq-section" id="sorular">
        <div>
          <span className="section-label">Merak ettikleriniz</span><h2>Sıkça sorulan<br />sorular.</h2>
          <p>Aradığın cevabı bulamadın mı?</p><a href="mailto:merhaba@iyilikadresim.org">Bize ulaş <span>↗</span></a>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <article className={openFaq === index ? "open" : ""} key={question}>
              <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                <span>0{index + 1}</span>{question}<b>{openFaq === index ? "−" : "+"}</b>
              </button>
              {openFaq === index && <p>{answer}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div><span>Bugün bir iyiliğe yer aç</span><h2>Değişim, bir kişinin<br /><em>“Ben varım”</em> demesiyle başlar.</h2></div>
        <button className="donate-button light" type="button" onClick={() => openDonation()}>İyiliğe Ortak Ol <span>↗</span></button>
      </section>

      <footer id="iletisim">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="brand inverted" href="#top">
              <span className="brand-symbol"><i>i</i><b>a</b></span>
              <span className="brand-copy"><strong>İyilik</strong><small>Adresim</small></span>
            </a>
            <p>İyiliğin güvenilir ve şeffaf adresi.</p><a href="mailto:merhaba@iyilikadresim.org">merhaba@iyilikadresim.org</a>
          </div>
          <div><strong>Kurumsal</strong><a href="#hakkimizda">Hakkımızda</a><a href="#seffaflik">Şeffaflık</a><a href="#iletisim">İletişim</a></div>
          <div><strong>Projeler</strong><a href="#projeler">Eğitim</a><a href="#projeler">Temiz Su</a><a href="#projeler">Gıda</a></div>
          <div><strong>Bilgilendirme</strong><a href="#sorular">Sık Sorulanlar</a><a href="#iletisim">KVKK</a><a href="#iletisim">Gizlilik</a></div>
        </div>
        <div className="footer-bottom"><small>© 2026 İyilik Adresim. Tüm hakları saklıdır.</small><span>Demo proje · Gerçek ödeme alınmaz.</span></div>
      </footer>

      {donationOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDonationOpen(false)}>
          <section className="support-modal" role="dialog" aria-modal="true" aria-labelledby="support-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={() => setDonationOpen(false)}>×</button>
            {!demoComplete ? (
              <>
                <span className="modal-badge">GÜVENLİ DEMO</span><h2 id="support-title">İyiliğe ortak ol</h2>
                <p className="selected-project">{selectedProject}</p>
                <p>Bu ekran yalnızca bağış akışını göstermek içindir. Kart bilgisi istenmez ve gerçek ödeme alınmaz.</p>
                <label>Örnek destek tutarı</label>
                <div className="modal-amounts">
                  {supportAmounts.map((amount) => <button className={selectedAmount === amount ? "active" : ""} type="button" key={amount} onClick={() => setSelectedAmount(amount)}>{amount} ₺</button>)}
                </div>
                <button className="modal-submit" type="button" onClick={() => setDemoComplete(true)}>Demo adımını tamamla <span>→</span></button>
                <small>Canlı ödeme, gerekli yasal ve güvenlik kontrolleri tamamlandıktan sonra bağlanacaktır.</small>
              </>
            ) : (
              <div className="success-state">
                <span>✓</span><h2 id="support-title">Teşekkürler!</h2>
                <p>{selectedAmount} ₺ tutarındaki örnek desteğin başarıyla canlandırıldı. Herhangi bir ödeme yapılmadı.</p>
                <button className="modal-submit" type="button" onClick={() => setDonationOpen(false)}>Siteye dön</button>
              </div>
            )}
          </section>
        </div>
      )}

      {accountOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setAccountOpen(false)}>
          <section className="support-modal account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={() => setAccountOpen(false)}>×</button>
            <span className="modal-badge">ÇOK YAKINDA</span><h2 id="account-title">Üyelik sistemi</h2>
            <p>Güvenli üyelik, destek geçmişi ve kişisel bildirimler bir sonraki aşamada bu ekrana bağlanacak.</p>
            <div className="coming-features"><span>✓ Güvenli giriş</span><span>✓ Destek geçmişi</span><span>✓ Kampanya bildirimleri</span></div>
            <button className="modal-submit" type="button" onClick={() => setAccountOpen(false)}>Anladım</button>
          </section>
        </div>
      )}
    </main>
  );
}

