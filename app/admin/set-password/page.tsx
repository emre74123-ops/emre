
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/browser";
import styles from "../login/login.module.css";

export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
      if (!data.session) setMessage("Davet bağlantısı geçersiz veya süresi dolmuş olabilir.");
    });
  }, []);

  async function updatePassword(formData: FormData) {
    const password = String(formData.get("password") || "");
    const confirmation = String(formData.get("confirmation") || "");
    if (password.length < 10) {
      setMessage("Şifre en az 10 karakter olmalıdır.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Şifreler birbiriyle eşleşmiyor.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("Şifre kaydedilemedi. Davet bağlantısını yeniden açmayı dene.");
      return;
    }
    router.replace("/admin");
  }

  return (
    <main className={styles.page}>
      <section className={styles.visual}>
        <div className={styles.brand}><span>ia</span><strong>İyilik Adresim</strong></div>
        <div><small>İLK KURULUM</small><h1>Güvenli şifreni<br />belirle.</h1><p>Bu şifre yalnızca İyilik Adresim yönetim paneline giriş için kullanılacaktır.</p></div>
        <footer>Supabase Auth ile korunmaktadır</footer>
      </section>
      <section className={styles.formSide}>
        <form action={updatePassword} className={styles.form}>
          <span className={styles.secure}>● ŞİFRE OLUŞTUR</span>
          <h2>Yönetici hesabı</h2>
          <p>En az 10 karakterli, güçlü ve başka yerde kullanmadığın bir şifre seç.</p>
          {message && <div className={styles.error}>{message}</div>}
          <label>Yeni şifre<input name="password" type="password" autoComplete="new-password" minLength={10} required disabled={!ready} /></label>
          <label>Yeni şifreyi tekrarla<input name="confirmation" type="password" autoComplete="new-password" minLength={10} required disabled={!ready} /></label>
          <button type="submit" disabled={!ready}>Şifreyi Kaydet <span>→</span></button>
        </form>
      </section>
    </main>
  );
}

