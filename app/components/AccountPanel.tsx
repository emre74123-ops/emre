"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createMemberClient } from "../../lib/supabase/member-browser";

type Mode = "login" | "register" | "reset";

export default function AccountPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const supabase = useMemo(() => createMemberClient(), []);
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
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
          data: { full_name: name.trim() },
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

  async function social(provider: "google" | "facebook") {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (error) {
      setMessage(`${provider === "google" ? "Google" : "Facebook"} girişi henüz etkin değil: ${error.message}`);
      setLoading(false);
    }
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
            <span className="modal-badge">KOLAY VE GÜVENLİ</span>
            <h2 id="customer-account-title">{mode === "login" ? "Üye girişi" : mode === "register" ? "Kolayca üye ol" : "Şifreni yenile"}</h2>
            <p>Üye olmadan da bağış sepetini kullanabilirsiniz. Hesap açmak geçmiş işlemlerinize daha kolay ulaşmanızı sağlar.</p>
            {mode !== "reset" && (
              <div className="social-login-grid">
                <button type="button" disabled={loading} onClick={() => social("google")}><b>G</b> Google ile devam et</button>
                <button type="button" disabled={loading} onClick={() => social("facebook")}><b>f</b> Facebook ile devam et</button>
              </div>
            )}
            {mode !== "reset" && <div className="auth-divider"><span>veya e-posta ile</span></div>}
            <form className="customer-auth-form" onSubmit={submit}>
              {mode === "register" && <label>Adınız ve soyadınız<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></label>}
              <label>E-posta adresiniz<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              {mode !== "reset" && <label>Şifreniz<input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
              {message && <p className="auth-message" role="status">{message}</p>}
              <button className="modal-submit" disabled={loading} type="submit">{loading ? "Lütfen bekleyin..." : mode === "login" ? "Giriş yap" : mode === "register" ? "Üyeliği oluştur" : "Yenileme bağlantısı gönder"} <span>→</span></button>
            </form>
            <div className="auth-mode-actions">
              {mode === "login" ? <><button type="button" onClick={() => { setMode("register"); setMessage(""); }}>Hesabın yok mu? Üye ol</button><button type="button" onClick={() => { setMode("reset"); setMessage(""); }}>Şifremi unuttum</button></> : <button type="button" onClick={() => { setMode("login"); setMessage(""); }}>Zaten hesabın var mı? Giriş yap</button>}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
