"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "../../../lib/supabase/browser";
import styles from "../login/login.module.css";

export default function AccountPage() {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    if (password.length < 10) {
      setMessage("Şifren en az 10 karakter olmalıdır.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setSaving(true);
    const { error } = await createClient().auth.updateUser({ password });
    setSaving(false);
    setMessage(error ? "Şifre değiştirilemedi. Lütfen tekrar dene." : "Şifren başarıyla değiştirildi.");
    if (!error) event.currentTarget.reset();
  }

  return (
    <main className={styles.page}>
      <section className={styles.visual}>
        <Link href="/admin" className={styles.brand}><span>ia</span><strong>İyilik Adresim</strong></Link>
        <div><small>HESAP GÜVENLİĞİ</small><h1>Şifreni yalnızca<br />sen belirle.</h1><p>Güçlü ve başka bir yerde kullanmadığın bir şifre seç.</p></div>
        <footer>© 2026 İyilik Adresim</footer>
      </section>
      <section className={styles.formSide}>
        <form className={styles.form} onSubmit={changePassword}>
          <span className={styles.secure}>● GÜVENLİ HESAP</span>
          <h2>Şifre Değiştir</h2>
          <p>Yeni yönetici şifreni oluştur.</p>
          {message && <div className={styles.error}>{message}</div>}
          <label>Yeni şifre<input name="password" type="password" minLength={10} autoComplete="new-password" required /></label>
          <label>Yeni şifreyi tekrar yaz<input name="confirmation" type="password" minLength={10} autoComplete="new-password" required /></label>
          <button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Şifreyi Kaydet"} <span>→</span></button>
          <small><Link href="/admin">← Yönetim paneline dön</Link></small>
        </form>
      </section>
    </main>
  );
}

