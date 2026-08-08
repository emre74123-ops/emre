"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { defaultModuleSettings, normalizeDonationCategoryId, normalizeModuleSettings, resolveDonationProjectCommerce, type DonationCategory, type DonationLowerDeviceSettings, type DonationOptionDesign, type DonationOptionGroup, type DonationOptionTextDesign, type DonationPriceRule, type DonationProject, type DonationProjectAction, type DonationProjectCommerce, type DonationProjectDesign, type DonationProjectMedia, type ModuleSettings } from "../../lib/module-settings";
import DonationModule from "../components/DonationModule";
import styles from "./admin.module.css";

type ModuleTab = "desktop" | "mobile";
type ModuleSection = "upper" | "lower";
type Device = "desktop" | "mobile";
type ProjectCategory = DonationProject["category"];
type DonationCategoryId = string;
type PaymentWorkspace = "model" | "options" | "rules" | "actions";
type OptionEditorTab = "content" | "text" | "appearance" | "flow";
const OPTION_EDITOR_TABS = [
  ["content", "İçerik"],
  ["text", "Yazı"],
  ["appearance", "Görünüm"],
  ["flow", "Akış"],
] as const satisfies ReadonlyArray<readonly [OptionEditorTab, string]>;
type GalleryImage = {
  path: string;
  url: string;
  size: number;
  device: Device;
  width?: number;
  height?: number;
  originalSize?: number;
  originalName?: string;
  createdAt?: string;
  format?: string;
  categoryId?: string | null;
  legacy?: boolean;
};
type UpperSettingsGroupRenderer = (id: string, title: string, content: ReactNode) => ReactNode;

const COMMERCE_LIMITS = {
  amountPresets: 12,
  quantityPresets: 12,
  optionGroups: 8,
  optionsPerGroup: 20,
  priceRules: 40,
  actions: 4,
} as const;

function commerceId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function moveCommerceItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function toMinor(value: string | number) {
  const number = typeof value === "number" ? value : Number(value.replace(",", "."));
  return Number.isFinite(number) ? Math.max(0, Math.round(number * 100)) : 0;
}

function fromMinor(value: number) {
  return Number((Math.max(0, value) / 100).toFixed(2));
}

