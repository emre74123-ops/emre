"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { User } from "@supabase/supabase-js";
import { createMemberClient } from "../../lib/supabase/member-browser";
import type { HeaderSettings } from "../../lib/header-settings";

type Section = "hesabim" | "bagislarim" | "kurban" | "sponsorluklar" | "su-kuyularim" | "projelerim" | "guvenlik";
type Profile = {
  full_name: string; phone: string; second_phone: string; birth_date: string; gender: string;
  occupation: string; blood_type: string; country: string; city: string; district: string;
  neighborhood: string; address: string; sms_opt_out: boolean; email_opt_out: boolean;
};

const initialProfile: Profile = {
  full_name: "", phone: "", second_phone: "", birth_date: "", gender: "", occupation: "",
  blood_type: "", country: "Türkiye", city: "", district: "", neighborhood: "", address: "",
  sms_opt_out: false, email_opt_out: false,
};

const sections: { id: Section; label: string; icon: string }[] = [
  { id: "bagislarim", label: "Bağışlarım", icon: "♥" },
  { id: "kurban", label: "Kurban Bağışlarım", icon: "◉" },
  { id: "sponsorluklar", label: "Sponsorluklarım", icon: "◎" },
  { id: "su-kuyularim", label: "Su Kuyularım", icon: "◇" },
  { id: "projelerim", label: "Projelerim", icon: "▤" },
  { id: "hesabim", label: "Hesabım", icon: "●" },
  { id: "guvenlik", label: "Şifre ve Güvenlik", icon: "◆" },
];

