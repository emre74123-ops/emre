"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { defaultModuleSettings, donationCategoryOptions, type ModuleSettings } from "../../lib/module-settings";
import DonationModule from "../components/DonationModule";
import styles from "./admin.module.css";

type ModuleTab = "general" | "desktop" | "mobile" | "placement";
type Device = "desktop" | "mobile";
type GalleryImage = { path: string; url: string; size: number; device: Device };

export default function ModuleManager({ showToast }: { showToast: (message: string) => void }) {
  const [settings, setSettings] = useState<ModuleSettings>(defaultModuleSettings);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [tab, setTab] = useState<ModuleTab>("general");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/modules", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/admin/modules/images", { cache: "no-store" }).then((response) => response.json()),
    ]).then(([settingsResult, imageResult]) => {
      if (settingsResult.settings) {
        setSettings({
          ...defaultModuleSettings,
          ...settingsResult.settings,
          donation: {
            ...defaultModuleSettings.donation,
            ...settingsResult.settings.donation,
            categoryImages: {
              ...defaultModuleSettings.donation.categoryImages,
              ...settingsResult.settings.donation?.categoryImages,
            },
          },
        });
      }
      setImages(imageResult.images || []);
    }).catch(() => undefined);
  }, []);

  const donation = settings.donation;
  const update = (changes: Partial<typeof donation>) => setSettings((current) => ({
    ...current,
    donation: { ...current.donation, ...changes },
  }));

  async function save() {
    setSaving(true);
    const response = await fetch("/api/admin/modules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return showToast(result.error || "Modül ayarları kaydedilemedi.");
    setSettings(result.settings);
    showToast("Modül ayarları canlı siteye kaydedildi.");
  }

  function toggleCategory(id: string) {
    const visible = donation.visibleCategories.includes(id);
    update({ visibleCategories: visible ? donation.visibleCategories.filter((item) => item !== id) : [...donation.visibleCategories, id] });
  }

  async function uploadImage(file: File, device: Device) {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("device", device);
    const response = await fetch("/api/admin/modules/upload", { method: "POST", body });
    const result = await response.json();
    setUploading(false);
    if (!response.ok) return showToast(result.error || "Görsel yüklenemedi.");
    setImages((current) => [{ path: result.path, url: result.url, size: file.size, device }, ...current]);
    showToast("Görsel galeriye eklendi.");
  }

  async function deleteImage(image: GalleryImage) {
    if (!window.confirm("Bu görsel kalıcı olarak silinsin mi?")) return;
    const response = await fetch("/api/admin/modules/images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: image.path }),
    });
    const result = await response.json();
    if (!response.ok) return showToast(result.error || "Görsel silinemedi.");
    setImages((current) => current.filter((item) => item.path !== image.path));
    showToast("Görsel silindi.");
  }

  function selectCategoryImage(id: string, device: Device, url: string) {
    update({
      categoryImages: {
        ...donation.categoryImages,
        [id]: { ...donation.categoryImages[id], [device]: url },
      },
    });
  }

  const preview = (device: "desktop" | "mobile") => (
    <div className={`${styles.modulePreview} ${device === "mobile" ? styles.modulePreviewMobile : styles.modulePreviewDesktop}`}>
      <div className={styles.modulePreviewLabel}>{device === "mobile" ? "Mobil canlı görünüm" : "Web canlı görünüm"}</div>
      <div className={styles.modulePreviewViewport}><DonationModule embedded settings={donation} previewDevice={device} /></div>
    </div>
  );

  const gallery = (device: Device) => {
    const deviceImages = images.filter((image) => image.device === device);
    const deviceLabel = device === "desktop" ? "Web" : "Mobil";
    return (
      <div className={styles.deviceGallery}>
        <div className={styles.moduleUpload}>
          <div><h3>{deviceLabel} görsel galerisi</h3><p>Sabit piksel zorunluluğu yoktur. Kart ölçüsünü üstte istediğiniz gibi belirleyin. WebP ve 250 KB altı önerilir.</p></div>
          <label className={styles.primaryButton}>{uploading ? "Yükleniyor..." : "+ Görsel Yükle"}<input type="file" hidden accept=".webp,.jpg,.jpeg,.png,.svg,image/webp,image/jpeg,image/png,image/svg+xml" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file, device); event.target.value = ""; }} /></label>
        </div>
        <div className={styles.deviceCategoryImages}>
          {donationCategoryOptions.map(([id, label]) => <section className={styles.deviceCategoryImageRow} key={id}>
            <div><strong>{label}</strong><small>Aktif {deviceLabel.toLocaleLowerCase("tr-TR")} görseli</small></div>
            <div className={styles.selectedModuleImage}><Image src={donation.categoryImages[id][device]} alt="" fill sizes="180px" /></div>
            <div className={styles.imageSelectors}>
              {deviceImages.map((image) => <div key={image.path}>
                <Image src={image.url} alt={`${deviceLabel} galeri görseli`} fill sizes="90px" />
                <button type="button" onClick={() => selectCategoryImage(id, device, image.url)}>Seç</button>
                <button type="button" aria-label="Görseli sil" onClick={() => void deleteImage(image)}>×</button>
              </div>)}
            </div>
          </section>)}
        </div>
        {deviceImages.length === 0 ? <div className={styles.emptyModuleGallery}>Bu bölümde henüz özel görsel yok. Mevcut örnek görseller kullanılmaya devam ediyor.</div> : null}
      </div>
    );
  };

  return (
    <>
      <div className={styles.pageHeading}>
        <div><p>Site bileşenleri</p><h1>Modüller</h1><span>Bugünkü ve gelecekte eklenecek site modüllerini tek merkezden yönet.</span></div>
        <button className={styles.primaryButton} type="button" disabled={saving} onClick={save}>{saving ? "Kaydediliyor..." : "Kaydet ve Yayınla"}</button>
      </div>

      <div className={styles.demoBanner}><span>◦</span><p><strong>Modül merkezi hazır.</strong>Her modül kendi kartında açılır; gelecekte ekleyeceğimiz modüller burada sıralanır.</p></div>

      <section className={styles.moduleManagerCard}>
        <button className={styles.moduleManagerHeader} type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          <span className={styles.moduleNumber}>01</span>
          <span><strong>Bağış Modülü</strong><small>Ana sayfa · Slider sonrası</small></span>
          <i className={donation.enabled ? styles.moduleLive : styles.moduleOff}>{donation.enabled ? "Yayında" : "Kapalı"}</i>
          <b>{expanded ? "−" : "+"}</b>
        </button>

        {expanded ? <div className={styles.moduleManagerBody}>
          <nav className={styles.moduleTabs} aria-label="Bağış modülü ayar bölümleri">
            {([["general", "Genel"], ["desktop", "Web"], ["mobile", "Mobil"], ["placement", "Yerleşim"]] as const).map(([id, label]) => (
              <button className={tab === id ? styles.activeModuleTab : ""} type="button" key={id} onClick={() => setTab(id)}>{label}</button>
            ))}
          </nav>

          {tab === "general" ? <div className={styles.moduleSettingsPane}>
            <div className={styles.moduleControls}>
              <h3>Genel ayarlar</h3>
              <label className={styles.headerCheck}><input type="checkbox" checked={donation.enabled} onChange={(event) => update({ enabled: event.target.checked })} /> Modülü ana sayfada göster</label>
              <label className={styles.headerCheck}><input type="checkbox" checked={donation.autoScroll} onChange={(event) => update({ autoScroll: event.target.checked })} /> Kategorileri otomatik kaydır</label>
              <label className={styles.headerCheck}><input type="checkbox" checked={donation.showProgress} onChange={(event) => update({ showProgress: event.target.checked })} /> İlerleme çizgisini göster</label>
              <label>Kaydırma hızı <b>{donation.autoScrollSpeed.toFixed(2)}×</b><input type="range" min=".25" max="4" step=".25" value={donation.autoScrollSpeed} onChange={(event) => update({ autoScrollSpeed: Number(event.target.value) })} /></label>
              <h3>Görünen kategoriler</h3>
              {donationCategoryOptions.map(([id, label]) => <label className={styles.headerCheck} key={id}><input type="checkbox" checked={donation.visibleCategories.includes(id)} onChange={() => toggleCategory(id)} /> {label}</label>)}
            </div>
            <div className={styles.moduleInformation}><strong>01</strong><h3>Bağış Modülü</h3><p>Web ve mobil tasarımları ayrı ayrı yönetilir. Değişiklikler kaydetmeden önce ilgili canlı görünümde izlenebilir.</p></div>
          </div> : null}

          {tab === "desktop" ? <>
            <div className={styles.moduleEditorGrid}>
              <div className={styles.moduleConfigurationPanel}>
                <div className={styles.moduleControls}>
                  <h3>Web Ayarları</h3>
                  <label>Slider üzerine bindirme <b>{donation.desktopOverlap} px</b><input type="range" min="0" max="100" value={donation.desktopOverlap} onChange={(event) => update({ desktopOverlap: Number(event.target.value) })} /></label>
                  <label>Kart genişliği <b>{donation.desktopCardWidth} px</b><input type="range" min="60" max="500" value={donation.desktopCardWidth} onChange={(event) => update({ desktopCardWidth: Number(event.target.value) })} /></label>
                  <label>Kart yüksekliği <b>{donation.desktopCardHeight} px</b><input type="range" min="60" max="500" value={donation.desktopCardHeight} onChange={(event) => update({ desktopCardHeight: Number(event.target.value) })} /></label>
                  <p className={styles.moduleHint}>Genişlik ve yüksekliği eşit yaparsanız kare; yüksekliği artırırsanız dikey; genişliği artırırsanız yatay kart oluşur.</p>
                  <label>Kartlar arası boşluk <b>{donation.desktopCardGap} px</b><input type="range" min="0" max="60" value={donation.desktopCardGap} onChange={(event) => update({ desktopCardGap: Number(event.target.value) })} /></label>
                  <label>Bağış alanıyla mesafe <b>{donation.desktopContentGap} px</b><input type="range" min="0" max="120" value={donation.desktopContentGap} onChange={(event) => update({ desktopContentGap: Number(event.target.value) })} /></label>
                  <label>İlerleme başlangıç rengi<input type="color" value={donation.desktopProgressStartColor} onChange={(event) => update({ desktopProgressStartColor: event.target.value })} /></label>
                  <label>İlerleme bitiş rengi<input type="color" value={donation.desktopProgressEndColor} onChange={(event) => update({ desktopProgressEndColor: event.target.value })} /></label>
                  <label>İlerleme çizgisi zemini<input type="color" value={donation.desktopProgressTrackColor} onChange={(event) => update({ desktopProgressTrackColor: event.target.value })} /></label>
                </div>
                {gallery("desktop")}
              </div>
              {preview("desktop")}
            </div>
          </> : null}

          {tab === "mobile" ? <>
            <div className={styles.moduleEditorGrid}>
              <div className={styles.moduleConfigurationPanel}>
                <div className={styles.moduleControls}>
                  <h3>Mobil Ayarları</h3>
                  <label>Slider üzerine bindirme <b>{donation.mobileOverlap} px</b><input type="range" min="0" max="60" value={donation.mobileOverlap} onChange={(event) => update({ mobileOverlap: Number(event.target.value) })} /></label>
                  <label>Kart genişliği <b>{donation.mobileCardWidth} px</b><input type="range" min="50" max="320" value={donation.mobileCardWidth} onChange={(event) => update({ mobileCardWidth: Number(event.target.value) })} /></label>
                  <label>Kart yüksekliği <b>{donation.mobileCardHeight} px</b><input type="range" min="50" max="400" value={donation.mobileCardHeight} onChange={(event) => update({ mobileCardHeight: Number(event.target.value) })} /></label>
                  <p className={styles.moduleHint}>Mobil kart da serbest ölçülüdür. Kare, yatay veya dikey görünümü genişlik ve yükseklik değerleriyle belirleyebilirsiniz.</p>
                  <label>Kartlar arası boşluk <b>{donation.mobileCardGap} px</b><input type="range" min="0" max="40" value={donation.mobileCardGap} onChange={(event) => update({ mobileCardGap: Number(event.target.value) })} /></label>
                  <label>Bağış alanıyla mesafe <b>{donation.mobileContentGap} px</b><input type="range" min="0" max="100" value={donation.mobileContentGap} onChange={(event) => update({ mobileContentGap: Number(event.target.value) })} /></label>
                  <label>İlerleme başlangıç rengi<input type="color" value={donation.mobileProgressStartColor} onChange={(event) => update({ mobileProgressStartColor: event.target.value })} /></label>
                  <label>İlerleme bitiş rengi<input type="color" value={donation.mobileProgressEndColor} onChange={(event) => update({ mobileProgressEndColor: event.target.value })} /></label>
                  <label>İlerleme çizgisi zemini<input type="color" value={donation.mobileProgressTrackColor} onChange={(event) => update({ mobileProgressTrackColor: event.target.value })} /></label>
                </div>
                {gallery("mobile")}
              </div>
              {preview("mobile")}
            </div>
          </> : null}

          {tab === "placement" ? <div className={styles.moduleSettingsPane}>
            <div className={styles.moduleControls}><h3>Yerleşim</h3><label>Gösterileceği sayfa<select value="/" disabled><option>Ana sayfa</option></select></label><label>Konum<select value="after-slider" disabled><option>Sliderın hemen altında</option></select></label><p className={styles.moduleHint}>Yeni sayfa ve modül yerleşimleri oluşturulduğunda bu listeye eklenecek.</p></div>
            <div className={styles.moduleInformation}><strong>↳</strong><h3>Ana sayfa akışı</h3><p>Header → Slider → Bağış Modülü → Diğer içerikler → Footer</p></div>
          </div> : null}
        </div> : null}
      </section>

      <button className={styles.futureModuleCard} type="button" disabled><span>02</span><strong>Yeni modül alanı</strong><small>Bir sonraki modül burada yer alacak.</small><b>Yakında</b></button>
    </>
  );
}