function formatMinor(value: number) {
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(fromMinor(value))} ₺`;
}

function projectCommerceDraft(project: DonationProject) {
  return project.commerce?.version === 2 ? project.commerce : resolveDonationProjectCommerce(project);
}

function optionTextDesignFromGroup(design: DonationOptionDesign): DonationOptionTextDesign {
  return {
    fontSize: design.labelSize,
    fontWeight: design.labelWeight,
    fontFamily: design.optionFontFamily,
    color: design.textColor,
    align: design.optionTextAlign,
    letterSpacing: design.optionLetterSpacing,
    textTransform: design.optionTextTransform,
  };
}

function optionTextDesignChangesToGroup(
  changes: Partial<DonationOptionTextDesign>,
): Partial<DonationOptionDesign> {
  return {
    ...(changes.fontSize !== undefined ? { labelSize: changes.fontSize } : {}),
    ...(changes.fontWeight !== undefined ? { labelWeight: changes.fontWeight } : {}),
    ...(changes.fontFamily !== undefined ? { optionFontFamily: changes.fontFamily } : {}),
    ...(changes.color !== undefined ? { textColor: changes.color } : {}),
    ...(changes.align !== undefined ? { optionTextAlign: changes.align } : {}),
    ...(changes.letterSpacing !== undefined ? { optionLetterSpacing: changes.letterSpacing } : {}),
    ...(changes.textTransform !== undefined ? { optionTextTransform: changes.textTransform } : {}),
  };
}

function cloneOptionGroup(group: DonationOptionGroup): DonationOptionGroup {
  const groupId = commerceId("grup");
  const optionIds = new Map(group.options.map((option) => [option.id, commerceId("secenek")]));
  return {
    ...group,
    id: groupId,
    label: `${group.label} kopyası`,
    defaultOptionId: group.defaultOptionId ? optionIds.get(group.defaultOptionId) : undefined,
    visibleWhen: group.visibleWhen
      ? {
        groupId: group.visibleWhen.groupId === group.id ? groupId : group.visibleWhen.groupId,
        optionIds: group.visibleWhen.optionIds.map((id) => optionIds.get(id) || id),
      }
      : undefined,
    desktopDesign: group.desktopDesign ? { ...group.desktopDesign } : undefined,
    mobileDesign: group.mobileDesign ? { ...group.mobileDesign } : undefined,
    options: group.options.map((option) => ({ ...option, id: optionIds.get(option.id)! })),
  };
}

function cloneCommerce(commerce: DonationProjectCommerce): DonationProjectCommerce {
  const groupIds = new Map(commerce.optionGroups.map((group) => [group.id, commerceId("grup")]));
  const optionIds = new Map(commerce.optionGroups.flatMap((group) => group.options.map((option) => [option.id, commerceId("secenek")] as const)));
  return {
    ...commerce,
    optionDesignDesktop: { ...commerce.optionDesignDesktop },
    optionDesignMobile: { ...commerce.optionDesignMobile },
    amountPresets: commerce.amountPresets.map((preset) => ({ ...preset, id: commerceId("tutar") })),
    optionGroups: commerce.optionGroups.map((group) => ({
      ...group,
      id: groupIds.get(group.id)!,
      defaultOptionId: group.defaultOptionId ? optionIds.get(group.defaultOptionId) : undefined,
      visibleWhen: group.visibleWhen
        ? {
          groupId: groupIds.get(group.visibleWhen.groupId) || group.visibleWhen.groupId,
          optionIds: group.visibleWhen.optionIds.map((id) => optionIds.get(id) || id),
        }
        : undefined,
      desktopDesign: group.desktopDesign ? { ...group.desktopDesign } : undefined,
      mobileDesign: group.mobileDesign ? { ...group.mobileDesign } : undefined,
      options: group.options.map((option) => ({ ...option, id: optionIds.get(option.id)! })),
    })),
    priceRules: commerce.priceRules.map((rule) => ({
      ...rule,
      id: commerceId("kural"),
      optionIds: rule.optionIds.map((id) => optionIds.get(id) || id),
    })),
    actions: commerce.actions.map((action) => ({
      ...action,
      id: commerceId("dugme"),
      desktop: { ...action.desktop },
      mobile: { ...action.mobile },
    })),
  };
}

function OptionDesignEditor({
  design,
  device,
  deviceLabel,
  onChange,
  showVisibilityControls = true,
}: {
  design: DonationOptionDesign;
  device: Device;
  deviceLabel: string;
  onChange: (changes: Partial<DonationOptionDesign>) => void;
  showVisibilityControls?: boolean;
}) {
  const [openSection, setOpenSection] = useState<"" | "header" | "layout" | "appearance">("");
  const range = (label: string, key: keyof DonationOptionDesign, min: number, max: number, suffix = "px", step = 1) => (
    <label className={styles.optionDesignRange}>
      <span>{label}<b>{String(design[key])}{suffix ? ` ${suffix}` : ""}</b></span>
      <input aria-label={label} type="range" min={min} max={max} step={step} value={Number(design[key])} onChange={(event) => onChange({ [key]: Number(event.target.value) } as Partial<DonationOptionDesign>)} />
    </label>
  );
  const color = (label: string, key: keyof DonationOptionDesign) => (
    <label className={styles.optionDesignColor}>
      <span>{label}</span>
      <span><input aria-label={label} type="color" value={String(design[key])} onChange={(event) => onChange({ [key]: event.target.value } as Partial<DonationOptionDesign>)} /><code>{String(design[key])}</code></span>
    </label>
  );
  const segment = (id: "header" | "layout" | "appearance", label: string, summary: string, content: ReactNode) => {
    const open = openSection === id;
    return <section className={`${styles.optionDesignSegment} ${open ? styles.optionDesignSegmentOpen : ""}`}>
      <button className={styles.optionDesignSegmentHeader} type="button" aria-expanded={open} onClick={() => setOpenSection(open ? "" : id)}>
        <span><strong>{label}</strong><small>{summary}</small></span><b>{open ? "−" : "+"}</b>
      </button>
      {open ? <div className={styles.optionDesignGrid}>{content}</div> : null}
    </section>;
  };

  return <div className={styles.optionDesignEditor} aria-label={`${deviceLabel} seçenek görünümü ayarları`}>
    {segment("header", "Başlık", "Grup başlığı ve açıklama", <>
      {range("Başlığın üst boşluğu", "groupTopGap", 0, 80)}
      {showVisibilityControls ? <label className={styles.optionDesignToggle}><input type="checkbox" checked={design.titleVisible} onChange={(event) => onChange({ titleVisible: event.target.checked })} /><span>Grup başlığını göster</span></label> : null}
      <label>Başlık hizası<select value={design.titleAlign} onChange={(event) => onChange({ titleAlign: event.target.value as DonationOptionDesign["titleAlign"] })}><option value="start">Başlangıç</option><option value="center">Orta</option><option value="end">Bitiş</option></select></label>
      {range("Başlık boyutu", "titleSize", 10, 30)}
      <label>Başlık kalınlığı<select value={design.titleWeight} onChange={(event) => onChange({ titleWeight: Number(event.target.value) as DonationOptionDesign["titleWeight"] })}>{[400, 500, 600, 700, 800, 900].map((weight) => <option value={weight} key={weight}>{weight}</option>)}</select></label>
      {color("Başlık rengi", "titleColor")}
      {showVisibilityControls ? <label className={styles.optionDesignToggle}><input type="checkbox" checked={design.descriptionVisible} onChange={(event) => onChange({ descriptionVisible: event.target.checked })} /><span>Grup açıklamasını göster</span></label> : null}
      {range("Açıklama boyutu", "descriptionSize", 8, 20)}
      {color("Açıklama rengi", "descriptionColor")}
      {range("Başlık-açıklama aralığı", "titleDescriptionGap", 0, 20)}
      {range("Başlık-seçenek aralığı", "headerGap", 0, 40)}
    </>)}

    {segment("layout", "Yerleşim", "Boyut, sütun ve boşluklar", <>
      <label>Genişlik biçimi<select value={design.optionWidthMode} onChange={(event) => {
        const optionWidthMode = event.target.value as DonationOptionDesign["optionWidthMode"];
        onChange({
          optionWidthMode,
          ...(optionWidthMode === "equal" || optionWidthMode === "columns" ? { horizontalScroll: false } : {}),
          ...(optionWidthMode === "columns" && design.columns === 0 ? { columns: 2 } : {}),
          ...(optionWidthMode !== "auto" && design.justify === "stretch" ? { justify: "start" } : {}),
        });
      }}><option value="auto">Otomatik</option><option value="fixed">Sabit</option><option value="equal">Eşit dağıt</option><option value="columns">Sütunlu</option></select></label>
      {design.optionWidthMode === "auto" ? range("En az genişlik", "optionMinWidth", 40, 260) : null}
      {design.optionWidthMode === "fixed" ? range("Seçenek genişliği", "optionWidth", 40, 320) : null}
      {design.optionWidthMode === "columns" ? <label>Sütun sayısı<select value={design.columns || 2} onChange={(event) => onChange({ columns: Number(event.target.value) as DonationOptionDesign["columns"] })}><option value="1">1 sütun</option><option value="2">2 sütun</option><option value="3">3 sütun</option><option value="4">4 sütun</option></select></label> : null}
      {design.optionWidthMode === "auto" || design.optionWidthMode === "fixed" ? <label className={styles.optionDesignToggle}><input type="checkbox" checked={design.horizontalScroll} onChange={(event) => onChange({ horizontalScroll: event.target.checked })} /><span>Yatay kaydırma</span></label> : null}
      <label>Yükseklik biçimi<select value={design.optionHeightMode} onChange={(event) => onChange({ optionHeightMode: event.target.value as DonationOptionDesign["optionHeightMode"] })}><option value="auto">Otomatik</option><option value="fixed">Sabit</option></select></label>
      {design.optionHeightMode === "fixed" ? range("Seçenek yüksekliği", "optionHeight", 24, 120) : null}
      {device === "mobile" && design.optionHeightMode === "fixed" && design.optionHeight < 40 ? <p className={styles.optionDesignWarning}>40 px altı dokunmayı zorlaştırabilir.</p> : null}
      {design.optionWidthMode === "auto" || design.optionWidthMode === "fixed" ? <label>Hizalama<select value={design.justify} onChange={(event) => onChange({ justify: event.target.value as DonationOptionDesign["justify"] })}><option value="start">Başlangıç</option><option value="center">Orta</option><option value="end">Bitiş</option>{design.optionWidthMode === "auto" ? <option value="stretch">Alana yay</option> : null}</select></label> : null}
      {range("Yatay aralık", "columnGap", 0, 32)}
      {range("Dikey aralık", "rowGap", 0, 32)}
      {range("İç yan boşluk", "paddingX", 4, 32)}
      <label className={styles.optionDesignToggle}><input type="checkbox" checked={design.textWrap} onChange={(event) => onChange({ textWrap: event.target.checked })} /><span>Uzun yazıyı sar</span></label>
    </>)}

    {segment("appearance", "Görünüm", "Yazı, fiyat, renk ve çerçeve", <>
      {range("Seçenek yazısı", "labelSize", 9, 22)}
      <label>Yazı kalınlığı<select value={design.labelWeight} onChange={(event) => onChange({ labelWeight: Number(event.target.value) as DonationOptionDesign["labelWeight"] })}>{[400, 500, 600, 700, 800, 900].map((weight) => <option value={weight} key={weight}>{weight}</option>)}</select></label>
      <label>Yazı tipi<select value={design.optionFontFamily} onChange={(event) => onChange({ optionFontFamily: event.target.value as DonationOptionDesign["optionFontFamily"] })}><option value="inherit">Site yazı tipi</option><option value="sans">Modern sans</option><option value="serif">Klasik serif</option></select></label>
      <label>Yazı hizası<select value={design.optionTextAlign} onChange={(event) => onChange({ optionTextAlign: event.target.value as DonationOptionDesign["optionTextAlign"] })}><option value="start">Başlangıç</option><option value="center">Orta</option><option value="end">Bitiş</option></select></label>
      {range("Harf aralığı", "optionLetterSpacing", -1, 4, "px", .1)}
      <label>Harf biçimi<select value={design.optionTextTransform} onChange={(event) => onChange({ optionTextTransform: event.target.value as DonationOptionDesign["optionTextTransform"] })}><option value="none">Olduğu gibi</option><option value="uppercase">BÜYÜK HARF</option><option value="lowercase">küçük harf</option><option value="capitalize">Baş Harf Büyük</option></select></label>
      <label className={styles.optionDesignToggle}><input type="checkbox" checked={design.optionDescriptionVisible} onChange={(event) => onChange({ optionDescriptionVisible: event.target.checked })} /><span>Seçenek açıklamasını göster</span></label>
      {range("Seçenek açıklaması", "optionDescriptionSize", 8, 18)}
      {color("Seçenek açıklama rengi", "optionDescriptionColor")}
      <label className={styles.optionDesignToggle}><input type="checkbox" checked={design.priceVisible} onChange={(event) => onChange({ priceVisible: event.target.checked })} /><span>Fiyatı göster</span></label>
      <label>Fiyat konumu<select value={design.pricePosition} onChange={(event) => onChange({ pricePosition: event.target.value as DonationOptionDesign["pricePosition"] })}><option value="inline">Aynı satır</option><option value="below">Alt satır</option><option value="badge">Rozet</option></select></label>
      {color("Normal zemin", "background")}
      {color("Normal yazı", "textColor")}
      {color("Normal çerçeve", "borderColor")}
      {color("Seçili zemin", "selectedBackground")}
      {color("Seçili yazı", "selectedTextColor")}
      {color("Seçili çerçeve", "selectedBorderColor")}
      {range("Çerçeve", "borderWidth", 0, 4)}
      {range("Köşe", "radius", 0, 36)}
      <label>Gölge<select value={design.shadow} onChange={(event) => onChange({ shadow: event.target.value as DonationOptionDesign["shadow"] })}><option value="none">Yok</option><option value="soft">Hafif</option><option value="medium">Orta</option></select></label>
    </>)}
  </div>;
}

function OptionTextDesignEditor({
  design,
  onChange,
}: {
  design: DonationOptionTextDesign;
  onChange: (changes: Partial<DonationOptionTextDesign>) => void;
}) {
  return <div className={styles.optionTextDesignGrid}>
    <label className={styles.optionTextRange}>
      <span>Yazı boyutu<b>{design.fontSize} px</b></span>
      <input aria-label="Seçenek yazı boyutu" type="range" min="9" max="22" value={design.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })} />
    </label>
    <label>Yazı kalınlığı<select value={design.fontWeight} onChange={(event) => onChange({ fontWeight: Number(event.target.value) as DonationOptionTextDesign["fontWeight"] })}>{[400, 500, 600, 700, 800, 900].map((weight) => <option value={weight} key={weight}>{weight}</option>)}</select></label>
    <label>Yazı tipi<select value={design.fontFamily} onChange={(event) => onChange({ fontFamily: event.target.value as DonationOptionTextDesign["fontFamily"] })}><option value="inherit">Site yazı tipi</option><option value="sans">Modern sans</option><option value="serif">Klasik serif</option></select></label>
    <label>Hizalama<select value={design.align} onChange={(event) => onChange({ align: event.target.value as DonationOptionTextDesign["align"] })}><option value="start">Başlangıç</option><option value="center">Orta</option><option value="end">Bitiş</option></select></label>
    <label className={styles.optionTextRange}>
      <span>Harf aralığı<b>{design.letterSpacing} px</b></span>
      <input aria-label="Seçenek harf aralığı" type="range" min="-1" max="4" step=".1" value={design.letterSpacing} onChange={(event) => onChange({ letterSpacing: Number(event.target.value) })} />
    </label>
    <label>Harf biçimi<select value={design.textTransform} onChange={(event) => onChange({ textTransform: event.target.value as DonationOptionTextDesign["textTransform"] })}><option value="none">Olduğu gibi</option><option value="uppercase">BÜYÜK HARF</option><option value="lowercase">küçük harf</option><option value="capitalize">Baş Harf Büyük</option></select></label>
    <label className={styles.optionTextColor}>Yazı rengi<span><input aria-label="Seçenek yazı rengi" type="color" value={design.color} onChange={(event) => onChange({ color: event.target.value })} /><code>{design.color}</code></span></label>
  </div>;
}

function ModulePreview({
  device,
  settings,
  category,
  onCategoryChange,
}: {
  device: Device;
  settings: ModuleSettings["donation"];
  category: string;
  onCategoryChange: (category: string) => void;
}) {
  return (
    <div className={`${styles.modulePreview} ${device === "mobile" ? styles.modulePreviewMobile : styles.modulePreviewDesktop}`}>
      <div className={styles.modulePreviewLabel}>{device === "mobile" ? "Mobil canlı görünüm" : "Web canlı görünüm"}</div>
      <div className={styles.modulePreviewViewport}>
        <DonationModule embedded settings={settings} previewDevice={device} previewCategory={category} onCategoryChange={onCategoryChange} />
        <div className={styles.previewFollowingSection}><span>SONRAKİ BÖLÜM</span></div>
      </div>
    </div>
  );
}

async function optimizeProjectImage(file: File, device: Device) {
  const accepted = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);
  if (!accepted.has(file.type)) throw new Error("PNG, JPG, WebP veya AVIF biçiminde bir görsel seçin.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Görsel en fazla 15 MB olabilir.");
  const bitmap = await createImageBitmap(file);
  const maxDimension = device === "desktop" ? 160…39025 tokens truncated…ame={styles.categoryCompactGallery}>
        <div className={styles.categoryCompactToolbar}>
          <div>
            <strong>{selectedCategory?.label || "Kategori"} · {deviceLabel} galerisi</strong>
            <small>{categoryAssets.length} görsel · {totalSize ? formatSize(totalSize) : selectedUrl ? "mevcut dosya" : "0 KB"} · Yüklenen dosyalar otomatik WebP olur</small>
          </div>
          <nav>
            {selectedUrl ? <button className={styles.categoryDeleteButton} type="button" onClick={() => selectCategoryImage(selectedId, device, "")}>Görseli kaldır</button> : null}
            <label className={styles.categoryAddButton}>
              {uploading ? "Hazırlanıyor…" : "＋ Görsel yükle"}
              <input type="file" hidden accept=".webp,.jpg,.jpeg,.png,.avif,image/webp,image/jpeg,image/png,image/avif" disabled={uploading || !selectedId} onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file, device, selectedId);
                event.target.value = "";
              }} />
            </label>
          </nav>
        </div>
        {categoryAssets.length ? <div className={styles.categoryAssetStrip}>
        {categoryAssets.map((image) => {
          const meta = image.width && image.height ? { width: image.width, height: image.height } : imageMeta[image.url];
          const isSelected = selectedUrl === image.url;
          const savedPercent = image.originalSize && image.originalSize > image.size
            ? Math.round((1 - image.size / image.originalSize) * 100)
            : 0;
          return <article
            className={styles.categoryAssetCard}
            data-selected={isSelected}
            aria-pressed={isSelected}
            role="button"
            tabIndex={0}
            key={image.path}
            onClick={() => selectCategoryImage(selectedId, device, image.url)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") selectCategoryImage(selectedId, device, image.url);
            }}
          >
            <span><Image src={image.url} alt={selectedCategory?.imageAlt || `${deviceLabel} kategori görseli`} fill sizes="110px" onLoad={(event) => {
              const element = event.currentTarget;
              setImageMeta((current) => current[image.url] ? current : { ...current, [image.url]: { width: element.naturalWidth, height: element.naturalHeight } });
            }} /></span>
            <strong>{image.originalName || image.path.split("/").at(-1) || "Kategori görseli"}</strong>
            <small>{meta ? `${meta.width}×${meta.height} · ${imageRatio(meta.width, meta.height)}` : image.path.startsWith("current:") ? "Mevcut görsel" : formatSize(image.size)}</small>
            {savedPercent ? <small>%{savedPercent} küçüldü</small> : null}
            <button type="button" title="Görseli sil" onClick={(event) => {
              event.stopPropagation();
              if (image.path.startsWith("current:")) selectCategoryImage(selectedId, device, "");
              else void deleteImage(image);
            }}>×</button>
          </article>;
        })}
        </div> : <div className={styles.categoryEmpty}><strong>Bu kategori galerisi boş</strong></div>}
      </div>

      {selectedCategory ? <div className={styles.categoryCrudPanel}>
        <header>
          <div><strong>{selectedCategory.label}</strong><small>Kategori metinleri ve SEO bilgileri</small></div>
          <button className={styles.categoryDeleteButton} type="button" onClick={() => removeCategory(selectedId, device)}>Kategoriyi sil</button>
        </header>
        <div className={styles.categoryInlineFields}>
          <label>Kategori adı<input value={selectedCategory.label} maxLength={80} onChange={(event) => updateCategoryDefinition(selectedId, { label: event.target.value })} /></label>
          <label>Kısa açıklama<input value={selectedCategory.description} maxLength={180} onChange={(event) => updateCategoryDefinition(selectedId, { description: event.target.value })} /></label>
          <label>Görsel başlığı<input value={selectedCategory.imageTitle} maxLength={100} onChange={(event) => updateCategoryDefinition(selectedId, { imageTitle: event.target.value })} /></label>
          <label>Görsel alt metni (SEO)<input value={selectedCategory.imageAlt} maxLength={160} onChange={(event) => updateCategoryDefinition(selectedId, { imageAlt: event.target.value })} /></label>
        </div>
      </div> : null}

      <div className={styles.categoryDesignGrid}>
        <section>
          <strong>Boyut ve oran</strong>
          <label>En-boy oranı<select value={aspectRatio} onChange={(event) => setAspectRatio(device, event.target.value)}>{aspectRatios.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Genişlik <b>{cardWidth} px</b><input type="range" min={device === "desktop" ? 60 : 50} max={device === "desktop" ? 500 : 320} value={cardWidth} onChange={(event) => updateImageWidth(device, Number(event.target.value))} /></label>
          {aspectRatio === "custom"
            ? <label>Yükseklik <b>{cardHeight} px</b><input type="range" min={device === "desktop" ? 60 : 50} max={device === "desktop" ? 500 : 400} value={cardHeight} onChange={(event) => update(device === "desktop" ? { desktopCardHeight: Number(event.target.value) } : { mobileCardHeight: Number(event.target.value) })} /></label>
            : <small>Yükseklik otomatik: {cardHeight} px</small>}
          <label>Kart aralığı <b>{cardGap} px</b><input type="range" min="0" max={device === "desktop" ? 60 : 40} value={cardGap} onChange={(event) => update(device === "desktop" ? { desktopCardGap: Number(event.target.value) } : { mobileCardGap: Number(event.target.value) })} /></label>
        </section>
        <section>
          <strong>Yerleşim</strong>
          <label>Görsel davranışı<select value={imageFit} onChange={(event) => update(device === "desktop" ? { desktopImageFit: event.target.value as "cover" | "contain" } : { mobileImageFit: event.target.value as "cover" | "contain" })}><option value="cover">Alanı doldur</option><option value="contain">Tamamını göster</option></select></label>
          <label>Odak noktası<select value={imagePosition} onChange={(event) => update(device === "desktop" ? { desktopImagePosition: event.target.value } : { mobileImagePosition: event.target.value })}><option value="center">Orta</option><option value="top">Üst</option><option value="bottom">Alt</option><option value="left">Sol</option><option value="right">Sağ</option></select></label>
          <label>Boş alan rengi<input type="color" value={backgroundColor} onChange={(event) => update(device === "desktop" ? { desktopImageBackgroundColor: event.target.value } : { mobileImageBackgroundColor: event.target.value })} /></label>
        </section>
        <section>
          <strong>Görünüm</strong>
          <label>Köşeler <b>{borderRadius} px</b><input type="range" min="0" max="80" value={borderRadius} onChange={(event) => update(device === "desktop" ? { desktopBorderRadius: Number(event.target.value) } : { mobileBorderRadius: Number(event.target.value) })} /></label>
          <label>Çerçeve <b>{borderWidth} px</b><input type="range" min="0" max="8" value={borderWidth} onChange={(event) => update(device === "desktop" ? { desktopBorderWidth: Number(event.target.value) } : { mobileBorderWidth: Number(event.target.value) })} /></label>
          <label>Çerçeve rengi<input type="color" value={borderColor} onChange={(event) => update(device === "desktop" ? { desktopBorderColor: event.target.value } : { mobileBorderColor: event.target.value })} /></label>
          <label>Gölge<select value={shadow} onChange={(event) => update(device === "desktop" ? { desktopShadow: event.target.value as typeof donation.desktopShadow } : { mobileShadow: event.target.value as typeof donation.mobileShadow })}><option value="none">Kapalı</option><option value="soft">Hafif</option><option value="medium">Orta</option><option value="strong">Güçlü</option></select></label>
        </section>
      </div>
    </div>);
  };

  const upperDesignSettings = (device: Device) => {
    const desktop = device === "desktop";
    const openGroup = desktop ? upperDesktopGroup : upperMobileGroup;
    const setOpenGroup = desktop ? setUpperDesktopGroup : setUpperMobileGroup;
    const toggleGroup = (group: string) => setOpenGroup((current) => current === group ? "" : group);
    const group = (id: string, title: string, content: ReactNode) => (
      <section className={openGroup === id ? styles.lowerAccordionOpen : ""}>
        <button type="button" onClick={() => toggleGroup(id)}>
          <span>{title}</span><b>{openGroup === id ? "−" : "+"}</b>
        </button>
        {openGroup === id ? <div className={styles.lowerAccordionContent}>{content}</div> : null}
      </section>
    );

    return <div className={styles.upperUnifiedPanel}>
      <header className={styles.upperUnifiedHeader}>
        <span>{desktop ? "WEB" : "MOBİL"}</span>
        <div><strong>{desktop ? "Web Ayarları" : "Mobil Ayarları"}</strong><small>Tasarım, görseller ve galeri tek merkezde</small></div>
        <i>4 BÖLÜM</i>
      </header>
      <div className={`${styles.lowerAccordion} ${styles.upperSettingsAccordion}`}>
      {group("publishing", "Yayın ve kaydırma", <>
        <label className={styles.headerCheck}><input type="checkbox" checked={donation.enabled} onChange={(event) => update({ enabled: event.target.checked })} /> Modülü ana sayfada göster</label>
        <label className={styles.headerCheck}><input type="checkbox" checked={donation.autoScroll} onChange={(event) => update({ autoScroll: event.target.checked })} /> Kategorileri otomatik kaydır</label>
        <label>Kaydırma hızı <b>{donation.autoScrollSpeed.toFixed(2)}×</b><input type="range" min=".25" max="4" step=".25" value={donation.autoScrollSpeed} onChange={(event) => update({ autoScrollSpeed: Number(event.target.value) })} /></label>
        <label>Başlangıç ve bitiş kaydırma payı <b>{desktop ? donation.desktopEdgeScrollPadding : donation.mobileEdgeScrollPadding} px</b><input type="range" min="0" max={desktop ? "160" : "100"} value={desktop ? donation.desktopEdgeScrollPadding : donation.mobileEdgeScrollPadding} onChange={(event) => update(desktop ? { desktopEdgeScrollPadding: Number(event.target.value) } : { mobileEdgeScrollPadding: Number(event.target.value) })} /></label>
      </>)}
      {group("placement", "Yerleşim", <>
        <label>Üst bölüm ile mesafe <b>{desktop ? donation.desktopOverlap : donation.mobileOverlap} px</b><input type="range" min={desktop ? "-100" : "-60"} max={desktop ? "100" : "60"} value={desktop ? donation.desktopOverlap : donation.mobileOverlap} onChange={(event) => update(desktop ? { desktopOverlap: Number(event.target.value) } : { mobileOverlap: Number(event.target.value) })} /></label>
        {desktop ? <label>Kutucuk hizalama<select value={donation.desktopCategoryAlignment} onChange={(event) => update({ desktopCategoryAlignment: event.target.value as typeof donation.desktopCategoryAlignment })}><option value="left">Sola hizala</option><option value="center">Ortaya hizala</option></select></label> : null}
        <label>İki çizgi arası ek boşluk <b>{desktop ? donation.desktopProgressExtraSpace : donation.mobileProgressExtraSpace} px</b><input type="range" min="0" max={desktop ? "160" : "120"} value={desktop ? donation.desktopProgressExtraSpace : donation.mobileProgressExtraSpace} onChange={(event) => update(desktop ? { desktopProgressExtraSpace: Number(event.target.value) } : { mobileProgressExtraSpace: Number(event.target.value) })} /></label>
      </>)}
      {group("progress", "İlerleme çizgisi", <>
        <label className={styles.headerCheck}><input type="checkbox" checked={donation.showProgress} onChange={(event) => update({ showProgress: event.target.checked })} /> İlerleme çizgisini göster</label>
        <label>Başlangıç rengi<input type="color" value={desktop ? donation.desktopProgressStartColor : donation.mobileProgressStartColor} onChange={(event) => update(desktop ? { desktopProgressStartColor: event.target.value } : { mobileProgressStartColor: event.target.value })} /></label>
        <label>Bitiş rengi<input type="color" value={desktop ? donation.desktopProgressEndColor : donation.mobileProgressEndColor} onChange={(event) => update(desktop ? { desktopProgressEndColor: event.target.value } : { mobileProgressEndColor: event.target.value })} /></label>
        <label>Çizgi zemini<input type="color" value={desktop ? donation.desktopProgressTrackColor : donation.mobileProgressTrackColor} onChange={(event) => update(desktop ? { desktopProgressTrackColor: event.target.value } : { mobileProgressTrackColor: event.target.value })} /></label>
        <label>Çizgi konumu<select value={desktop ? donation.desktopProgressPosition : donation.mobileProgressPosition} onChange={(event) => update(desktop ? { desktopProgressPosition: event.target.value as typeof donation.desktopProgressPosition } : { mobileProgressPosition: event.target.value as typeof donation.mobileProgressPosition })}><option value="top">Yalnızca üstte</option><option value="bottom">Yalnızca altta</option><option value="both">Üstte ve altta</option></select></label>
        <label>Çizgi ile kart aralığı <b>{desktop ? donation.desktopProgressGap : donation.mobileProgressGap} px</b><input type="range" min="0" max={desktop ? "60" : "50"} value={desktop ? donation.desktopProgressGap : donation.mobileProgressGap} onChange={(event) => update(desktop ? { desktopProgressGap: Number(event.target.value) } : { mobileProgressGap: Number(event.target.value) })} /></label>
        <label>Çizgi kalınlığı <b>{desktop ? donation.desktopProgressThickness : donation.mobileProgressThickness} px</b><input type="range" min="1" max="8" value={desktop ? donation.desktopProgressThickness : donation.mobileProgressThickness} onChange={(event) => update(desktop ? { desktopProgressThickness: Number(event.target.value) } : { mobileProgressThickness: Number(event.target.value) })} /></label>
      </>)}
      {upperGallerySections(device, group)}
      </div>
    </div>;
  };

  return (
    <>
      <div className={styles.pageHeading}>
        <div><p>Site bileşenleri</p><h1>Modüller</h1><span>Bugünkü ve gelecekte eklenecek site modüllerini tek merkezden yönet.</span></div>
        <button className={styles.primaryButton} type="button" disabled={saving || !settingsReady} onClick={save}>{saving ? "Kaydediliyor..." : "Kaydet ve Yayınla"}</button>
      </div>

      <div className={styles.demoBanner}><span>◦</span><p><strong>{settingsLoadError ? "Ayarlar yüklenemedi." : "Modül merkezi hazır."}</strong>{settingsLoadError || "Her modül kendi kartında açılır; gelecekte ekleyeceğimiz modüller burada sıralanır."}</p></div>

      <section className={styles.moduleManagerCard}>
        <button className={styles.moduleManagerHeader} type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          <span className={styles.moduleNumber}>01</span>
          <span><strong>Bağış Modülü</strong><small>Ana sayfa · Slider sonrası</small></span>
          <i className={donation.enabled ? styles.moduleLive : styles.moduleOff}>{donation.enabled ? "Yayında" : "Kapalı"}</i>
          <b>{expanded ? "−" : "+"}</b>
        </button>

        {expanded ? <div className={styles.moduleManagerBody}>
          <nav className={styles.moduleSectionTabs} aria-label="Bağış modülü ana bölümleri">
            <button className={section === "upper" ? styles.activeModuleSectionTab : ""} type="button" onClick={() => setSection("upper")}>
              <span>01</span><strong>Üst Bölüm</strong><small>Bağış kategorileri</small>
            </button>
            <button className={section === "lower" ? styles.activeModuleSectionTab : ""} type="button" onClick={() => setSection("lower")}>
              <span>02</span><strong>Alt Bölüm</strong><small>Bağış seçenekleri</small>
            </button>
          </nav>

          {section === "upper" ? <>
          <div className={styles.moduleSectionIntro}>
            <span>ÜST BÖLÜM</span><h2>Bağış Kategorileri</h2><p>Kategori kutularını, görselleri, kaydırma davranışını ve yerleşimi yönetin.</p>
          </div>
          <nav className={styles.lowerDeviceTabs} aria-label="Üst bölüm cihaz ayarları">
            <button className={tab === "desktop" ? styles.activeLowerDeviceTab : ""} type="button" onClick={() => setTab("desktop")}><span>WEB</span><strong>Web Ayarları</strong><small>Masaüstü görünümü</small></button>
            <button className={tab === "mobile" ? styles.activeLowerDeviceTab : ""} type="button" onClick={() => setTab("mobile")}><span>MOBİL</span><strong>Mobil Ayarları</strong><small>Telefon görünümü</small></button>
          </nav>

          {tab === "desktop" ? <>
            <div className={styles.moduleEditorGrid}>
              <div className={styles.moduleConfigurationPanel}>
                {upperDesignSettings("desktop")}
              </div>
              <ModulePreview device="desktop" settings={donation} category={selectedUpperCategory.desktop} onCategoryChange={chooseDesktopPreviewCategory} />
            </div>
          </> : null}

          {tab === "mobile" ? <>
            <div className={styles.moduleEditorGrid}>
              <div className={styles.moduleConfigurationPanel}>
                {upperDesignSettings("mobile")}
              </div>
              <ModulePreview device="mobile" settings={donation} category={selectedUpperCategory.mobile} onCategoryChange={chooseMobilePreviewCategory} />
            </div>
          </> : null}
          </> : null}

          {section === "lower" ? <div className={styles.moduleLowerSection}>
            <div className={styles.moduleSectionIntro}>
              <span>ALT BÖLÜM</span><h2>Bağış Seçenekleri</h2><p>Seçilen kategoriye ait bağış kartları ve bağış işlemleri bu ayrı alanda yönetilecek.</p>
            </div>
            <nav className={styles.lowerDeviceTabs} aria-label="Alt bölüm cihaz ayarları">
              <button className={lowerDevice === "desktop" ? styles.activeLowerDeviceTab : ""} type="button" onClick={() => { setLowerDevice("desktop"); setLowerGroup("project-content"); }}><span>WEB</span><strong>Web Ayarları</strong><small>Masaüstü görünümü</small></button>
              <button className={lowerDevice === "mobile" ? styles.activeLowerDeviceTab : ""} type="button" onClick={() => { setLowerDevice("mobile"); setLowerGroup("project-content"); }}><span>MOBİL</span><strong>Mobil Ayarları</strong><small>Telefon görünümü</small></button>
            </nav>
            <div className={styles.lowerEditorGrid}>
              <div className={styles.lowerSettingsPanel}>
                <div className={styles.lowerPanelHeading}><span>{lowerDevice === "desktop" ? "WEB AYARLARI" : "MOBİL AYARLARI"}</span><p>Tüm tasarım ve yerleşim ayarları bu cihaz için bağımsızdır.</p></div>
                {projectControls(lowerDevice)}
                {lowerControls(lowerDevice)}
              </div>
              <div className={styles.lowerPreviewSticky}>
                <ModulePreview device={lowerDevice} settings={donation} category={projectCategory} onCategoryChange={chooseProjectCategory} />
              </div>
            </div>
          </div> : null}
        </div> : null}
      </section>

      <button className={styles.futureModuleCard} type="button" disabled><span>02</span><strong>Yeni modül alanı</strong><small>Bir sonraki modül burada yer alacak.</small><b>Yakında</b></button>
    </>
  );
}

