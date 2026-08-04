import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer id="iletisim">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="brand inverted" href="/">
            <span className="brand-symbol"><i>i</i><b>a</b></span>
            <span className="brand-copy"><strong>İyilik</strong><small>Adresim</small></span>
          </Link>
          <p>İyiliğin güvenilir ve şeffaf adresi.</p>
          <a href="mailto:merhaba@iyilikadresim.org">merhaba@iyilikadresim.org</a>
        </div>
        <div><strong>Kurumsal</strong><Link href="/#hakkimizda">Hakkımızda</Link><Link href="/#seffaflik">Şeffaflık</Link><Link href="/#iletisim">İletişim</Link></div>
        <div><strong>Projeler</strong><Link href="/#projeler">Eğitim</Link><Link href="/#projeler">Temiz Su</Link><Link href="/#projeler">Gıda</Link></div>
        <div><strong>Bilgilendirme</strong><Link href="/#sorular">Sık Sorulanlar</Link><Link href="/#iletisim">KVKK</Link><Link href="/#iletisim">Gizlilik</Link></div>
      </div>
      <div className="footer-bottom"><small>© 2026 İyilik Adresim. Tüm hakları saklıdır.</small><span>Demo proje · Gerçek ödeme alınmaz.</span></div>
    </footer>
  );
}
