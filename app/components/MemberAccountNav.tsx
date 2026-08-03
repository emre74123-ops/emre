"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createMemberClient } from "../../lib/supabase/member-browser";
import type { HeaderSettings } from "../../lib/header-settings";

export default function MemberAccountNav({ signedOutLabel, onSignIn, settings }: { signedOutLabel: string; onSignIn?: () => void; settings?: HeaderSettings }) {
  const supabase = useMemo(() => createMemberClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!ready || !user) {
    return onSignIn
      ? <button className="account-button" type="button" onClick={onSignIn}><span>○</span> {signedOutLabel}</button>
      : <Link className="account-button" href="/?giris=1"><span>○</span> {signedOutLabel}</Link>;
  }

  const name = String(user.user_metadata?.full_name || user.email?.split("@")[0] || "Hesabım");

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="member-account-nav" ref={rootRef}>
      <button className="member-account-trigger" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="member-account-icon">●</span><strong>{name}</strong><span>⌄</span>
      </button>
      {open && (
        <div className="member-account-dropdown">
          <Link href="/hesabim">HESABIM</Link>
          {settings?.accountMenuDonationsEnabled !== false && <Link href="/hesabim?bolum=bagislarim">Bağışlarım</Link>}
          {settings?.accountMenuQurbanEnabled !== false && <Link href="/hesabim?bolum=kurban">Kurban Bağışlarım</Link>}
          {settings?.accountMenuSponsorshipsEnabled !== false && <Link href="/hesabim?bolum=sponsorluklar">Sponsorluklarım</Link>}
          {settings?.accountMenuWellsEnabled !== false && <Link href="/hesabim?bolum=su-kuyularim">Su Kuyularım</Link>}
          {settings?.accountMenuProjectsEnabled !== false && <Link href="/hesabim?bolum=projelerim">Projelerim</Link>}
          <Link href="/hesabim?bolum=ayarlar">Ayarlar</Link>
          <button type="button" onClick={signOut}>ÇIKIŞ</button>
        </div>
      )}
    </div>
  );
}
