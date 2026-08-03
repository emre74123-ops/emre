"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AsYouType, getCountries, getCountryCallingCode, isPossiblePhoneNumber, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { createMemberClient } from "../../lib/supabase/member-browser";

type Mode = "login" | "register" | "reset";

const countryNames = new Intl.DisplayNames(["tr"], { type: "region" });
const countries = getCountries()
  .map((iso) => ({
    iso,
    dial: `+${getCountryCallingCode(iso)}`,
    name: countryNames.of(iso) || iso,
  }))
  .sort((a, b) => a.iso === "TR" ? -1 : b.iso === "TR" ? 1 : a.name.localeCompare(b.name, "tr"));

function flagUrl(iso: string) {
  return `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;
}

function formatPhoneDigits(value: string, iso: CountryCode) {
  return new AsYouType(iso).input(value.replace(/\D/g, ""));
}

export default function AccountPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const supabase = useMemo(() => createMemberClient(), []);
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [countryIso, setCountryIso] = useState<CountryCode>("TR");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const selectedCountry = countries.find((country) => country.iso === countryIso) || countries[0];
  const filteredCountries = countries.filter((country) => `${country.name} ${country.iso} ${country.dial}`.toLocaleLowerCase("tr-TR").includes(countryQuery.trim().toLocaleLowerCase("tr-TR")));

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsedPhone = mode === "register" ? parsePhoneNumberFromString(phoneDigits, countryIso) : undefined;
    if (mode === "register" && countryIso === "TR" && (!phoneDigits.startsWith("5") || phoneDigits.length !== 10)) {
      setMessage("Telefon numarası 5 ile başlayan 10 haneli bir cep telefonu olmalıdır.");
      return;
    }
    if (mode === "register" && countryIso !== "TR" && !isPossiblePhoneNumber(phoneDigits, countryIso)) {
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
          data: { full_name: name.trim(), phone: (parsedPhone as unknown as { number?: string } | undefined)?.number || `${selectedCountry.dial}${phoneDigits}` },
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
                    <button className="country-picker" type="button" aria-label={`Ülke seç: ${selectedCountry.name}`} aria-expanded={countryOpen} onClick={() => setCountryOpen((value) => !value)}>
                      <img src={flagUrl(selectedCountry.iso)} alt="" /><i aria-hidden="true">⌄</i>
                    </button>
                    <strong>{selectedCountry.dial}</strong>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      aria-label="Telefon numarası"
                      placeholder={countryIso === "TR" ? "501 234 56 78" : "Telefon Numarası"}
                      required
                      value={formatPhoneDigits(phoneDigits, countryIso)}
                      onChange={(event) => setPhoneDigits(event.target.value.replace(/\D/g, "").slice(0, 15))}
                    />
                    {countryOpen && (
                      <div className="country-dropdown">
                        <input autoFocus value={countryQuery} onChange={(event) => setCountryQuery(event.target.value)} placeholder="Ülke veya kod ara..." aria-label="Ülke ara" />
                        <div>
                          {filteredCountries.map((country) => (
                            <button key={country.iso} type="button" className={country.iso === countryIso ? "active" : ""} onClick={() => { setCountryIso(country.iso); setPhoneDigits(""); setCountryOpen(false); setCountryQuery(""); }}>
                              <img src={flagUrl(country.iso)} alt="" /><span>{country.name}</span><b>{country.dial}</b>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
