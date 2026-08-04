"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { readCart, writeCart, type CartItem } from "../../lib/cart";
import styles from "./donation-module.module.css";

type Category = "all" | "general" | "qurban" | "water" | "zakat" | "orphan";
type Project = {
  id: string;
  category: Category;
  title: string;
  description: string;
  image: string;
  badge: string;
  fixedPrice?: number;
  suggested: number[];
};

const categories: { id: Category; label: string; icon: string }[] = [
  { id: "all", label: "Tüm Bağışlar", icon: "✦" },
  { id: "general", label: "Genel Bağış", icon: "♡" },
  { id: "qurban", label: "Kurban & Akika", icon: "◒" },
  { id: "water", label: "Su Kuyusu", icon: "♒" },
  { id: "zakat", label: "Zekât & Fitre", icon: "◇" },
  { id: "orphan", label: "Yetim Desteği", icon: "♙" },
];

const projects: Project[] = [
  {
    id: "water-africa",
    category: "water",
    title: "Afrika Su Kuyusu",
    description: "Temiz suya erişimi olmayan bir bölgeye kalıcı bir su kaynağı kazandırın.",
    image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1000&q=85",
    badge: "Kalıcı iyilik",
    fixedPrice: 2900,
    suggested: [1, 2, 3, 4],
  },
  {
    id: "general-support",
    category: "general",
    title: "İyilik Fonu",
    description: "Bağışınız, öncelikli ihtiyaçların hızlı ve şeffaf biçimde karşılanmasına destek olur.",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=85",
    badge: "En çok ihtiyaç duyulan",
    suggested: [250, 500, 1000, 2000],
  },
  {
    id: "orphan-meal",
    category: "orphan",
    title: "Yetim Çocuklara Yemek",
    description: "Bir çocuğun günlük sıcak yemek ihtiyacına katkıda bulunun.",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=85",
    badge: "Bir sofraya ortak ol",
    suggested: [150, 300, 600, 1200],
  },
  {
    id: "qurban-share",
    category: "qurban",
    title: "Kurban Hissesi",
    description: "Kurban bağışınızı ihtiyaç sahiplerine güvenle ulaştırıyoruz.",
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1000&q=85",
    badge: "Hisse bağışı",
    fixedPrice: 4750,
    suggested: [1, 2, 3, 4],
  },
  {
    id: "zakat",
    category: "zakat",
    title: "Zekât Bağışı",
    description: "Zekâtınızı ihtiyaç sahibi ailelere titizlikle ulaştıralım.",
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1000&q=85",
    badge: "Güvenli ulaştırma",
    suggested: [500, 1000, 2500, 5000],
  },
];

const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export default function DonationModule({ embedded = false }: { embedded?: boolean }) {
  const cardsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const filtered = category === "all" ? projects : projects.filter((project) => project.category === category);

  function addToCart(project: Project) {
    const picked = selected[project.id] ?? project.suggested[0];
    const quantity = project.fixedPrice ? picked : 1;
    const typed = Number(custom[project.id]?.replace(",", "."));
    const amount = project.fixedPrice ?? (Number.isFinite(typed) && typed > 0 ? typed : picked);
    const id = `${project.id}-${amount}`;
    const current = readCart();
    const existing = current.find((item) => item.id === id);
    const next: CartItem[] = existing
      ? current.map((item) => item.id === id ? { ...item, quantity: Math.min(99, item.quantity + quantity) } : item)
      : [...current, { id, project: project.title, amount, quantity }];
    writeCart(next);
    window.dispatchEvent(new CustomEvent("iyilik-cart-updated", { detail: next }));
    window.dispatchEvent(new Event("iyilik-cart-open"));
    setNotice(`${project.title} sepete eklendi.`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function moveCards(direction: -1 | 1) {
    cardsRef.current?.scrollBy({ left: direction * Math.min(760, cardsRef.current.clientWidth * .82), behavior: "smooth" });
  }

  function moveCategories(direction: -1 | 1) {
    categoriesRef.current?.scrollBy({ left: direction * Math.min(600, categoriesRef.current.clientWidth * .72), behavior: "smooth" });
  }

  return (
    <section className={`${styles.page}${embedded ? ` ${styles.embedded}` : ""}`}>
      {!embedded && <div className={styles.previewBar}>
        <span><i /> DENEME ALANI</span>
        <p>Bu sayfada gerçek ödeme alınmaz.</p>
        <Link href="/">Siteye dön →</Link>
      </div>}

      <section className={styles.moduleShell}>
        <div className={styles.categoryScroller}>
          <button className={`${styles.categoryArrow} ${styles.categoryArrowLeft}`} type="button" aria-label="Önceki bağış kategorileri" onClick={() => moveCategories(-1)}>←</button>
          <div className={styles.categoryRail} aria-label="Bağış kategorileri" ref={categoriesRef}>
            {categories.map((item) => (
              <button className={category === item.id ? styles.activeCategory : ""} key={item.id} onClick={() => setCategory(item.id)}>
                <i>{item.icon}</i><span>{item.label}</span>
              </button>
            ))}
          </div>
          <button className={`${styles.categoryArrow} ${styles.categoryArrowRight}`} type="button" aria-label="Sonraki bağış kategorileri" onClick={() => moveCategories(1)}>→</button>
          <span className={styles.swipeHint}>Kaydır <b>↔</b></span>
        </div>

        <div className={styles.contentGrid}>
            <div className={styles.sectionHeading}>
              <div><span>BAĞIŞ ALANLARI</span><h2>Destek projeleri</h2></div>
              <div className={styles.carouselActions}>
                <p>{filtered.length} proje</p>
                <button type="button" aria-label="Önceki bağış projeleri" onClick={() => moveCards(-1)}>←</button>
                <button type="button" aria-label="Sonraki bağış projeleri" onClick={() => moveCards(1)}>→</button>
              </div>
            </div>
            <div className={styles.cards} ref={cardsRef}>
              {filtered.map((project) => {
                const picked = selected[project.id] ?? project.suggested[0];
                return (
                  <article className={styles.card} key={project.id}>
                    <div className={styles.cardImage} style={{ backgroundImage: `url("${project.image}")` }}>
                      <span>{project.badge}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      <small>{project.fixedPrice ? "Hisse adedi" : "Bağış tutarı"}</small>
                      <div className={styles.choices}>
                        {project.suggested.map((amount) => (
                          <button className={picked === amount ? styles.selectedChoice : ""} key={amount} onClick={() => setSelected((state) => ({ ...state, [project.id]: amount }))}>
                            {project.fixedPrice ? amount : money.format(amount)}
                          </button>
                        ))}
                      </div>
                      <div className={styles.cardAction}>
                        <label>
                          <span>{project.fixedPrice ? money.format(project.fixedPrice * picked) : "₺"}</span>
                          {!project.fixedPrice && <input inputMode="numeric" value={custom[project.id] || ""} onChange={(event) => setCustom((state) => ({ ...state, [project.id]: event.target.value.replace(/[^\d,]/g, "") }))} placeholder="Başka tutar" />}
                        </label>
                        <button onClick={() => addToCart(project)}>Sepete ekle <b>+</b></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
        </div>
      </section>
      {notice && <div className={styles.toast}>{notice}</div>}
    </section>
  );
}