export default function AccountCenter({ settings }: { settings: HeaderSettings }) {
  const supabase = useMemo(() => createMemberClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>("hesabim");
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("bolum") as Section | null;
    if (requested && sections.some((item) => item.id === requested)) setSection(requested);
    supabase.auth.getUser().then(({ data }) => {
      const current = data.user;
      setUser(current);
      if (current) {
        const metadata = current.user_metadata || {};
        setProfile({ ...initialProfile, ...metadata, full_name: String(metadata.full_name || ""), phone: String(metadata.phone || "") });
      }
      setLoading(false);
    });
  }, [supabase]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const { data, error } = await supabase.auth.updateUser({ data: profile });
    if (data.user) setUser(data.user);
    setMessage(error ? error.message : "Bilgileriniz başarıyla güncellendi.");
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Şifreniz başarıyla değiştirildi.");
    if (!error) setPassword("");
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) return <main className="account-center-loading">Hesabınız hazırlanıyor...</main>;
  if (!user) return (
    <main className="account-center-guest">
      <h1>Hesabınıza giriş yapın</h1><p>Bu sayfayı görüntülemek için üye girişi yapmanız gerekiyor.</p>
      <Link href="/?giris=1">Ana sayfaya dön ve giriş yap</Link>
    </main>
  );

  const name = String(user.user_metadata?.full_name || user.email?.split("@")[0] || "Üyemiz");
  const visibleSections = sections.filter((item) => {
    if (item.id === "bagislarim") return settings.accountMenuDonationsEnabled;
    if (item.id === "kurban") return settings.accountMenuQurbanEnabled;
    if (item.id === "sponsorluklar") return settings.accountMenuSponsorshipsEnabled;
    if (item.id === "su-kuyularim") return settings.accountMenuWellsEnabled;
    if (item.id === "projelerim") return settings.accountMenuProjectsEnabled;
    return true;
  });

  return (
    <main className="account-center" style={{ "--account-accent": settings.accountPageAccentColor } as CSSProperties}>
      <header className="account-center-header">
        <Link href="/" className="account-center-brand"><span>ia</span><strong>İyilik Adresim</strong></Link>
        <div><span>Merhaba, <strong>{name}</strong></span><button type="button" onClick={signOut}>Çıkış Yap</button></div>
      </header>
      <div className="account-center-shell">
        <aside>
          <div className="account-profile-summary"><i>{name.slice(0, 1).toLocaleUpperCase("tr-TR")}</i><strong>{name}</strong><small>{user.email}</small></div>
          <nav>{visibleSections.map((item) => <button className={section === item.id ? "active" : ""} key={item.id} type="button" onClick={() => setSection(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>
        </aside>
        <section className="account-center-content">
          {section === "hesabim" && (
            <>
              <div className="account-section-heading"><span>PROFİL BİLGİLERİ</span><h1>Hesabım</h1><p>Bilgilerinizi dilediğiniz zaman tamamlayabilir veya güncelleyebilirsiniz.</p></div>
              <form className="account-profile-form" onSubmit={saveProfile}>
                <fieldset><legend>Genel Bilgiler</legend>
                  <label>Ad Soyad<input required value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></label>
                  <label>E-posta<input value={user.email || ""} disabled /></label>
                  <label>Cep Telefonu<input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+90 5xx xxx xx xx" /></label>
                  <label>İkinci Telefon<input value={profile.second_phone} onChange={(e) => setProfile({ ...profile, second_phone: e.target.value })} /></label>
                  <label>Doğum Tarihi<input type="date" value={profile.birth_date} onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })} /></label>
                  <label>Cinsiyet<select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}><option value="">Seçiniz</option><option>Kadın</option><option>Erkek</option><option>Belirtmek istemiyorum</option></select></label>
                  <label>Meslek<input value={profile.occupation} onChange={(e) => setProfile({ ...profile, occupation: e.target.value })} /></label>
                  <label>Kan Grubu<select value={profile.blood_type} onChange={(e) => setProfile({ ...profile, blood_type: e.target.value })}><option value="">Seçiniz</option>{["A+","A-","B+","B-","AB+","AB-","0+","0-"].map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label className="account-check"><input type="checkbox" checked={profile.sms_opt_out} onChange={(e) => setProfile({ ...profile, sms_opt_out: e.target.checked })} /> SMS almak istemiyorum</label>
                  <label className="account-check"><input type="checkbox" checked={profile.email_opt_out} onChange={(e) => setProfile({ ...profile, email_opt_out: e.target.checked })} /> E-posta almak istemiyorum</label>
                </fieldset>
                <fieldset><legend>Adres Bilgileri</legend>
                  <label>Ülke<input value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} /></label>
                  <label>İl<input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></label>
                  <label>İlçe<input value={profile.district} onChange={(e) => setProfile({ ...profile, district: e.target.value })} /></label>
                  <label>Mahalle<input value={profile.neighborhood} onChange={(e) => setProfile({ ...profile, neighborhood: e.target.value })} /></label>
                  <label className="account-full-field">Açık Adres<textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></label>
                </fieldset>
                {message && <p className="account-save-message">{message}</p>}
                <button className="account-save-button" type="submit">Bilgilerimi Güncelle</button>
              </form>
            </>
          )}
          {section === "guvenlik" && (
            <>
              <div className="account-section-heading"><span>GÜVENLİK</span><h1>Şifre ve Güvenlik</h1><p>Hesabınız için güçlü ve benzersiz bir şifre kullanın.</p></div>
              <form className="account-security-form" onSubmit={changePassword}><label>Yeni Şifre<input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>{message && <p>{message}</p>}<button type="submit">Şifremi Değiştir</button></form>
            </>
          )}
          {!["hesabim", "guvenlik"].includes(section) && <EmptyAccountSection title={sections.find((item) => item.id === section)?.label || "İşlemlerim"} />}
        </section>
      </div>
    </main>
  );
}

function EmptyAccountSection({ title }: { title: string }) {
  return <div className="account-empty-section"><span>◇</span><h1>{title}</h1><p>Henüz bu bölümde kayıtlı bir işleminiz bulunmuyor.</p><Link href="/#projeler">Projeleri incele</Link></div>;
}
