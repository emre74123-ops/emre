"use client";

import { useEffect, useState } from "react";
import { createMemberClient } from "../../../lib/supabase/member-browser";

export default function MemberAuthCallback() {
  const [message, setMessage] = useState("Güvenli giriş tamamlanıyor...");

  useEffect(() => {
    const finishLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const nextValue = params.get("next") || "/";
      const safeNext = nextValue.startsWith("/") && !nextValue.startsWith("//") ? nextValue : "/";
      if (!code) {
        setMessage("Giriş bağlantısı geçersiz veya süresi dolmuş.");
        return;
      }
      const { error } = await createMemberClient().auth.exchangeCodeForSession(code);
      if (error) {
        setMessage("Giriş tamamlanamadı. Lütfen yeniden deneyin.");
        return;
      }
      window.location.replace(safeNext);
    };
    void finishLogin();
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f8f5ed", color: "#0b3d35" }}>
      <section style={{ maxWidth: 460, padding: 38, background: "#fff", textAlign: "center", boxShadow: "0 20px 60px rgba(8,45,39,.12)" }}>
        <strong style={{ display: "block", fontSize: 24, fontFamily: "Georgia, serif", marginBottom: 12 }}>İyilik Adresim</strong>
        <p>{message}</p>
      </section>
    </main>
  );
}
