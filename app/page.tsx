"use client";

import { useState } from "react";

const causes = [
  {
    icon: "âœ¦",
    title: "EÄŸitime destek",
    text: "Ã‡ocuklarÄ±n okul ihtiyaÃ§larÄ±nÄ± karÅŸÄ±layarak geleceÄŸe umut ol.",
    color: "yellow",
  },
  {
    icon: "âŒ‚",
    title: "Aile dayanÄ±ÅŸmasÄ±",
    text: "Temel ihtiyaÃ§larÄ±nÄ± karÅŸÄ±lamakta zorlanan ailelere destek ver.",
    color: "coral",
  },
  {
    icon: "â™¡",
    title: "SaÄŸlÄ±k yardÄ±mÄ±",
    text: "Tedavi ve medikal ihtiyaÃ§lar iÃ§in dayanÄ±ÅŸmaya katÄ±l.",
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
        <a className="brand" href="#top" aria-label="Ä°yilik Adresim ana sayfa">
          <span className="brand-mark">ia</span>
          <span>Ä°yilik Adresim</span>
        </a>
        <button
          className="menu-button"
          type="button"
          aria-label="MenÃ¼yÃ¼ aÃ§ veya kapat"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>
        <nav className={menuOpen ? "nav open" : "nav"} aria-label="Ana menÃ¼">
          <a href="#nasil" onClick={() => setMenuOpen(false)}>NasÄ±l Ã§alÄ±ÅŸÄ±r?</a>
          <a href="#alanlar" onClick={() => setMenuOpen(false)}>YardÄ±m alanlarÄ±</a>
          <a href="#seffaflik" onClick={() => setMenuOpen(false)}>ÅeffaflÄ±k</a>
          <button className="button button-small" type="button" onClick={openDonation}>
            BaÄŸÄ±ÅŸ yap
          </button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Ä°yilik, doÄŸru adresi bulunca bÃ¼yÃ¼r</p>
          <h1>Birlikte daha Ã§ok <em>iyiliÄŸe</em> ulaÅŸabiliriz.</h1>
          <p className="hero-text">
            GÃ¼venilir yardÄ±m Ã§aÄŸrÄ±larÄ±nÄ± ihtiyaÃ§ sahipleriyle buluÅŸturuyor,
            her desteÄŸin gerÃ§ek bir deÄŸiÅŸime dÃ¶nÃ¼ÅŸmesini saÄŸlÄ±yoruz.
          </p>
          <div className="hero-actions">
            <button className="button" type="button" onClick={openDonation}>Ä°yiliÄŸe ortak ol <span>â†’</span></button>
            <a className="text-link" href="#nasil">NasÄ±l Ã§alÄ±ÅŸtÄ±ÄŸÄ±nÄ± gÃ¶r <span>â†“</span></a>
          </div>
          <div className="trust-row" aria-label="Platform Ã¶zellikleri">
            <span>âœ“ DoÄŸrulanmÄ±ÅŸ ihtiyaÃ§lar</span>
            <span>âœ“ Åeffaf sÃ¼reÃ§</span>
            <span>âœ“ DÃ¼zenli bilgilendirme</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="DayanÄ±ÅŸmayÄ± temsil eden gÃ¶rsel dÃ¼zen">
          <div className="sun" />
          <div className="arch arch-one" />
          <div className="arch arch-two" />
          <div className="heart-card">
            <span className="heart">â™¥</span>
            <strong>Her destek<br />bir umut.</strong>
          </div>
          <div className="mini-card">
            <span>Bu ay</span>
            <strong>1.284</strong>
            <small>iyilik buluÅŸmasÄ±</small>
          </div>
          <div className="dot-pattern" />
        </div>
      </section>

      <section className="impact-strip" aria-label="Etki Ã¶zeti">
        <div><strong>4.800+</strong><span>DestekÃ§i</span></div>
        <div><strong>126</strong><span>Tamamlanan yardÄ±m</span></div>
        <div><strong>32</strong><span>Aktif dayanÄ±ÅŸma</span></div>
        <p>Rakamlar ÅŸimdilik tasarÄ±mÄ± gÃ¶stermek iÃ§in kullanÄ±lan Ã¶rnek verilerdir.</p>
      </section>

      <section className="section steps" id="nasil">
        <div className="section-heading">
          <p className="eyebrow"><span /> Ã‡ok kolay</p>
          <h2>Ä°yilik Ã¼Ã§ adÄ±mda<br />adresine ulaÅŸÄ±r.</h2>
        </div>
        <div className="step-list">
          <article><b>01</b><div><h3>Bir alan seÃ§</h3><p>Sana en yakÄ±n gelen yardÄ±m alanÄ±nÄ± keÅŸfet.</p></div></article>
          <article><b>02</b><div><h3>DesteÄŸini belirle</h3><p>KÃ¼Ã§Ã¼k ya da bÃ¼yÃ¼k; her katkÄ± Ã§ok deÄŸerli.</p></div></article>
          <article><b>03</b><div><h3>Etkisini takip et</h3><p>DesteÄŸinin oluÅŸturduÄŸu deÄŸiÅŸimden haberdar ol.</p></div></article>
        </div>
      </section>

      <section className="section causes-section" id="alanlar">
        <div className="section-heading horizontal">
          <div><p className="eyebrow"><span /> Bir iyilik seÃ§</p><h2>BugÃ¼n kimin hayatÄ±na<br />dokunmak istersin?</h2></div>
          <p>Her baÅŸlÄ±k, doÄŸrulama sÃ¼recinden geÃ§en Ã¶rnek yardÄ±m alanlarÄ±nÄ± temsil eder.</p>
        </div>
        <div className="cause-grid">
          {causes.map((cause) => (
            <article className={`cause-card ${cause.color}`} key={cause.title}>
              <span className="cause-icon">{cause.icon}</span>
              <h3>{cause.title}</h3>
              <p>{cause.text}</p>
              <button type="button" onClick={openDonation}>Ä°ncele <span>â†—</span></button>
            </article>
          ))}
        </div>
      </section>

      <section className="section transparency" id="seffaflik">
        <div className="transparency-art">
          <span className="big-check">âœ“</span>
          <div className="report-card"><small>Ã–rnek etki raporu</small><strong>%100</strong><span>izlenebilir sÃ¼reÃ§ hedefi</span></div>
        </div>
        <div className="transparency-copy">
          <p className="eyebrow light"><span /> GÃ¼ven her ÅŸeydir</p>
          <h2>Ä°yiliÄŸin her adÄ±mÄ±<br />gÃ¶rÃ¼nÃ¼r olmalÄ±.</h2>
          <p>YardÄ±m Ã§aÄŸrÄ±larÄ±nÄ±n doÄŸrulanmasÄ±ndan sonuÃ§larÄ±n paylaÅŸÄ±lmasÄ±na kadar aÃ§Ä±k ve anlaÅŸÄ±lÄ±r bir sÃ¼reÃ§ tasarlÄ±yoruz.</p>
          <ul>
            <li><b>01</b> Kimlik ve ihtiyaÃ§ doÄŸrulama</li>
            <li><b>02</b> DÃ¼zenli sÃ¼reÃ§ bilgilendirmesi</li>
            <li><b>03</b> SonuÃ§ ve etki paylaÅŸÄ±mÄ±</li>
          </ul>
        </div>
      </section>

      <section className="cta-section">
        <p>Bir iyilik, bin umut.</p>
        <h2>DeÄŸiÅŸim seninle<br />baÅŸlayabilir.</h2>
        <button className="button button-light" type="button" onClick={openDonation}>BaÄŸÄ±ÅŸ adÄ±mlarÄ±nÄ± dene <span>â†’</span></button>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark">ia</span><span>Ä°yilik Adresim</span></a>
        <p>Ä°yiliÄŸin gÃ¼venilir adresi.</p>
        <div><a href="#nasil">NasÄ±l Ã§alÄ±ÅŸÄ±r?</a><a href="#seffaflik">ÅeffaflÄ±k</a><a href="mailto:merhaba@iyilikadresim.org">Ä°letiÅŸim</a></div>
        <small>Â© 2026 Ä°yilik Adresim Â· Demo proje â€” gerÃ§ek Ã¶deme alÄ±nmaz.</small>
      </footer>

      {donationOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDonationOpen(false)}>
          <section className="donation-modal" role="dialog" aria-modal="true" aria-labelledby="donation-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={() => setDonationOpen(false)}>Ã—</button>
            {!demoComplete ? (
              <>
                <span className="demo-badge">GÃœVENLÄ° DEMO</span>
                <h2 id="donation-title">Ä°yiliÄŸe ortak ol</h2>
                <p>Bu ekran yalnÄ±zca sitenin nasÄ±l Ã§alÄ±ÅŸacaÄŸÄ±nÄ± gÃ¶sterir. Kart bilgisi istenmez ve gerÃ§ek Ã¶deme alÄ±nmaz.</p>
                <label>Ã–rnek baÄŸÄ±ÅŸ tutarÄ±</label>
                <div className="amount-grid">
                  {amounts.map((amount) => (
                    <button className={selectedAmount === amount ? "selected" : ""} type="button" key={amount} onClick={() => setSelectedAmount(amount)}>{amount} â‚º</button>
                  ))}
                </div>
                <button className="button modal-button" type="button" onClick={() => setDemoComplete(true)}>Demo adÄ±mÄ±nÄ± tamamla</button>
                <small>CanlÄ± Ã¶deme Ã¶zelliÄŸi daha sonra, gerekli gÃ¼venlik ve yasal kontroller tamamlandÄ±ktan sonra baÄŸlanacaktÄ±r.</small>
              </>
            ) : (
              <div className="demo-success">
                <span>âœ“</span>
                <h2 id="donation-title">TeÅŸekkÃ¼rler!</h2>
                <p>{selectedAmount} â‚º tutarÄ±ndaki Ã¶rnek desteÄŸin baÅŸarÄ±yla simÃ¼le edildi. Herhangi bir Ã¶deme yapÄ±lmadÄ±.</p>
                <button className="button modal-button" type="button" onClick={() => setDonationOpen(false)}>Siteye dÃ¶n</button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
