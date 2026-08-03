"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createMemberClient } from "../../lib/supabase/member-browser";

type Mode = "login" | "register" | "reset";

const countries = [
  { iso: "TR", flag: "🇹🇷", dial: "+90", name: "Türkiye", placeholder: "501 234 56 78", maxDigits: 10 },
  { iso: "DE", flag: "🇩🇪", dial: "+49", name: "Almanya", placeholder: "151 23456789", maxDigits: 11 },
  { iso: "NL", flag: "🇳🇱", dial: "+31", name: "Hollanda", placeholder: "6 12345678", maxDigits: 9 },
  { iso: "BE", flag: "🇧🇪", dial: "+32", name: "Belçika", placeholder: "470 12 34 56", maxDigits: 9 },
  { iso: "FR", flag: "🇫🇷", dial: "+33", name: "Fransa", placeholder: "6 12 34 56 78", maxDigits: 9 },
  { iso: "GB", flag: "🇬🇧", dial: "+44", name: "Birleşik Krallık", placeholder: "7400 123456", maxDigits: 10 },
  { iso: "US", flag: "🇺🇸", dial: "+1", name: "ABD", placeholder: "555 123 4567", maxDigits: 10 },
  { iso: "AT", flag: "🇦🇹", dial: "+43", name: "Avusturya", placeholder: "664 1234567", maxDigits: 10 },
  { iso: "CH", flag: "🇨🇭", dial: "+41", name: "İsviçre", placeholder: "79 123 45 67", maxDigits: 9 },
  { iso: "AZ", flag: "🇦🇿", dial: "+994", name: "Azerbaycan", placeholder: "50 123 45 67", maxDigits: 9 },
];

function formatPhoneDigits(value: string, iso: string) {
  const digits = value.replace(/\D/g, "");
  if (iso === "TR") return digits.replace(/^(\d{3})(\d{0,3})(\d{0,2})(\d{0,2}).*$/, (_all, a, b, c, d) => [a, b, c, d].filter(Boolean).join(" "));
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

export default function AccountPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const supabase = useMemo(() => createMemberClient(), []);
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [countryIso, setCountryIso] = useState("TR");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const selectedCountry = countries.find((country) => country.iso === countryIso) || countries[0];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "register" && countryIso === "TR" && (!phoneDigits.startsWith("5") || phoneDigits.length !== 10)) {
      setMessage("Telefon numarası 5 ile başlayan 10 haneli bir cep telefonu olmalıdır.");
      return;
    }
    if (mode === "register" && countryIso !== "TR" && phoneDigits.length < 7) {
      setMessage("Lütfen geçerli bir telefon numarası girin.");
      return;
    }
    setLoading(true);
    setMessage("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setMessage(error ? error.message : "Giriş başarılı.");
    } else if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim(), phone: `${selectedCountry.dial}${phoneDigits}` },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
      setMessage(error ? error.message : "Kayıt oluşturuldu. E-posta doğrulama bağlantınızı kontrol edin.");
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      });
      setMessage(error ? error.message : "Şifre yenileme bağlantısı e-posta adresinize gönderildi.");
    }
    setLoading(false);
  }

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    setMessage("Güvenli çıkış yapıldı.");
  }

  return (
    <div className="modal-backdrop account-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="support-modal account-modal customer-account-modal" role="dialog" aria-modal="true" aria-labelledby="customer-account-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={onClose}>×</button>
        {user ? (
          <div className="account-signed-in">
            <span className="modal-badge">HESABIM</span>
            <div className="account-avatar">{(user.user_metadata?.full_name || user.email || "Ü").slice(0, 1).toLocaleUpperCase("tr-TR")}</div>
            <h2 id="customer-account-title">Hoş geldiniz</h2>
            <strong>{user.user_metadata?.full_name || "İyilik Adresim üyesi"}</strong>
            <p>{user.email}</p>
            <div className="coming-features"><span>✓ Sepetiniz bu cihazda korunur</span><span>✓ Üyelik ödeme için zorunlu değildir</span><span>✓ Bağış geçmişi ödeme sistemiyle açılacak</span></div>
            <button className="modal-submit account-secondary-submit" disabled={loading} type="button" onClick={signOut}>Çıkış yap</button>
          </div>
        ) : (
          <>
            {mode !== "reset" && (
              <div className="account-tabs" role="tablist" aria-label="Üyelik işlemleri">
                <button className={mode === "login" ? "active" : ""} type="button" role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setMessage(""); }}>Giriş Yap</button>
                <button className={mode === "register" ? "active" : ""} type="button" role="tab" aria-selected={mode === "register"} onClick={() => { setMode("register"); setMessage(""); }}>Üye Ol</button>
              </div>
            )}
            <div className="account-form-heading">
              <h2 id="customer-account-title">{mode === "login" ? "Hoş Geldiniz" : mode === "register" ? "Aramıza Katılın" : "Şifrenizi Yenileyin"}</h2>
              <p>{mode === "login" ? "Hesabınıza giriş yapın" : mode === "register" ? "Hemen ücretsiz üye olun" : "E-posta adresinize yenileme bağlantısı gönderelim"}</p>
            </div>
            <form className="customer-auth-form" onSubmit={submit}>
              {mode === "register" && <label><span>Ad Soyad</span><input autoComplete="name" placeholder="Ad Soyad" required value={name} onChange={(event) => setName(event.target.value)} /></label>}
              <label><span>E-posta adresi</span><input type="email" autoComplete="email" placeholder="E-posta Adresi" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              {mode === "register" && (
                <div className="phone-field-group">
                  <span>Telefon numarası</span>
                  <div className="phone-country-field">
                    <label className="country-picker" aria-label="Ülke kodu">
                      <select value={countryIso} onChange={(event) => { setCountryIso(event.target.value); setPhoneDigits(""); }}>
                        {countries.map((country) => <option key={country.iso} value={country.iso}>{country.flag} {country.name} ({country.dial})</option>)}
                      </select>
                      <b aria-hidden="true">{selectedCountry.flag}</b><i aria-hidden="true">⌄</i>
                    </label>
                    <strong>{selectedCountry.dial}</strong>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      aria-label="Telefon numarası"
                      placeholder={selectedCountry.placeholder}
                      required
                      value={formatPhoneDigits(phoneDigits, countryIso)}
                      onChange={(event) => setPhoneDigits(event.target.value.replace(/\D/g, "").slice(0, selectedCountry.maxDigits))}
                    />
                  </div>
                </div>
              )}
              {mode !== "reset" && <label><span>Şifre</span><input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder="Şifreniz" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
              {message && <p className="auth-message" role="status">{message}</p>}
              <button className="modal-submit account-main-submit" disabled={loading} type="submit">{loading ? "Lütfen bekleyin..." : mode === "login" ? "Giriş Yap" : mode === "register" ? "Üye Ol" : "Yenileme Bağlantısı Gönder"}</button>
            </form>
            <div className="auth-mode-actions">
              {mode === "login" && <button type="button" onClick={() => { setMode("reset"); setMessage(""); }}>🔒 Şifremi Unuttum</button>}
              {mode === "reset" && <button type="button" onClick={() => { setMode("login"); setMessage(""); }}>← Giriş ekranına dön</button>}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
