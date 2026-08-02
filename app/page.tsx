"use client";

import { useState } from "react";

const causes = [
  {
    icon: "✦",
    title: "Eğitime destek",
    text: "Çocukların okul ihtiyaçlarını karşılayarak geleceğe umut ol.",
    color: "yellow",
  },
  {
    icon: "⌂",
    title: "Aile dayanışması",
    text: "Temel ihtiyaçlarını karşılamakta zorlanan ailelere destek ver.",
    color: "coral",
  },
  {
    icon: "♡",
    title: "Sağlık yardımı",
    text: "Tedavi ve medikal ihtiyaçlar için dayanışmaya katıl.",
    color: "mint",
  },
];

const amounts = ["250", "500", "1.000", "2.500"];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState("500");
  const [demoComplete, setDemoComplete] = useState(false);

  function openDonation() {
    setDemoComplete(false);
    setDonationOpen(true);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="İyilik Adresim ana sayfa">
          <span className="brand-mark">ia</span>
          <span>İyilik Adresim</span>
        </a>
        <button
          className="menu-button"
          type="button"
          aria-label="Menüyü aç veya kapat"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>
        <nav className={menuOpen ? "nav open" : "nav"} aria-label="Ana menü">
          <a href="#nasil" onClick={() => setMenuOpen(false)}>Nasıl çalışır?</a>
          <a href="#alanlar" onClick={() => setMenuOpen(false)}>Yardım alanları</a>
          <a href="#seffaflik" onClick={() => setMenuOpen(false)}>Şeffaflık</a>
          <button className="button button-small" type="button" onClick={openDonation}>
            Bağış yap
          </button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> İyilik, doğru adresi bulunca büyür</p>
          <h1>Birlikte daha çok <em>iyiliğe</em> ulaşabiliriz.</h1>
          <p className="hero-text">
            Güvenilir yardım çağrılarını ihtiyaç sahipleriyle buluşturuyor,
            her desteğin gerçek bir değişime dönüşmesini sağlıyoruz.
          </p>
          <div className="hero-actions">
            <button className="button" type="button" onClick={openDonation}>İyiliğe ortak ol <span>→</span></button>
            <a className="text-link" href="#nasil">Nasıl çalıştığını gör <span>↓</span></a>
          </div>
          <div className="trust-row" aria-label="Platform özellikleri">
            <span>✓ Doğrulanmış ihtiyaçlar</span>
            <span>✓ Şeffaf süreç</span>
            <span>✓ Düzenli bilgilendirme</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Dayanışmayı temsil eden görsel düzen">
          <div className="sun" />
          <div className="arch arch-one" />
          <div className="arch arch-two" />
          <div className="heart-card">
            <span className="heart">♥</span>
            <strong>Her destek<br />bir umut.</strong>
          </div>
          <div className="mini-card">
            <span>Bu ay</span>
            <strong>1.284</strong>
            <small>iyilik buluşması</small>
          </div>
          <div className="dot-pattern" />
        </div>
      </section>

      <section className="impact-strip" aria-label="Etki özeti">
        <div><strong>4.800+</strong><span>Destekçi</span></div>
        <div><strong>126</strong><span>Tamamlanan yardım</span></div>
        <div><strong>32</strong><span>Aktif dayanışma</span></div>
        <p>Rakamlar şimdilik tasarımı göstermek için kullanılan örnek verilerdir.</p>
      </section>

      <section className="section steps" id="nasil">
        <div className="section-heading">
          <p className="eyebrow"><span /> Çok kolay</p>
          <h2>İyilik üç adımda<br />adresine ulaşır.</h2>
        </div>
        <div className="step-list">
          <article><b>01</b><div><h3>Bir alan seç</h3><p>Sana en yakın gelen yardım alanını keşfet.</p></div></article>
          <article><b>02</b><div><h3>Desteğini belirle</h3><p>Küçük ya da büyük; her katkı çok değerli.</p></div></article>
          <article><b>03</b><div><h3>Etkisini takip et</h3><p>Desteğinin oluşturduğu değişimden haberdar ol.</p></div></article>
        </div>
      </section>

      <section className="section causes-section" id="alanlar">
        <div className="section-heading horizontal">
          <div><p className="eyebrow"><span /> Bir iyilik seç</p><h2>Bugün kimin hayatına<br />dokunmak istersin?</h2></div>
          <p>Her başlık, doğrulama sürecinden geçen örnek yardım alanlarını temsil eder.</p>
        </div>
        <div className="cause-grid">
          {causes.map((cause) => (
            <article className={`cause-card ${cause.color}`} key={cause.title}>
              <span className="cause-icon">{cause.icon}</span>
              <h3>{cause.title}</h3>
              <p>{cause.text}</p>
              <button type="button" onClick={openDonation}>İncele <span>↗</span></button>
            </article>
          ))}
        </div>
      </section>

      <section className="section transparency" id="seffaflik">
        <div className="transparency-art">
          <span className="big-check">✓</span>
          <div className="report-card"><small>Örnek etki raporu</small><strong>%100</strong><span>izlenebilir süreç hedefi</span></div>
        </div>
        <div className="transparency-copy">
          <p className="eyebrow light"><span /> Güven her şeydir</p>
          <h2>İyiliğin her adımı<br />görünür olmalı.</h2>
          <p>Yardım çağrılarının doğrulanmasından sonuçların paylaşılmasına kadar açık ve anlaşılır bir süreç tasarlıyoruz.</p>
          <ul>
            <li><b>01</b> Kimlik ve ihtiyaç doğrulama</li>
            <li><b>02</b> Düzenli süreç bilgilendirmesi</li>
            <li><b>03</b> Sonuç ve etki paylaşımı</li>
          </ul>
        </div>
      </section>

      <section className="cta-section">
        <p>Bir iyilik, bin umut.</p>
        <h2>Değişim seninle<br />başlayabilir.</h2>
        <button className="button button-light" type="button" onClick={openDonation}>Bağış adımlarını dene <span>→</span></button>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark">ia</span><span>İyilik Adresim</span></a>
        <p>İyiliğin güvenilir adresi.</p>
        <div><a href="#nasil">Nasıl çalışır?</a><a href="#seffaflik">Şeffaflık</a><a href="mailto:merhaba@iyilikadresim.org">İletişim</a></div>
        <small>© 2026 İyilik Adresim · Demo proje — gerçek ödeme alınmaz.</small>
      </footer>

      {donationOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDonationOpen(false)}>
          <section className="donation-modal" role="dialog" aria-modal="true" aria-labelledby="donation-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={() => setDonationOpen(false)}>×</button>
            {!demoComplete ? (
              <>
                <span className="demo-badge">GÜVENLİ DEMO</span>
                <h2 id="donation-title">İyiliğe ortak ol</h2>
                <p>Bu ekran yalnızca sitenin nasıl çalışacağını gösterir. Kart bilgisi istenmez ve gerçek ödeme alınmaz.</p>
                <label>Örnek bağış tutarı</label>
                <div className="amount-grid">
                  {amounts.map((amount) => (
                    <button className={selectedAmount === amount ? "selected" : ""} type="button" key={amount} onClick={() => setSelectedAmount(amount)}>{amount} ₺</button>
                  ))}
                </div>
                <button className="button modal-button" type="button" onClick={() => setDemoComplete(true)}>Demo adımını tamamla</button>
                <small>Canlı ödeme özelliği daha sonra, gerekli güvenlik ve yasal kontroller tamamlandıktan sonra bağlanacaktır.</small>
              </>
            ) : (
              <div className="demo-success">
                <span>✓</span>
                <h2 id="donation-title">Teşekkürler!</h2>
                <p>{selectedAmount} ₺ tutarındaki örnek desteğin başarıyla simüle edildi. Herhangi bir ödeme yapılmadı.</p>
                <button className="button modal-button" type="button" onClick={() => setDonationOpen(false)}>Siteye dön</button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
