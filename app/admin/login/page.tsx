
import Link from "next/link";
import { login } from "./actions";
import styles from "./login.module.css";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const message = params.error === "yetkisiz"
    ? "Bu hesabın yönetim paneline erişim yetkisi bulunmuyor."
    : params.error
      ? "E-posta adresi veya şifre hatalı."
      : "";

  return (
    <main className={styles.page}>
      <section className={styles.visual}>
        <Link href="/" className={styles.brand}><span>ia</span><strong>İyilik Adresim</strong></Link>
        <div><small>Güvenli yönetim</small><h1>İyiliği güvenle<br />yönet.</h1><p>Kampanyalar, başvurular ve site içerikleri tek bir güvenli merkezde.</p></div>
        <footer>© 2026 İyilik Adresim</footer>
      </section>
      <section className={styles.formSide}>
        <form action={login} className={styles.form}>
          <span className={styles.secure}>● GÜVENLİ GİRİŞ</span>
          <h2>Yönetim Paneli</h2>
          <p>Devam etmek için yetkili hesabınla giriş yap.</p>
          {message && <div className={styles.error}>{message}</div>}
          <label>E-posta adresi<input name="email" type="email" autoComplete="email" required placeholder="ornek@iyilikadresim.org" /></label>
          <label>Şifre<input name="password" type="password" autoComplete="current-password" required placeholder="••••••••••••" /></label>
          <button type="submit">Giriş Yap <span>→</span></button>
          <small>Bu sayfa Supabase Auth ile korunmaktadır.</small>
        </form>
      </section>
    </main>
  );
}

