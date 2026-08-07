"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { cartTotal, formatTry, type CartItem } from "../../lib/cart";
import { createMemberClient } from "../../lib/supabase/member-browser";

export default function CartPanel({
  open,
  checkoutIntent = 0,
  items,
  onClose,
  onQuantity,
  onRemove,
  onClear,
  onOpenAccount,
}: {
  open: boolean;
  checkoutIntent?: number;
  items: CartItem[];
  onClose: () => void;
  onQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onOpenAccount: () => void;
}) {
  const supabase = useMemo(() => createMemberClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(() => checkoutIntent > 0);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        setName(String(data.user.user_metadata?.full_name || ""));
        setEmail(data.user.email || "");
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (!open) return null;
  const total = cartTotal(items);

  function closePanel() {
    setCheckoutOpen(false);
    setCheckoutReady(false);
    onClose();
  }

  function prepareCheckout(event: React.FormEvent) {
    event.preventDefault();
    if (!consent) return;
    setCheckoutReady(true);
  }

  return (
    <div className="cart-backdrop" role="presentation" onMouseDown={closePanel}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>BAĞIŞ SEPETİ</span><h2 id="cart-title">Sepetim</h2></div><button type="button" aria-label="Sepeti kapat" onClick={closePanel}>×</button></header>
        {!items.length ? (
          <div className="empty-cart"><i>♡</i><h3>Sepetiniz henüz boş</h3><p>Destek olmak istediğiniz projeyi seçerek güvenli bağış akışına başlayabilirsiniz.</p><button type="button" onClick={closePanel}>Projeleri incele</button></div>
        ) : checkoutReady ? (
          <div className="checkout-ready">
            <i>✓</i><span>ÖDEMEYE HAZIR</span><h3>Bilgileriniz alındı</h3>
            <p><strong>{name}</strong><br />{email}<br />{phone}</p>
            <div><span>Sepet toplamı</span><b>{formatTry(total)}</b></div>
            <p className="checkout-notice">Gerçek ödeme kuruluşu henüz bağlanmadığı için kart bilgisi alınmıyor. Ödeme entegrasyonu tamamlandığında bu adım güvenli ödeme ekranına ilerleyecek.</p>
            <button type="button" onClick={() => setCheckoutReady(false)}>Bilgileri düzenle</button>
          </div>
        ) : checkoutOpen ? (
          <form className="guest-checkout" onSubmit={prepareCheckout}>
            <div className="checkout-heading"><span>MİSAFİR VEYA ÜYE</span><h3>İletişim bilgileri</h3><p>Üye olmak zorunda değilsiniz. Ödeme ve makbuz bilgileri için aşağıdaki alanlar yeterlidir.</p></div>
            {user ? <div className="signed-checkout">✓ {user.email} hesabıyla devam ediyorsunuz</div> : <div className="guest-account-hint"><span>İsterseniz işlemlerinizi takip etmek için giriş yapabilirsiniz.</span><button type="button" onClick={onOpenAccount}>Giriş yap</button></div>}
            <label>Adınız ve soyadınız<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>E-posta adresiniz<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>Telefon numaranız<input type="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
            <label className="checkout-consent"><input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>KVKK bilgilendirmesini okudum; ödeme ve makbuz işlemleri için bilgilerimin kullanılmasını kabul ediyorum.</span></label>
            <div className="cart-total compact"><span>Toplam</span><strong>{formatTry(total)}</strong></div>
            <button className="cart-checkout-button" type="submit">Ödeme adımına geç <span>→</span></button>
            <button className="checkout-back" type="button" onClick={() => setCheckoutOpen(false)}>← Sepete dön</button>
          </form>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <article key={item.id}>
                  <div className="cart-item-icon">♡</div>
                  <div>
                    <strong>{item.project}</strong>
                    {item.selections?.length ? <small>{item.selections.map((selection) => `${selection.group}: ${selection.option}`).join(" · ")}</small> : null}
                    <small>Birim destek: {formatTry(item.amount)}</small>
                    <span>{formatTry(item.amount * item.quantity)}</span>
                  </div>
                  <div className="cart-quantity"><button type="button" onClick={() => onQuantity(item.id, item.quantity - 1)}>−</button><b>{item.quantity}</b><button type="button" onClick={() => onQuantity(item.id, item.quantity + 1)}>+</button></div>
                  <button className="cart-remove" type="button" aria-label={`${item.project} sepetten çıkar`} onClick={() => onRemove(item.id)}>×</button>
                </article>
              ))}
            </div>
            <button className="clear-cart" type="button" onClick={onClear}>Sepeti temizle</button>
            <footer>
              <div className="cart-total"><span>Sepet toplamı<small>{items.reduce((count, item) => count + item.quantity, 0)} destek</small></span><strong>{formatTry(total)}</strong></div>
              <button className="cart-checkout-button" type="button" onClick={() => setCheckoutOpen(true)}>Üye olmadan devam et <span>→</span></button>
              <small>Üyelik zorunlu değildir. Kart bilgisi şu anda alınmaz.</small>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
