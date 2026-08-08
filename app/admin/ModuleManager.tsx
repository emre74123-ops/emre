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
  const maxDimension = device === "desktop" ? 1600 : 1200;
  const ratio = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  let width = Math.max(1, Math.round(bitmap.width * ratio));
  let height = Math.max(1, Math.round(bitmap.height * ratio));
  let quality = .86;
  let blob: Blob | null = null;
  const targetSize = device === "desktop" ? 480 * 1024 : 360 * 1024;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      bitmap.close();
      throw new Error("Görsel işleme başlatılamadı.");
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob || blob.size <= targetSize || Math.max(width, height) <= 640) break;
    if (quality > .7) quality -= .04;
    else {
      width = Math.max(1, Math.round(width * .88));
      height = Math.max(1, Math.round(height * .88));
    }
  }
  bitmap.close();
  if (!blob) throw new Error("Görsel WebP biçimine dönüştürülemedi.");
  const safeName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]/gi, "-") || "kart-gorseli";
  return {
    file: new File([blob], `${safeName}.webp`, { type: "image/webp" }),
    width,
    height,
    originalName: file.name,
    originalSize: file.size,
  };
}

function ProjectMediaPreview({ media, sizes = "120px" }: { media: DonationProjectMedia; sizes?: string }) {
  const src = media.type === "video" ? media.poster || "" : media.url;
  return (
    <span className={styles.projectMediaPreview}>
      {src
        ? <Image src={src} alt={media.alt || ""} fill sizes={sizes} />
        : (
          // A native image intentionally keeps the browser's broken-image marker for a video without a poster.
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/__missing-project-media__.png" alt="" aria-hidden="true" />
        )}
      {media.type === "video" ? <i>▶</i> : null}
    </span>
  );
}

export default function ModuleManager({ showToast }: { showToast: (message: string) => void }) {
  const [settings, setSettings] = useState<ModuleSettings>(defaultModuleSettings);
  const [saving, setSaving] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [settingsLoadError, setSettingsLoadError] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [section, setSection] = useState<ModuleSection>("upper");
  const [lowerDevice, setLowerDevice] = useState<Device>("desktop");
  const [lowerGroup, setLowerGroup] = useState("project-content");
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(true);
  const [projectCategory, setProjectCategory] = useState<ProjectCategory>("all");
  const [selectedProjectId, setSelectedProjectId] = useState("general-support");
  const [draggedProjectId, setDraggedProjectId] = useState("");
  const [tab, setTab] = useState<ModuleTab>("desktop");
  const [upperDesktopGroup, setUpperDesktopGroup] = useState("publishing");
  const [upperMobileGroup, setUpperMobileGroup] = useState("publishing");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [imageMeta, setImageMeta] = useState<Record<string, { width: number; height: number }>>({});
  const [selectedUpperCategory, setSelectedUpperCategory] = useState<Record<Device, DonationCategoryId>>({ desktop: "all", mobile: "all" });
  const [draggedUpperCategory, setDraggedUpperCategory] = useState("");
  const [pendingCategoryDeletes, setPendingCategoryDeletes] = useState<string[]>([]);
  const [pendingLegacyCategoryImages, setPendingLegacyCategoryImages] = useState<Record<string, GalleryImage[]>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadingPosterId, setUploadingPosterId] = useState("");
  const [selectedMediaIds, setSelectedMediaIds] = useState<Record<Device, string>>({ desktop: "", mobile: "" });
  const [mediaSettingsGroup, setMediaSettingsGroup] = useState<"gallery" | "appearance" | "video">("gallery");
  const [paymentWorkspace, setPaymentWorkspace] = useState<PaymentWorkspace>("model");
  const [expandedOptionGroupId, setExpandedOptionGroupId] = useState("");
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>({});
  const [optionEditorTabs, setOptionEditorTabs] = useState<Record<string, OptionEditorTab>>({});
  const [sharedOptionDesignOpen, setSharedOptionDesignOpen] = useState(false);
  const [expandedPriceRuleId, setExpandedPriceRuleId] = useState("");
  const [expandedActionId, setExpandedActionId] = useState("");
  const [pendingProjectMediaDeletes, setPendingProjectMediaDeletes] = useState<string[]>([]);
  const [pendingProjectFolderDeletes, setPendingProjectFolderDeletes] = useState<string[]>([]);
  const categoryStripRefs = useRef<Record<Device, HTMLDivElement | null>>({ desktop: null, mobile: null });
  const persistedCategoryIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/modules", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !result.settings) throw new Error("Modül ayarları yüklenemedi.");
        if (!active) return;
        const normalized = normalizeModuleSettings(result.settings);
        setSettings(normalized);
        persistedCategoryIdsRef.current = new Set(normalized.donation.categories.map((category) => category.id));
        const firstDesktop = normalized.donation.desktopCategoryOrder[0] || normalized.donation.categories[0]?.id || "";
        const firstMobile = normalized.donation.mobileCategoryOrder[0] || normalized.donation.categories[0]?.id || "";
        setSelectedUpperCategory({ desktop: firstDesktop, mobile: firstMobile });
        const firstProjectCategory = normalized.donation.allCategoryId || firstDesktop;
        setProjectCategory(firstProjectCategory);
        const firstProjects = firstProjectCategory === normalized.donation.allCategoryId
          ? normalized.donation.projects
          : normalized.donation.projects.filter((project) => project.category === firstProjectCategory);
        setSelectedProjectId(firstProjects[0]?.id || "");
        setSettingsLoadError("");
        setSettingsReady(true);
      } catch {
        if (!active) return;
        setSettingsLoadError("Modül ayarları yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
        setSettingsReady(false);
        return;
      }

      const mediaResults = await Promise.allSettled([
        fetch("/api/admin/modules/category-media", { cache: "no-store" }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error("Kategori galerisi yüklenemedi.");
          return result.images || [];
        }),
        fetch("/api/admin/modules/images", { cache: "no-store" }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error("Eski galeri yüklenemedi.");
          return result.images || [];
        }),
      ]);
      if (!active) return;
      setImages(mediaResults.flatMap((result) => result.status === "fulfilled" ? result.value : []));
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const donation = settings.donation;
  const allOrderKey = lowerDevice === "desktop" ? "allOrderDesktop" : "allOrderMobile";
  const aggregateCategorySelected = Boolean(donation.allCategoryId) && projectCategory === donation.allCategoryId;
  const categoryProjects = (aggregateCategorySelected
    ? donation.projects
    : donation.projects.filter((project) => project.category === projectCategory))
    .slice()
    .sort((a, b) => aggregateCategorySelected
      ? (a[allOrderKey] ?? donation.projects.indexOf(a)) - (b[allOrderKey] ?? donation.projects.indexOf(b))
      : donation.projects.indexOf(a) - donation.projects.indexOf(b));
  const selectedProject = categoryProjects.find((project) => project.id === selectedProjectId) || categoryProjects[0];
  const update = (changes: Partial<typeof donation>) => setSettings((current) => ({
    ...current,
    donation: { ...current.donation, ...changes },
  }));
  const updateLower = (device: Device, changes: Partial<DonationLowerDeviceSettings>) => setSettings((current) => ({
    ...current,
    donation: {
      ...current.donation,
      [device === "desktop" ? "lowerDesktop" : "lowerMobile"]: {
        ...current.donation[device === "desktop" ? "lowerDesktop" : "lowerMobile"],
        ...changes,
      },
    },
  }));
  const updateProjects = (projects: DonationProject[]) => update({ projects });
  const updateProjectById = (projectId: string, updater: (project: DonationProject) => DonationProject) => setSettings((current) => ({
    ...current,
    donation: {
      ...current.donation,
      projects: current.donation.projects.map((project) => project.id === projectId ? updater(project) : project),
    },
  }));
  const updateProject = (changes: Partial<DonationProject>) => {
    if (!selectedProject) return;
    updateProjectById(selectedProject.id, (project) => ({ ...project, ...changes }));
  };
  const updateProjectDesign = (device: Device, changes: Partial<DonationProjectDesign>) => {
    if (!selectedProject) return;
    updateProjectById(selectedProject.id, (project) => ({ ...project, [device]: { ...project[device], ...changes } }));
  };
  const updateProjectCommerce = (updater: (commerce: DonationProjectCommerce) => DonationProjectCommerce) => {
    if (!selectedProject) return;
    updateProjectById(selectedProject.id, (project) => ({ ...project, commerce: updater(projectCommerceDraft(project)) }));
  };
  const addProject = () => {
    if (aggregateCategorySelected) {
      showToast("Yeni kart eklemek için önce gerçek bir bağış kategorisi seçin.");
      return;
    }
    const base = selectedProject || defaultModuleSettings.donation.projects[0];
    const id = `bagis-${crypto.randomUUID()}`;
    const project: DonationProject = {
      ...base,
      id,
      category: projectCategory,
      showInAllDesktop: true,
      showInAllMobile: true,
      allOrderDesktop: donation.projects.length,
      allOrderMobile: donation.projects.length,
      title: "Yeni bağış kartı",
      description: "Bağış kartı açıklamasını buradan düzenleyin.",
      badge: "Yeni",
      desktopMedia: [],
      mobileMedia: [],
      desktop: { ...base.desktop },
      mobile: { ...base.mobile },
      commerce: cloneCommerce(projectCommerceDraft(base)),
    };
    updateProjects([...donation.projects, project]);
    setSelectedProjectId(id);
  };
  const duplicateProject = () => {
    if (!selectedProject) return;
    const id = `${selectedProject.id}-kopya-${crypto.randomUUID()}`;
    const nextDesktopOrder = Math.max(-1, ...donation.projects.map((project) => project.allOrderDesktop ?? -1)) + 1;
    const nextMobileOrder = Math.max(-1, ...donation.projects.map((project) => project.allOrderMobile ?? -1)) + 1;
    updateProjects([...donation.projects, {
      ...selectedProject,
      id,
      title: `${selectedProject.title} Kopyası`,
      allOrderDesktop: nextDesktopOrder,
      allOrderMobile: nextMobileOrder,
      desktopMedia: [],
      mobileMedia: [],
      desktop: { ...selectedProject.desktop },
      mobile: { ...selectedProject.mobile },
      commerce: cloneCommerce(projectCommerceDraft(selectedProject)),
    }]);
    setSelectedProjectId(id);
  };
  const deleteProject = () => {
    if (!selectedProject || !window.confirm("Bu bağış kartı ve karta ait web/mobil medya galerileri tamamen silinsin mi?")) return;
    const removedId = selectedProject.id;
    const next = donation.projects.filter((project) => project.id !== removedId);
    setPendingProjectFolderDeletes((current) => [...new Set([...current, removedId])]);
    updateProjects(next);
    setSelectedProjectId(aggregateCategorySelected ? next[0]?.id || "" : next.find((project) => project.category === projectCategory)?.id || "");
    showToast("Kart kaldırıldı. Medya galerisi, ayarlar kaydedildikten sonra depodan silinecek.");
  };
  const moveProject = (direction: -1 | 1) => {
    if (!selectedProject) return;
    if (aggregateCategorySelected) {
      const currentIndex = categoryProjects.findIndex((project) => project.id === selectedProject.id);
      const target = categoryProjects[currentIndex + direction];
      if (!target) return;
      const selectedOrder = selectedProject[allOrderKey] ?? currentIndex;
      const targetOrder = target[allOrderKey] ?? currentIndex + direction;
      updateProjects(donation.projects.map((project) => {
        if (project.id === selectedProject.id) return { ...project, [allOrderKey]: targetOrder };
        if (project.id === target.id) return { ...project, [allOrderKey]: selectedOrder };
        return project;
      }));
      return;
    }
    const index = donation.projects.findIndex((project) => project.id === selectedProject.id);
    const siblingIndex = direction < 0
      ? donation.projects.map((project, itemIndex) => ({ project, itemIndex })).filter((item) => item.itemIndex < index && item.project.category === projectCategory).at(-1)?.itemIndex
      : donation.projects.findIndex((project, itemIndex) => itemIndex > index && project.category === projectCategory);
    if (siblingIndex === undefined || siblingIndex < 0) return;
    const next = [...donation.projects];
    [next[index], next[siblingIndex]] = [next[siblingIndex], next[index]];
    updateProjects(next);
  };

  const projectMedia = (device: Device) => selectedProject?.[device === "desktop" ? "desktopMedia" : "mobileMedia"] || [];
  const updateProjectMedia = (device: Device, media: DonationProjectMedia[]) => updateProject(device === "desktop" ? { desktopMedia: media } : { mobileMedia: media });
  const updateProjectMediaById = (
    projectId: string,
    device: Device,
    updater: (media: DonationProjectMedia[]) => DonationProjectMedia[],
  ) => setSettings((current) => {
    const mediaKey = device === "desktop" ? "desktopMedia" : "mobileMedia";
    return {
      ...current,
      donation: {
        ...current.donation,
        projects: current.donation.projects.map((project) => project.id === projectId
          ? { ...project, [mediaKey]: updater(project[mediaKey] || []) }
          : project),
      },
    };
  });
  async function uploadToR2(projectId: string, file: File, device: Device, purpose: "media" | "poster" = "media", metadata?: { width?: number; height?: number; originalName?: string; originalSize?: number }) {
    const response = await fetch("/api/admin/modules/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        device,
        purpose,
        contentType: file.type,
        size: file.size,
        width: metadata?.width,
        height: metadata?.height,
        originalName: metadata?.originalName || file.name,
        originalSize: metadata?.originalSize || file.size,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Yükleme bağlantısı oluşturulamadı.");
    const uploadResponse = await fetch(result.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type, ...(result.requiredHeaders || {}) },
      body: file,
    });
    if (!uploadResponse.ok) throw new Error("Dosya Cloudflare depolama alanına yüklenemedi.");
    const completeResponse = await fetch("/api/admin/modules/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        path: result.path,
        contentType: file.type,
        size: file.size,
      }),
    });
    const completed = await completeResponse.json();
    if (!completeResponse.ok) throw new Error(completed.error || "Yüklenen medya doğrulanamadı.");
    return { ...result, ...completed, ...metadata, size: file.size, originalName: metadata?.originalName || file.name } as {
      url: string;
      path: string;
      type: "image" | "video";
      width?: number;
      height?: number;
      size?: number;
      originalName?: string;
    };
  }
  async function uploadProjectMedia(file: File, device: Device) {
    const targetProjectId = selectedProject?.id;
    const targetProjectTitle = selectedProject?.title || "";
    if (!targetProjectId) return;
    setUploading(true);
    try {
      const isVideo = file.type === "video/mp4";
      if (!isVideo && !file.type.startsWith("image/")) throw new Error("WebP, JPG, PNG, AVIF görsel veya MP4 video yükleyin.");
      if (isVideo && file.size > 150 * 1024 * 1024) throw new Error("Video en fazla 150 MB olabilir.");
      const optimized = isVideo ? null : await optimizeProjectImage(file, device);
      const uploadFile = optimized?.file || file;
      const result = await uploadToR2(targetProjectId, uploadFile, device, "media", optimized || { originalName: file.name, originalSize: file.size });
      if (!result) return;
      const id = crypto.randomUUID();
      updateProjectMediaById(targetProjectId, device, (current) => [...current, {
        id,
        type: result.type,
        url: result.url,
        path: result.path,
        alt: targetProjectTitle,
        width: result.width,
        height: result.height,
        size: result.size,
        originalName: result.originalName,
      }]);
      setSelectedMediaIds((current) => ({ ...current, [device]: id }));
      showToast(result.type === "video" ? "Video bu karta ait galeriye eklendi." : "Görsel WebP biçimine dönüştürülüp galeriye eklendi.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Medya yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }
  async function uploadProjectPoster(file: File, device: Device, media: DonationProjectMedia) {
    const targetProjectId = selectedProject?.id;
    if (!targetProjectId) return;
    setUploadingPosterId(media.id);
    try {
      const optimized = await optimizeProjectImage(file, device);
      const result = await uploadToR2(targetProjectId, optimized.file, device, "poster", optimized);
      if (!result) return;
      if (media.posterPath) {
        setPendingProjectMediaDeletes((current) => [...new Set([...current, media.posterPath!])]);
      }
      updateProjectMediaById(targetProjectId, device, (current) => current.map((item) => item.id === media.id
        ? {
          ...item,
          poster: result.url,
          posterPath: result.path,
          posterWidth: result.width,
          posterHeight: result.height,
          posterSize: result.size,
          posterOriginalName: result.originalName,
        }
        : item));
      showToast("Video kapağı WebP biçimine dönüştürülüp kaydedildi.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Video kapağı yüklenemedi.");
    } finally {
      setUploadingPosterId("");
    }
  }
  async function removeProjectMedia(device: Device, media: DonationProjectMedia) {
    const paths = [media.path, media.posterPath].filter((path): path is string => Boolean(path));
    setPendingProjectMediaDeletes((current) => [...new Set([...current, ...paths])]);
    updateProjectMedia(device, projectMedia(device).filter((item) => item.id !== media.id));
    setSelectedMediaIds((current) => ({ ...current, [device]: current[device] === media.id ? "" : current[device] }));
    showToast("Medya galeriden kaldırıldı. Dosya, ayarlar kaydedildikten sonra depodan silinecek.");
  }
  function removeProjectPoster(device: Device, media: DonationProjectMedia) {
    if (media.posterPath) setPendingProjectMediaDeletes((current) => [...new Set([...current, media.posterPath!])]);
    updateProjectMedia(device, projectMedia(device).map((item) => item.id === media.id
      ? {
        ...item,
        poster: "",
        posterPath: "",
        posterWidth: undefined,
        posterHeight: undefined,
        posterSize: undefined,
        posterOriginalName: undefined,
      }
      : item));
    showToast("Video kapağı kaldırıldı. Yeni kapak yüklenene kadar kırık görsel gösterilecek.");
  }
  function makePrimaryProjectMedia(device: Device, mediaId: string) {
    const media = [...projectMedia(device)];
    const index = media.findIndex((item) => item.id === mediaId);
    if (index <= 0) return;
    const [item] = media.splice(index, 1);
    media.unshift(item);
    updateProjectMedia(device, media);
    setSelectedMediaIds((current) => ({ ...current, [device]: mediaId }));
  }
  function updateProjectMediaItem(device: Device, mediaId: string, changes: Partial<DonationProjectMedia>) {
    updateProjectMedia(device, projectMedia(device).map((item) => item.id === mediaId ? { ...item, ...changes } : item));
  }
  function moveProjectMedia(device: Device, index: number, direction: -1 | 1) {
    const media = [...projectMedia(device)];
    const target = index + direction;
    if (!media[target]) return;
    [media[index], media[target]] = [media[target], media[index]];
    updateProjectMedia(device, media);
  }
  const dropProject = (targetId: string) => {
    if (!draggedProjectId || draggedProjectId === targetId) return setDraggedProjectId("");
    const source = donation.projects.find((project) => project.id === draggedProjectId);
    const target = donation.projects.find((project) => project.id === targetId);
    if (!source || !target) return setDraggedProjectId("");
    if (aggregateCategorySelected) {
      const sourceOrder = source[allOrderKey] ?? categoryProjects.findIndex((project) => project.id === source.id);
      const targetOrder = target[allOrderKey] ?? categoryProjects.findIndex((project) => project.id === target.id);
      updateProjects(donation.projects.map((project) => project.id === source.id ? { ...project, [allOrderKey]: targetOrder } : project.id === target.id ? { ...project, [allOrderKey]: sourceOrder } : project));
    } else {
      const sourceIndex = donation.projects.findIndex((project) => project.id === source.id);
      const targetIndex = donation.projects.findIndex((project) => project.id === target.id);
      const next = [...donation.projects];
      [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
      updateProjects(next);
    }
    setDraggedProjectId("");
  };

  async function save() {
    if (!settingsReady) return showToast("Gerçek modül ayarları yüklenmeden kayıt yapılamaz. Sayfayı yenileyin.");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (!response.ok) return showToast(result.error || "Modül ayarları kaydedilemedi.");
      const normalized = normalizeModuleSettings(result.settings);
      setSettings(normalized);
      persistedCategoryIdsRef.current = new Set(normalized.donation.categories.map((category) => category.id));
      let mediaCleanupFailed = 0;

      if (pendingProjectMediaDeletes.length) {
        const cleanupResults = await Promise.all(pendingProjectMediaDeletes.map(async (path) => {
          try {
            const response = await fetch(path.startsWith("r2:") ? "/api/admin/modules/media" : "/api/admin/modules/images", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path }),
            });
            return { path, success: response.ok };
          } catch {
            return { path, success: false };
          }
        }));
        const failedPaths = cleanupResults.filter((item) => !item.success).map((item) => item.path);
        setPendingProjectMediaDeletes(failedPaths);
        mediaCleanupFailed += failedPaths.length;
      }

      if (pendingProjectFolderDeletes.length) {
        const cleanupResults = await Promise.all(pendingProjectFolderDeletes.map(async (projectId) => {
          try {
            const response = await fetch("/api/admin/modules/images", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId, deleteAll: true }),
            });
            return { projectId, success: response.ok };
          } catch {
            return { projectId, success: false };
          }
        }));
        const failedIds = cleanupResults.filter((item) => !item.success).map((item) => item.projectId);
        setPendingProjectFolderDeletes(failedIds);
        mediaCleanupFailed += failedIds.length;
      }

      if (pendingCategoryDeletes.length) {
        const cleanupResults = await Promise.all(pendingCategoryDeletes.map(async (categoryId) => {
          const requests = (["desktop", "mobile"] as const).map((device) => fetch("/api/admin/modules/category-media", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "deleteCategory", device, categoryId }),
          }));
          for (const image of pendingLegacyCategoryImages[categoryId] || []) {
            requests.push(fetch(image.path.startsWith("r2:") ? "/api/admin/modules/category-media" : "/api/admin/modules/images", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: image.path }),
            }));
          }
          const results = await Promise.allSettled(requests);
          return {
            categoryId,
            success: results.every((item) => item.status === "fulfilled" && item.value.ok),
          };
        }));
        const deletedIds = cleanupResults.filter((item) => item.success).map((item) => item.categoryId);
        const failedIds = cleanupResults.filter((item) => !item.success).map((item) => item.categoryId);
        const deletedLegacyPaths = new Set(deletedIds.flatMap((categoryId) => (pendingLegacyCategoryImages[categoryId] || []).map((image) => image.path)));
        setPendingCategoryDeletes(failedIds);
        setPendingLegacyCategoryImages((current) => Object.fromEntries(failedIds.map((categoryId) => [categoryId, current[categoryId] || []])));
        setImages((current) => current.filter((image) => !deletedIds.includes(image.categoryId || "") && !deletedLegacyPaths.has(image.path)));
        if (failedIds.length) {
          showToast(`Ayarlar kaydedildi; ${failedIds.length} kategori galerisi temizlenemedi ve sonraki kayıtta yeniden denenecek.`);
          return;
        }
      }
      showToast(mediaCleanupFailed
        ? `Ayarlar kaydedildi; ${mediaCleanupFailed} medya dosyası temizlenemedi ve sonraki kayıtta yeniden denenecek.`
        : "Modül ayarları canlı siteye kaydedildi.");
    } catch {
      showToast("Modül ayarları kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  const categoryVisibility = (device: Device) => device === "desktop"
    ? donation.desktopVisibleCategories
    : donation.mobileVisibleCategories;
  const categoryOrder = (device: Device) => device === "desktop"
    ? donation.desktopCategoryOrder
    : donation.mobileCategoryOrder;

  function toggleCategory(id: DonationCategoryId, device: Device) {
    const current = categoryVisibility(device);
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    const other = categoryVisibility(device === "desktop" ? "mobile" : "desktop");
    update(device === "desktop"
      ? { desktopVisibleCategories: next, visibleCategories: [...new Set([...next, ...other])] }
      : { mobileVisibleCategories: next, visibleCategories: [...new Set([...next, ...other])] });
  }

  function reorderCategory(device: Device, sourceId: DonationCategoryId, targetId: DonationCategoryId) {
    if (sourceId === targetId) return;
    const order = [...categoryOrder(device)];
    const sourceIndex = order.indexOf(sourceId);
    const targetIndex = order.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    order.splice(sourceIndex, 1);
    order.splice(targetIndex, 0, sourceId);
    update(device === "desktop" ? { desktopCategoryOrder: order } : { mobileCategoryOrder: order });
  }

  function moveCategory(device: Device, id: DonationCategoryId, direction: -1 | 1) {
    const order = categoryOrder(device);
    const index = order.indexOf(id);
    const target = order[index + direction];
    if (index < 0 || !target) return;
    reorderCategory(device, id, target);
  }

  const chooseUpperCategory = useCallback((device: Device, id: string) => {
    setSelectedUpperCategory((current) => ({ ...current, [device]: id }));
    requestAnimationFrame(() => {
      const rail = categoryStripRefs.current[device];
      const card = rail?.querySelector<HTMLElement>(`[data-category-id="${CSS.escape(id)}"]`);
      if (!rail || !card) return;
      const target = card.offsetLeft - Math.max(0, (rail.clientWidth - card.offsetWidth) / 2);
      rail.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    });
  }, []);
  const chooseDesktopPreviewCategory = useCallback((id: string) => chooseUpperCategory("desktop", id), [chooseUpperCategory]);
  const chooseMobilePreviewCategory = useCallback((id: string) => chooseUpperCategory("mobile", id), [chooseUpperCategory]);

  function updateCategoryDefinition(id: string, changes: Partial<DonationCategory>) {
    update({ categories: donation.categories.map((category) => category.id === id ? { ...category, ...changes, id } : category) });
  }

  function addCategory(device: Device) {
    const id = normalizeDonationCategoryId(`kategori-${crypto.randomUUID().slice(0, 8)}`, "kategori");
    const category: DonationCategory = {
      id,
      label: "Yeni kategori",
      description: "",
      imageTitle: "Yeni kategori",
      imageAlt: "Yeni bağış kategorisi",
    };
    update({
      categories: [...donation.categories, category],
      categoryImages: { ...donation.categoryImages, [id]: { desktop: "", mobile: "" } },
      visibleCategories: [...new Set([...donation.visibleCategories, id])],
      desktopVisibleCategories: [...donation.desktopVisibleCategories, id],
      mobileVisibleCategories: [...donation.mobileVisibleCategories, id],
      desktopCategoryOrder: [...donation.desktopCategoryOrder, id],
      mobileCategoryOrder: [...donation.mobileCategoryOrder, id],
    });
    chooseUpperCategory(device, id);
  }

  function removeCategory(id: string, device: Device) {
    const category = donation.categories.find((item) => item.id === id);
    if (!category) return;
    const linkedProjects = donation.projects.filter((project) => project.category === id);
    if (linkedProjects.length) {
      showToast(`Bu kategoriye bağlı ${linkedProjects.length} bağış kartı var. Önce kartları başka kategoriye taşıyın veya silin.`);
      return;
    }
    if (donation.categories.length <= 1) {
      showToast("En az bir bağış kategorisi kalmalıdır.");
      return;
    }
    if (!window.confirm(`“${category.label}” kategorisi ve web/mobil görsel galerileri kalıcı olarak silinsin mi?`)) return;
    const nextCategories = donation.categories.filter((item) => item.id !== id);
    const categoryUrls = new Set(Object.values(donation.categoryImages[id] || {}).filter(Boolean));
    const legacyImages = images.filter((image) => {
      if (image.categoryId || !categoryUrls.has(image.url)) return false;
      return !nextCategories.some((item) => {
        const itemImages = donation.categoryImages[item.id];
        return itemImages?.desktop === image.url || itemImages?.mobile === image.url;
      });
    });
    const nextImages = { ...donation.categoryImages };
    delete nextImages[id];
    update({
      categories: nextCategories,
      allCategoryId: donation.allCategoryId === id ? "" : donation.allCategoryId,
      categoryImages: nextImages,
      visibleCategories: donation.visibleCategories.filter((item) => item !== id),
      desktopVisibleCategories: donation.desktopVisibleCategories.filter((item) => item !== id),
      mobileVisibleCategories: donation.mobileVisibleCategories.filter((item) => item !== id),
      desktopCategoryOrder: donation.desktopCategoryOrder.filter((item) => item !== id),
      mobileCategoryOrder: donation.mobileCategoryOrder.filter((item) => item !== id),
    });
    setPendingCategoryDeletes((current) => [...new Set([...current, id])]);
    setPendingLegacyCategoryImages((current) => ({ ...current, [id]: legacyImages }));
    const fallback = (device === "desktop" ? donation.desktopCategoryOrder : donation.mobileCategoryOrder).find((item) => item !== id) || nextCategories[0]?.id || "";
    chooseUpperCategory(device, fallback);
    if (projectCategory === id) {
      setProjectCategory(fallback);
      setSelectedProjectId(donation.projects.find((project) => project.category === fallback)?.id || "");
    }
    showToast("Kategori kaldırıldı. Kaydet ve Yayınla ile galeri de kalıcı olarak silinecek.");
  }

  function toggleAllCategory(id: string) {
    const nextAllCategoryId = donation.allCategoryId === id ? "" : id;
    update({ allCategoryId: nextAllCategoryId });
    setProjectCategory(id);
    const nextProjects = nextAllCategoryId
      ? donation.projects.slice().sort((a, b) => (a[allOrderKey] ?? donation.projects.indexOf(a)) - (b[allOrderKey] ?? donation.projects.indexOf(b)))
      : donation.projects.filter((project) => project.category === id);
    setSelectedProjectId(nextProjects[0]?.id || "");
  }

  async function optimizeCategoryImage(file: File, device: Device) {
    const accepted = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);
    if (!accepted.has(file.type)) throw new Error("PNG, JPG, WebP veya AVIF biçiminde bir görsel seçin.");
    if (file.size > 12 * 1024 * 1024) throw new Error("Görsel en fazla 12 MB olabilir.");
    const bitmap = await createImageBitmap(file);
    const maxEdge = device === "desktop" ? 1200 : 800;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    let quality = .84;
    let blob: Blob | null = null;
    const targetSize = 240 * 1024;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) {
        bitmap.close();
        throw new Error("Görsel işleme başlatılamadı.");
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (!blob) break;
      if (blob.size <= targetSize || Math.max(width, height) <= 420) break;
      if (quality > .68) quality -= .04;
      else {
        width = Math.max(1, Math.round(width * .88));
        height = Math.max(1, Math.round(height * .88));
        quality = .78;
      }
    }
    bitmap.close();
    if (!blob) throw new Error("Görsel WebP biçimine dönüştürülemedi.");
    return {
      file: new File([blob], `${file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]/gi, "-") || "kategori"}.webp`, { type: "image/webp" }),
      width,
      height,
      originalSize: file.size,
      originalName: file.name,
    };
  }

  async function uploadImage(file: File, device: Device, categoryId = selectedUpperCategory[device]) {
    if (!categoryId) return showToast("Önce bir kategori seçin.");
    if (!persistedCategoryIdsRef.current.has(categoryId)) return showToast("Yeni kategoriye görsel yüklemeden önce Kaydet ve Yayınla düğmesine basın.");
    setUploading(true);
    try {
      const optimized = await optimizeCategoryImage(file, device);
      const response = await fetch("/api/admin/modules/category-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device,
          categoryId,
          contentType: optimized.file.type,
          size: optimized.file.size,
          width: optimized.width,
          height: optimized.height,
          originalSize: optimized.originalSize,
          originalName: optimized.originalName,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Cloudflare yükleme bağlantısı oluşturulamadı.");
      const uploadResponse = await fetch(result.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": optimized.file.type, ...(result.requiredHeaders || result.headers || {}) },
        body: optimized.file,
      });
      if (!uploadResponse.ok) throw new Error("Optimize edilmiş görsel Cloudflare R2 alanına yüklenemedi.");
      const image: GalleryImage = {
        path: result.path,
        url: result.url,
        size: optimized.file.size,
        device,
        width: optimized.width,
        height: optimized.height,
        originalSize: optimized.originalSize,
        originalName: optimized.originalName,
        createdAt: new Date().toISOString(),
        format: "webp",
        categoryId,
        legacy: false,
      };
      setImages((current) => [image, ...current]);
      selectCategoryImage(categoryId, device, image.url);
      showToast(`${formatSize(optimized.originalSize)} görsel ${formatSize(optimized.file.size)} WebP olarak optimize edildi.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Görsel yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(image: GalleryImage) {
    const usages = donation.categories.flatMap((category) => {
      const devices = (["desktop", "mobile"] as const).filter((device) => donation.categoryImages[category.id]?.[device] === image.url);
      return devices.length ? [{ category, devices }] : [];
    });
    const usageText = usages.length ? ` Bu görsel ${usages.map(({ category }) => category.label).join(", ")} kategorilerinde kullanılıyor; görsel alanı boşaltılacak.` : "";
    if (!window.confirm(`Bu görsel kalıcı olarak silinsin mi?${usageText}`)) return;
    if (usages.length) {
      const categoryImages = { ...donation.categoryImages };
      for (const { category, devices } of usages) {
        const next = { ...categoryImages[category.id] };
        for (const device of devices) next[device] = "";
        categoryImages[category.id] = next;
      }
      const nextSettings = { ...settings, donation: { ...donation, categoryImages } };
      const settingsResponse = await fetch("/api/admin/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });
      if (!settingsResponse.ok) return showToast("Kullanımdaki görsel güvenle kaldırılamadı.");
      setSettings(nextSettings);
    }
    const response = await fetch(image.path.startsWith("r2:") ? "/api/admin/modules/category-media" : "/api/admin/modules/images", {
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

  const aspectRatios = [
    ["custom", "Özel"], ["1:1", "1:1 Kare"], ["4:3", "4:3 Yatay"], ["3:2", "3:2 Yatay"],
    ["16:9", "16:9 Geniş"], ["3:4", "3:4 Dikey"], ["2:3", "2:3 Dikey"], ["9:16", "9:16 Uzun"],
  ] as const;

  function setAspectRatio(device: Device, ratio: string) {
    const width = device === "desktop" ? donation.desktopCardWidth : donation.mobileCardWidth;
    if (ratio === "custom") {
      update(device === "desktop" ? { desktopAspectRatio: ratio } : { mobileAspectRatio: ratio });
      return;
    }
    const [ratioWidth, ratioHeight] = ratio.split(":").map(Number);
    const height = Math.round(width * ratioHeight / ratioWidth);
    update(device === "desktop"
      ? { desktopAspectRatio: ratio, desktopCardHeight: Math.min(500, Math.max(60, height)) }
      : { mobileAspectRatio: ratio, mobileCardHeight: Math.min(400, Math.max(50, height)) });
  }

  function updateImageWidth(device: Device, width: number) {
    const ratio = device === "desktop" ? donation.desktopAspectRatio : donation.mobileAspectRatio;
    if (ratio === "custom") {
      update(device === "desktop" ? { desktopCardWidth: width } : { mobileCardWidth: width });
      return;
    }
    const [ratioWidth, ratioHeight] = ratio.split(":").map(Number);
    const height = Math.round(width * ratioHeight / ratioWidth);
    update(device === "desktop"
      ? { desktopCardWidth: width, desktopCardHeight: Math.min(500, Math.max(60, height)) }
      : { mobileCardWidth: width, mobileCardHeight: Math.min(400, Math.max(50, height)) });
  }

  const formatSize = (bytes: number) => bytes <= 0 ? "0 KB" : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const imageRatio = (width: number, height: number) => {
    const divisor = (a: number, b: number): number => b ? divisor(b, a % b) : a;
    const common = divisor(width, height);
    const ratioWidth = width / common;
    const ratioHeight = height / common;
    return ratioWidth <= 20 && ratioHeight <= 20 ? `${ratioWidth}:${ratioHeight}` : (width / height).toFixed(2);
  };

  function chooseProjectCategory(category: string) {
    setProjectCategory(category);
    const projects = category === donation.allCategoryId
      ? donation.projects.slice().sort((a, b) => (a[allOrderKey] ?? donation.projects.indexOf(a)) - (b[allOrderKey] ?? donation.projects.indexOf(b)))
      : donation.projects.filter((project) => project.category === category);
    setSelectedProjectId(projects[0]?.id || "");
  }

  const projectControls = (device: Device) => {
    const currentProject = selectedProject || defaultModuleSettings.donation.projects[0];
    const design = currentProject[device];
    const commerce = projectCommerceDraft(currentProject);
    const actionDeviceKey = device;
    const actionLayoutKey = device === "desktop" ? "actionLayoutDesktop" : "actionLayoutMobile";
    const actionGapKey = device === "desktop" ? "actionGapDesktop" : "actionGapMobile";
    const optionDesignKey = device === "desktop" ? "optionDesignDesktop" : "optionDesignMobile";
    const groupDesignKey = device === "desktop" ? "desktopDesign" : "mobileDesign";
    const groupTitleVisibleKey = device === "desktop" ? "titleVisibleDesktop" : "titleVisibleMobile";
    const groupDescriptionVisibleKey = device === "desktop" ? "descriptionVisibleDesktop" : "descriptionVisibleMobile";
    const optionSharedTextKey = device === "desktop" ? "useSharedTextDesignDesktop" : "useSharedTextDesignMobile";
    const optionTextDesignKey = device === "desktop" ? "desktopTextDesign" : "mobileTextDesign";
    const sharedOptionDesign = commerce[optionDesignKey];
    const sharedImage = device === "desktop" ? donation.lowerDesktop : donation.lowerMobile;
    const mediaItems = projectMedia(device);
    const selectedMedia = mediaItems.find((media) => media.id === selectedMediaIds[device]) || mediaItems[0];
    const selectedMediaIndex = selectedMedia ? mediaItems.findIndex((media) => media.id === selectedMedia.id) : -1;
    const useSharedMediaDesign = design.useSharedImageDesign !== false;
    const mediaDesign = useSharedMediaDesign ? sharedImage : design;
    const updateSharedImage = (changes: Partial<DonationLowerDeviceSettings>) => updateLower(device, changes);
    const designRange = (label: string, key: keyof DonationProjectDesign, min: number, max: number, suffix = "px") => (
      <label>{label} <b>{String(design[key])} {suffix}</b><input type="range" min={min} max={max} value={Number(design[key])} onChange={(event) => updateProjectDesign(device, { [key]: Number(event.target.value) })} /></label>
    );
    const sharedRange = (label: string, key: keyof DonationLowerDeviceSettings, min: number, max: number, suffix = "px") => (
      <label>{label} <b>{String(sharedImage[key])} {suffix}</b><input type="range" min={min} max={max} value={Number(sharedImage[key])} onChange={(event) => updateSharedImage({ [key]: Number(event.target.value) })} /></label>
    );
    const changeCommerce = (updater: (current: DonationProjectCommerce) => DonationProjectCommerce) => updateProjectCommerce(updater);
    const changeCommerceAndLegacy = (
      updater: (current: DonationProjectCommerce) => DonationProjectCommerce,
      legacy: (project: DonationProject, next: DonationProjectCommerce) => Partial<DonationProject>,
    ) => {
      if (!selectedProject) return;
      updateProjectById(selectedProject.id, (project) => {
        const next = updater(projectCommerceDraft(project));
        return { ...project, ...legacy(project, next), commerce: next };
      });
    };
    const updateOptionGroup = (groupId: string, changes: Partial<DonationOptionGroup>) => changeCommerce((current) => ({
      ...current,
      optionGroups: current.optionGroups.map((group) => group.id === groupId ? { ...group, ...changes } : group),
    }));
    const updateOption = (groupId: string, optionId: string, changes: Partial<DonationOptionGroup["options"][number]>) => changeCommerce((current) => ({
      ...current,
      optionGroups: current.optionGroups.map((group) => group.id === groupId
        ? { ...group, options: group.options.map((option) => option.id === optionId ? { ...option, ...changes } : option) }
        : group),
    }));
    const updateGroupOptions = (groupId: string, updater: (options: DonationOptionGroup["options"]) => DonationOptionGroup["options"]) => changeCommerce((current) => ({
      ...current,
      optionGroups: current.optionGroups.map((group) => group.id === groupId ? { ...group, options: updater(group.options) } : group),
    }));
    const updateSharedOptionDesign = (changes: Partial<DonationOptionDesign>) => changeCommerce((current) => ({
      ...current,
      [optionDesignKey]: { ...current[optionDesignKey], ...changes },
    }));
    const updateGroupOptionDesign = (groupId: string, changes: Partial<DonationOptionDesign>) => changeCommerce((current) => ({
      ...current,
      optionGroups: current.optionGroups.map((group) => group.id === groupId
        ? { ...group, [groupDesignKey]: { ...(group[groupDesignKey] || current[optionDesignKey]), ...changes } }
        : group),
    }));
    const updateOptionUseSharedText = (
      groupId: string,
      optionId: string,
      useShared: boolean,
      fallback: DonationOptionTextDesign,
    ) => changeCommerce((current) => ({
      ...current,
      optionGroups: current.optionGroups.map((group) => group.id === groupId
        ? {
          ...group,
          options: group.options.map((option) => option.id === optionId
            ? {
              ...option,
              [optionSharedTextKey]: useShared,
              ...(!useShared ? { [optionTextDesignKey]: { ...fallback } } : {}),
            }
            : option),
        }
        : group),
    }));
    const updateOptionTextDesign = (
      groupId: string,
      optionId: string,
      fallback: DonationOptionTextDesign,
      changes: Partial<DonationOptionTextDesign>,
    ) => changeCommerce((current) => ({
      ...current,
      optionGroups: current.optionGroups.map((group) => group.id === groupId
        ? {
          ...group,
          options: group.options.map((option) => option.id === optionId
            ? { ...option, [optionTextDesignKey]: { ...fallback, ...option[optionTextDesignKey], ...changes } }
            : option),
        }
        : group),
    }));
    const updatePriceRule = (ruleId: string, changes: Partial<DonationPriceRule>) => changeCommerce((current) => ({
      ...current,
      priceRules: current.priceRules.map((rule) => rule.id === ruleId ? { ...rule, ...changes } : rule),
    }));
    const updateAction = (actionId: string, changes: Partial<DonationProjectAction>) => changeCommerce((current) => ({
      ...current,
      actions: current.actions.map((action) => action.id === actionId ? { ...action, ...changes } : action),
    }));
    const updateActionDevice = (actionId: string, changes: Partial<DonationProjectAction[Device]>) => changeCommerce((current) => ({
      ...current,
      actions: current.actions.map((action) => action.id === actionId
        ? { ...action, [actionDeviceKey]: { ...action[actionDeviceKey], ...changes } }
        : action),
    }));
    const addOptionGroup = () => {
      if (commerce.optionGroups.length >= COMMERCE_LIMITS.optionGroups) {
        showToast(`En fazla ${COMMERCE_LIMITS.optionGroups} seçenek grubu eklenebilir.`);
        return;
      }
      const groupId = commerceId("grup");
      const optionId = commerceId("secenek");
      changeCommerce((current) => ({
        ...current,
        optionGroups: [...current.optionGroups, {
          id: groupId,
          label: "Yeni seçenek grubu",
          description: "",
          enabled: true,
          required: true,
          display: "buttons",
          defaultOptionId: optionId,
          useSharedDesign: true,
          options: [{ id: optionId, label: "1. seçenek", description: "", enabled: true, priceMinor: 0 }],
        }],
      }));
      setExpandedOptionGroupId(groupId);
    };
    const addPriceRule = () => {
      if (commerce.priceRules.length >= COMMERCE_LIMITS.priceRules) {
        showToast(`En fazla ${COMMERCE_LIMITS.priceRules} fiyat kuralı eklenebilir.`);
        return;
      }
      const id = commerceId("kural");
      changeCommerce((current) => ({
        ...current,
        priceRules: [...current.priceRules, {
          id,
          label: "Yeni fiyat kuralı",
          enabled: true,
          optionIds: [],
          amountMinor: current.baseAmountMinor,
        }],
      }));
      setExpandedPriceRuleId(id);
    };
    const addAction = () => {
      if (commerce.actions.length >= COMMERCE_LIMITS.actions) {
        showToast(`En fazla ${COMMERCE_LIMITS.actions} düğme eklenebilir.`);
        return;
      }
      const id = commerceId("dugme");
      const nextOrder = commerce.actions.length;
      changeCommerce((current) => ({
        ...current,
        actions: [...current.actions, {
          id,
          enabled: true,
          kind: "add-to-cart",
          icon: "plus",
          href: "",
          requiresValidSelection: true,
          variant: "solid",
          background: design.actionBackground,
          backgroundEnd: design.actionBackground,
          textColor: design.actionTextColor,
          borderColor: design.actionBackground,
          desktop: {
            visible: true,
            label: "Sepete ekle",
            width: "full",
            align: "center",
            height: currentProject.desktop.actionHeight,
            radius: currentProject.desktop.actionRadius,
            order: nextOrder,
          },
          mobile: {
            visible: true,
            label: "Sepete ekle",
            width: "full",
            align: "center",
            height: currentProject.mobile.actionHeight,
            radius: currentProject.mobile.actionRadius,
            order: nextOrder,
          },
        }],
      }));
      setExpandedActionId(id);
    };
    const orderedActions = commerce.actions
      .map((action, index) => ({ action, index }))
      .sort((a, b) => a.action[actionDeviceKey].order - b.action[actionDeviceKey].order || a.index - b.index)
      .map(({ action }) => action);
    const moveAction = (actionId: string, direction: -1 | 1) => changeCommerce((current) => {
      const sorted = current.actions
        .map((action, index) => ({ action, index }))
        .sort((a, b) => a.action[actionDeviceKey].order - b.action[actionDeviceKey].order || a.index - b.index)
        .map(({ action }) => action);
      const index = sorted.findIndex((action) => action.id === actionId);
      const next = moveCommerceItem(sorted, index, direction);
      if (next === sorted) return current;
      const orders = new Map(next.map((action, order) => [action.id, order]));
      return {
        ...current,
        actions: current.actions.map((action) => ({
          ...action,
          [actionDeviceKey]: { ...action[actionDeviceKey], order: orders.get(action.id) ?? action[actionDeviceKey].order },
        })),
      };
    });
    const setActionOrder = (actionId: string, targetOrder: number) => changeCommerce((current) => {
      const sorted = current.actions
        .map((action, index) => ({ action, index }))
        .sort((a, b) => a.action[actionDeviceKey].order - b.action[actionDeviceKey].order || a.index - b.index)
        .map(({ action }) => action);
      const currentIndex = sorted.findIndex((action) => action.id === actionId);
      if (currentIndex < 0) return current;
      const [moved] = sorted.splice(currentIndex, 1);
      sorted.splice(Math.max(0, Math.min(targetOrder, sorted.length)), 0, moved);
      const orders = new Map(sorted.map((action, order) => [action.id, order]));
      return {
        ...current,
        actions: current.actions.map((action) => ({
          ...action,
          [actionDeviceKey]: { ...action[actionDeviceKey], order: orders.get(action.id) ?? action[actionDeviceKey].order },
        })),
      };
    });
    const commerceRowActions = ({
      label,
      index,
      total,
      onDuplicate,
      onMove,
      onDelete,
    }: {
      label: string;
      index: number;
      total: number;
      onDuplicate: () => void;
      onMove: (direction: -1 | 1) => void;
      onDelete: () => void;
    }) => (
      <nav className={styles.paymentRowActions} aria-label={`${label} işlemleri`}>
        <button type="button" title="Çoğalt" aria-label={`${label} çoğalt`} onClick={onDuplicate}>⧉</button>
        <button type="button" title="Yukarı taşı" aria-label={`${label} yukarı taşı`} disabled={index === 0} onClick={() => onMove(-1)}>↑</button>
        <button type="button" title="Aşağı taşı" aria-label={`${label} aşağı taşı`} disabled={index === total - 1} onClick={() => onMove(1)}>↓</button>
        <button className={styles.paymentDeleteButton} type="button" title="Sil" aria-label={`${label} sil`} onClick={onDelete}>×</button>
      </nav>
    );
    const modeLabel = {
      amount: "Tutar",
      quantity: "Adet / hisse",
      fixed: "Sabit",
      configured: "Seçenekli",
    }[commerce.mode];
    const paymentControls = <div className={styles.paymentWorkspace}>
      <header className={styles.paymentWorkspaceHeader}>
        <div>
          <span>{device === "desktop" ? "WEB" : "MOBİL"} · COMMERCE V2</span>
          <strong>Fiyat ve düğme merkezi</strong>
          <small>Bağış akışını tek, düzenli çalışma alanından yönetin.</small>
        </div>
        <div className={styles.paymentSummary} aria-label="Bağış akışı özeti">
          <span><b>{modeLabel}</b> model</span>
          <span><b>{commerce.optionGroups.length}</b> grup</span>
          <span><b>{commerce.priceRules.length}</b> kural</span>
          <span><b>{commerce.actions.length}</b> düğme</span>
        </div>
      </header>

      <nav className={styles.paymentSubtabs} aria-label="Fiyat ve düğme ayar grupları">
        {([
          ["model", "Bağış modeli", "₺"],
          ["options", "Seçenekler", "⌘"],
          ["rules", "Fiyat kuralları", "≋"],
          ["actions", "Düğmeler", "↗"],
        ] as const).map(([id, label, icon]) => <button type="button" key={id} className={paymentWorkspace === id ? styles.paymentSubtabActive : ""} aria-pressed={paymentWorkspace === id} onClick={() => setPaymentWorkspace(id)}>
          <i>{icon}</i><span>{label}</span>
        </button>)}
      </nav>

      {paymentWorkspace === "model" ? <div className={styles.paymentPanel}>
        <div className={styles.paymentSectionHeading}>
          <div><strong>Temel bağış modeli</strong><small>Tutarın nasıl seçileceğini ve doğrulama metinlerini belirleyin.</small></div>
          <span className={styles.paymentLimitBadge}>TRY · kuruş hassasiyeti</span>
        </div>
        <div className={styles.paymentFieldGrid}>
          <label>Bağış modeli<select value={commerce.mode} onChange={(event) => {
            const mode = event.target.value as DonationProjectCommerce["mode"];
            changeCommerceAndLegacy(
              (current) => ({ ...current, mode }),
              () => ({ pricingMode: mode === "quantity" ? "quantity" : "amount" }),
            );
          }}>
            <option value="amount">Hazır / özel tutar</option>
            <option value="quantity">Adet veya hisse</option>
            <option value="fixed">Sabit tutar</option>
            <option value="configured">Seçeneklere göre</option>
          </select></label>
          <label>Para birimi<input value="Türk lirası (TRY)" disabled /></label>
          <label>Bölüm etiketi<input maxLength={50} value={commerce.sectionLabel} onChange={(event) => changeCommerce((current) => ({ ...current, sectionLabel: event.target.value }))} /></label>
          <label>Temel / sabit tutar<div className={styles.paymentMoneyInput}><span>₺</span><input type="number" min="0" step=".01" value={fromMinor(commerce.baseAmountMinor)} onChange={(event) => {
            const baseAmountMinor = toMinor(event.target.value);
            changeCommerceAndLegacy(
              (current) => ({ ...current, baseAmountMinor }),
              () => ({ fixedPrice: fromMinor(baseAmountMinor) }),
            );
          }} /></div></label>
          <label className={styles.paymentFieldWide}>Doğrulama mesajı<input maxLength={140} value={commerce.validationMessage} onChange={(event) => changeCommerce((current) => ({ ...current, validationMessage: event.target.value }))} placeholder="Lütfen gerekli seçimleri tamamlayın." /></label>
        </div>

        {commerce.mode === "amount" ? <div className={styles.paymentCollection}>
          <div className={styles.paymentCollectionHeader}>
            <div><strong>Hazır tutarlar</strong><small>Ziyaretçinin tek dokunuşla seçebileceği tutarlar.</small></div>
            <button type="button" disabled={commerce.amountPresets.length >= COMMERCE_LIMITS.amountPresets} onClick={() => {
              if (commerce.amountPresets.length >= COMMERCE_LIMITS.amountPresets) return;
              changeCommerceAndLegacy(
                (current) => {
                  const last = current.amountPresets.at(-1)?.amountMinor || 0;
                  return {
                    ...current,
                    amountPresets: [...current.amountPresets, {
                      id: commerceId("tutar"),
                      label: "",
                      amountMinor: last ? last + 25000 : 25000,
                      enabled: true,
                      featured: false,
                    }],
                  };
                },
                (_, next) => ({ suggested: next.amountPresets.map((preset) => fromMinor(preset.amountMinor)) }),
              );
            }}>＋ Tutar</button>
          </div>
          <div className={styles.paymentBuilderList}>
            {commerce.amountPresets.length ? commerce.amountPresets.map((preset, index) => <article className={styles.paymentPresetRow} key={preset.id}>
              <span className={styles.paymentDragIndex}>{String(index + 1).padStart(2, "0")}</span>
              <label>Etiket<input maxLength={30} value={preset.label} onChange={(event) => changeCommerce((current) => ({
                ...current,
                amountPresets: current.amountPresets.map((item) => item.id === preset.id ? { ...item, label: event.target.value } : item),
              }))} placeholder={formatMinor(preset.amountMinor)} /></label>
              <label>Tutar<div className={styles.paymentMoneyInput}><span>₺</span><input type="number" min="1" step=".01" value={fromMinor(preset.amountMinor)} onChange={(event) => {
                const amountMinor = toMinor(event.target.value);
                changeCommerceAndLegacy(
                  (current) => ({ ...current, amountPresets: current.amountPresets.map((item) => item.id === preset.id ? { ...item, amountMinor } : item) }),
                  (_, next) => ({ suggested: next.amountPresets.map((item) => fromMinor(item.amountMinor)) }),
                );
              }} /></div></label>
              <div className={styles.paymentMiniToggles}>
                <label><input type="checkbox" checked={preset.enabled} onChange={(event) => changeCommerce((current) => ({ ...current, amountPresets: current.amountPresets.map((item) => item.id === preset.id ? { ...item, enabled: event.target.checked } : item) }))} /><span>Aktif</span></label>
                <label><input type="checkbox" checked={preset.featured} onChange={(event) => changeCommerce((current) => ({ ...current, amountPresets: current.amountPresets.map((item) => item.id === preset.id ? { ...item, featured: event.target.checked } : item) }))} /><span>Öne çıkar</span></label>
              </div>
              {commerceRowActions({
                label: `${index + 1}. tutar`,
                index,
                total: commerce.amountPresets.length,
                onDuplicate: () => {
                  if (commerce.amountPresets.length >= COMMERCE_LIMITS.amountPresets) return showToast(`En fazla ${COMMERCE_LIMITS.amountPresets} hazır tutar eklenebilir.`);
                  changeCommerceAndLegacy(
                    (current) => {
                      const itemIndex = current.amountPresets.findIndex((item) => item.id === preset.id);
                      const next = [...current.amountPresets];
                      next.splice(itemIndex + 1, 0, { ...preset, id: commerceId("tutar"), label: preset.label ? `${preset.label} kopyası` : "" });
                      return { ...current, amountPresets: next };
                    },
                    (_, next) => ({ suggested: next.amountPresets.map((item) => fromMinor(item.amountMinor)) }),
                  );
                },
                onMove: (direction) => changeCommerceAndLegacy(
                  (current) => ({ ...current, amountPresets: moveCommerceItem(current.amountPresets, current.amountPresets.findIndex((item) => item.id === preset.id), direction) }),
                  (_, next) => ({ suggested: next.amountPresets.map((item) => fromMinor(item.amountMinor)) }),
                ),
                onDelete: () => changeCommerceAndLegacy(
                  (current) => ({ ...current, amountPresets: current.amountPresets.filter((item) => item.id !== preset.id) }),
                  (_, next) => ({ suggested: next.amountPresets.map((item) => fromMinor(item.amountMinor)) }),
                ),
              })}
            </article>) : <div className={styles.paymentEmpty}><b>Hazır tutar yok</b><span>“＋ Tutar” ile ilk seçeneği ekleyin.</span></div>}
          </div>
        </div> : null}

        {commerce.mode === "quantity" ? <div className={styles.paymentCollection}>
          <div className={styles.paymentCollectionHeader}>
            <div><strong>Adet / hisse seçenekleri</strong><small>Birim fiyat, seçilen adet ile otomatik çarpılır.</small></div>
            <button type="button" disabled={commerce.quantityPresets.length >= COMMERCE_LIMITS.quantityPresets} onClick={() => changeCommerceAndLegacy(
              (current) => ({ ...current, quantityPresets: [...current.quantityPresets, Math.max(1, (current.quantityPresets.at(-1) || 0) + 1)] }),
              (_, next) => ({ suggested: next.quantityPresets }),
            )}>＋ Adet</button>
          </div>
          <div className={styles.paymentQuantityGrid}>
            {commerce.quantityPresets.map((quantity, index) => <article key={`${quantity}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <label>Adet<input type="number" min="1" max="999" value={quantity} onChange={(event) => changeCommerceAndLegacy(
                (current) => ({ ...current, quantityPresets: current.quantityPresets.map((item, itemIndex) => itemIndex === index ? Math.max(1, Math.min(999, Number(event.target.value))) : item) }),
                (_, next) => ({ suggested: next.quantityPresets }),
              )} /></label>
              {commerceRowActions({
                label: `${index + 1}. adet`,
                index,
                total: commerce.quantityPresets.length,
                onDuplicate: () => {
                  if (commerce.quantityPresets.length >= COMMERCE_LIMITS.quantityPresets) return showToast(`En fazla ${COMMERCE_LIMITS.quantityPresets} adet seçeneği eklenebilir.`);
                  changeCommerceAndLegacy(
                    (current) => {
                      const next = [...current.quantityPresets];
                      next.splice(index + 1, 0, quantity);
                      return { ...current, quantityPresets: next };
                    },
                    (_, next) => ({ suggested: next.quantityPresets }),
                  );
                },
                onMove: (direction) => changeCommerceAndLegacy(
                  (current) => ({ ...current, quantityPresets: moveCommerceItem(current.quantityPresets, index, direction) }),
                  (_, next) => ({ suggested: next.quantityPresets }),
                ),
                onDelete: () => changeCommerceAndLegacy(
                  (current) => ({ ...current, quantityPresets: current.quantityPresets.filter((_, itemIndex) => itemIndex !== index) }),
                  (_, next) => ({ suggested: next.quantityPresets }),
                ),
              })}
            </article>)}
          </div>
        </div> : null}

        {commerce.mode === "amount" || commerce.mode === "configured" ? <div className={styles.paymentCollection}>
          <div className={styles.paymentCollectionHeader}>
            <div><strong>Özel tutar</strong><small>Ziyaretçinin kendi bağış tutarını yazmasına izin verin.</small></div>
            <label className={styles.paymentSwitch}><input type="checkbox" checked={commerce.customAmountEnabled} onChange={(event) => changeCommerceAndLegacy(
              (current) => ({ ...current, customAmountEnabled: event.target.checked }),
              (_, next) => ({ customAmountEnabled: next.customAmountEnabled }),
            )} /><span /></label>
          </div>
          {commerce.customAmountEnabled ? <div className={styles.paymentFieldGrid}>
            <label>Alan içi örnek<input maxLength={40} value={commerce.customAmountPlaceholder} onChange={(event) => changeCommerce((current) => ({ ...current, customAmountPlaceholder: event.target.value }))} /></label>
            <label>En az<div className={styles.paymentMoneyInput}><span>₺</span><input type="number" min="0" step=".01" value={fromMinor(commerce.customAmountMinMinor)} onChange={(event) => changeCommerce((current) => ({ ...current, customAmountMinMinor: toMinor(event.target.value) }))} /></div></label>
            <label>En fazla<div className={styles.paymentMoneyInput}><span>₺</span><input type="number" min="0" step=".01" value={fromMinor(commerce.customAmountMaxMinor)} onChange={(event) => changeCommerce((current) => ({ ...current, customAmountMaxMinor: toMinor(event.target.value) }))} /></div></label>
          </div> : null}
        </div> : null}

        <div className={styles.paymentCollection}>
          <div className={styles.paymentCollectionHeader}><div><strong>Fiyat seçeneklerinin görünümü</strong><small>Bu ayarlar yalnız {device === "desktop" ? "web" : "mobil"} kartlarda kullanılır.</small></div></div>
          <div className={styles.paymentDesignGrid}>
            {designRange("Yükseklik", "priceButtonHeight", 28, 64)}
            {designRange("Köşe", "priceButtonRadius", 0, 32)}
            <label className={styles.paymentColorField}>Normal zemin<span><input type="color" value={design.priceBackground} onChange={(event) => updateProjectDesign(device, { priceBackground: event.target.value })} /><code>{design.priceBackground}</code></span></label>
            <label className={styles.paymentColorField}>Normal yazı<span><input type="color" value={design.priceTextColor} onChange={(event) => updateProjectDesign(device, { priceTextColor: event.target.value })} /><code>{design.priceTextColor}</code></span></label>
            <label className={styles.paymentColorField}>Seçili zemin<span><input type="color" value={design.selectedPriceBackground} onChange={(event) => updateProjectDesign(device, { selectedPriceBackground: event.target.value })} /><code>{design.selectedPriceBackground}</code></span></label>
            <label className={styles.paymentColorField}>Seçili yazı<span><input type="color" value={design.selectedPriceTextColor} onChange={(event) => updateProjectDesign(device, { selectedPriceTextColor: event.target.value })} /><code>{design.selectedPriceTextColor}</code></span></label>
          </div>
        </div>
      </div> : null}

      {paymentWorkspace === "options" ? <div className={styles.paymentPanel}>
        <div className={styles.paymentSectionHeading}>
          <div><strong>Seçenek grupları</strong><small>Ülke, proje türü veya paket gibi seçimleri küçük gruplar halinde kurun.</small></div>
          <button type="button" disabled={commerce.optionGroups.length >= COMMERCE_LIMITS.optionGroups} onClick={addOptionGroup}>＋ Grup</button>
        </div>
        <section className={`${styles.optionSharedDesign} ${sharedOptionDesignOpen ? styles.optionSharedDesignOpen : ""}`}>
          <button type="button" aria-expanded={sharedOptionDesignOpen} onClick={() => setSharedOptionDesignOpen((current) => !current)}>
            <span><strong>Seçenek görünümü</strong><small>{device === "desktop" ? "Web" : "Mobil"} için ortak başlık, yerleşim ve görünüm</small></span><b>{sharedOptionDesignOpen ? "−" : "+"}</b>
          </button>
          {sharedOptionDesignOpen ? <OptionDesignEditor design={sharedOptionDesign} device={device} deviceLabel={device === "desktop" ? "Web" : "Mobil"} onChange={updateSharedOptionDesign} /> : null}
        </section>
        <div className={styles.paymentBuilderList}>
          {commerce.optionGroups.length ? commerce.optionGroups.map((group, groupIndex) => {
            const open = expandedOptionGroupId === group.id;
            const conditionGroup = commerce.optionGroups.find((item) => item.id === group.visibleWhen?.groupId);
            const optionSelectionKey = `${currentProject.id}:${group.id}`;
            const selectedOptionId = group.options.some((option) => option.id === selectedOptionIds[optionSelectionKey])
              ? selectedOptionIds[optionSelectionKey]
              : "";
            const selectedOption = group.options.find((option) => option.id === selectedOptionId);
            const groupUsesSharedDesign = group.useSharedDesign !== false;
            const groupOptionDesign = group[groupDesignKey] || sharedOptionDesign;
            const effectiveOptionDesign = groupUsesSharedDesign ? sharedOptionDesign : groupOptionDesign;
            const groupTitleVisible = group[groupTitleVisibleKey] ?? effectiveOptionDesign.titleVisible;
            const groupDescriptionVisible = group[groupDescriptionVisibleKey] ?? effectiveOptionDesign.descriptionVisible;
            const sharedOptionTextDesign = optionTextDesignFromGroup(effectiveOptionDesign);
            const optionEditorKey = `${optionSelectionKey}:${selectedOptionId}`;
            const optionEditorTab = optionEditorTabs[optionEditorKey] || "content";
            const optionEditorDomId = `option-editor-${optionEditorKey}`.replace(/[^a-zA-Z0-9_-]/g, "-");
            const optionEditorPanelId = `${optionEditorDomId}-panel`;
            const optionUsesSharedText = selectedOption?.[optionSharedTextKey] !== false;
            const selectedOptionTextDesign = selectedOption?.[optionTextDesignKey] || sharedOptionTextDesign;
            const selectedOptionChildFlowEnabled = selectedOption?.childFlowEnabled !== false;
            const laterOptionGroups = commerce.optionGroups.slice(groupIndex + 1);
            const relatedPriceRules = selectedOption
              ? commerce.priceRules.filter((rule) => rule.optionIds.includes(selectedOption.id))
              : [];
            return <article className={`${styles.paymentBuilderItem} ${open ? styles.paymentBuilderItemOpen : ""}`} key={group.id}>
              <header>
                <button type="button" aria-expanded={open} onClick={() => setExpandedOptionGroupId(open ? "" : group.id)}>
                  <span className={styles.paymentDragIndex}>{String(groupIndex + 1).padStart(2, "0")}</span>
                  <span><strong>{group.label || "İsimsiz grup"}</strong><small>{group.options.length} seçenek · {group.required ? "zorunlu" : "isteğe bağlı"} · {group.display === "buttons" ? "düğme" : group.display === "cards" ? "kart" : "liste"}</small></span>
                  <i>{group.enabled ? "Aktif" : "Kapalı"}</i><b>{open ? "−" : "+"}</b>
                </button>
                {commerceRowActions({
                  label: group.label || "Seçenek grubu",
                  index: groupIndex,
                  total: commerce.optionGroups.length,
                  onDuplicate: () => {
                    if (commerce.optionGroups.length >= COMMERCE_LIMITS.optionGroups) return showToast(`En fazla ${COMMERCE_LIMITS.optionGroups} seçenek grubu eklenebilir.`);
                    const copy = cloneOptionGroup(group);
                    changeCommerce((current) => {
                      const index = current.optionGroups.findIndex((item) => item.id === group.id);
                      const next = [...current.optionGroups];
                      next.splice(index + 1, 0, copy);
                      return { ...current, optionGroups: next };
                    });
                    setExpandedOptionGroupId(copy.id);
                  },
                  onMove: (direction) => changeCommerce((current) => {
                    const moved = moveCommerceItem(
                      current.optionGroups,
                      current.optionGroups.findIndex((item) => item.id === group.id),
                      direction,
                    );
                    return {
                      ...current,
                      optionGroups: moved.map((item, index) => {
                        if (!item.visibleWhen) return item;
                        const dependencyIndex = moved.findIndex((candidate) => candidate.id === item.visibleWhen?.groupId);
                        return dependencyIndex >= 0 && dependencyIndex < index
                          ? item
                          : { ...item, visibleWhen: undefined };
                      }),
                    };
                  }),
                  onDelete: () => {
                    if (!window.confirm(`“${group.label || "Bu grup"}” ve bağlı fiyat koşulları silinsin mi?`)) return;
                    const removedOptionIds = new Set(group.options.map((option) => option.id));
                    changeCommerce((current) => ({
                      ...current,
                      optionGroups: current.optionGroups
                        .filter((item) => item.id !== group.id)
                        .map((item) => item.visibleWhen?.groupId === group.id ? { ...item, visibleWhen: undefined } : item),
                      priceRules: current.priceRules.filter((rule) => !rule.optionIds.some((id) => removedOptionIds.has(id))),
                    }));
                    setExpandedOptionGroupId("");
                    setSelectedOptionIds((current) => {
                      const next = { ...current };
                      delete next[optionSelectionKey];
                      return next;
                    });
                    setOptionEditorTabs((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${optionSelectionKey}:`))));
                  },
                })}
              </header>
              {open ? <div className={styles.paymentBuilderBody}>
                <div className={styles.paymentFieldGrid}>
                  <label>Grup adı<input maxLength={60} value={group.label} onChange={(event) => updateOptionGroup(group.id, { label: event.target.value })} /></label>
                  <label>Gösterim<select value={group.display} onChange={(event) => updateOptionGroup(group.id, { display: event.target.value as DonationOptionGroup["display"] })}><option value="buttons">Düğmeler</option><option value="select">Açılır liste</option><option value="cards">Mini kartlar</option></select></label>
                  <label>Varsayılan seçim<select value={group.defaultOptionId || ""} onChange={(event) => updateOptionGroup(group.id, { defaultOptionId: event.target.value || undefined })}><option value="">Seçili gelmesin</option>{group.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
                  <label className={styles.paymentFieldWide}>Kısa açıklama<input maxLength={120} value={group.description} onChange={(event) => updateOptionGroup(group.id, { description: event.target.value })} /></label>
                </div>
                <div className={styles.paymentMiniToggles}>
                  <label><input type="checkbox" checked={group.enabled} onChange={(event) => updateOptionGroup(group.id, { enabled: event.target.checked })} /><span>Grup aktif</span></label>
                  <label><input type="checkbox" checked={group.required} onChange={(event) => updateOptionGroup(group.id, { required: event.target.checked })} /><span>Seçim zorunlu</span></label>
                </div>
                <div className={styles.paymentConditionBox}>
                  <div><strong>Görünürlük koşulu</strong><small>Bu grubu başka bir seçim yapıldığında gösterin.</small></div>
                  <label>Bağlı grup<select value={group.visibleWhen?.groupId || ""} onChange={(event) => {
                    const parentGroup = commerce.optionGroups.slice(0, groupIndex).find((item) => item.id === event.target.value);
                    const firstOptionId = parentGroup?.options.find((option) => option.enabled)?.id || parentGroup?.options[0]?.id;
                    updateOptionGroup(group.id, {
                      visibleWhen: parentGroup && firstOptionId ? { groupId: parentGroup.id, optionIds: [firstOptionId] } : undefined,
                    });
                  }}><option value="">Her zaman göster</option>{commerce.optionGroups.slice(0, groupIndex).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                  {conditionGroup ? <div className={styles.paymentConditionOptions}>
                    {conditionGroup.options.map((option) => {
                      const checked = group.visibleWhen?.optionIds.includes(option.id) || false;
                      return <label key={option.id}><input type="checkbox" checked={checked} onChange={(event) => {
                        const optionIds = event.target.checked
                          ? [...new Set([...(group.visibleWhen?.optionIds || []), option.id])]
                          : (group.visibleWhen?.optionIds || []).filter((id) => id !== option.id);
                        updateOptionGroup(group.id, {
                          visibleWhen: optionIds.length ? { groupId: conditionGroup.id, optionIds } : undefined,
                        });
                      }} /><span>{option.label}</span></label>;
                    })}
                  </div> : null}
                </div>
                <div className={styles.optionGroupDesign}>
                  <div>
                    <span><strong>Grup görünümü</strong><small>{device === "desktop" ? "Web" : "Mobil"} tasarımı</small></span>
                    <label className={styles.optionDesignToggle}><input type="checkbox" checked={groupUsesSharedDesign} onChange={(event) => {
                      const useSharedDesign = event.target.checked;
                      changeCommerce((current) => ({
                        ...current,
                        optionGroups: current.optionGroups.map((item) => item.id === group.id
                          ? {
                            ...item,
                            useSharedDesign,
                            ...(!useSharedDesign && !item[groupDesignKey] ? { [groupDesignKey]: { ...current[optionDesignKey] } } : {}),
                          }
                          : item),
                      }));
                    }} /><span>Ortak tasarımı kullan</span></label>
                  </div>
                  <div className={styles.optionGroupVisibility} role="group" aria-label={`${device === "desktop" ? "Web" : "Mobil"} grup metni görünürlüğü`}>
                    <label><input type="checkbox" checked={groupTitleVisible} onChange={(event) => updateOptionGroup(group.id, { [groupTitleVisibleKey]: event.target.checked })} /><span>Grup adını göster</span></label>
                    <label><input type="checkbox" checked={groupDescriptionVisible} onChange={(event) => updateOptionGroup(group.id, { [groupDescriptionVisibleKey]: event.target.checked })} /><span>Kısa açıklamayı göster</span></label>
                  </div>
                  {!groupUsesSharedDesign ? <OptionDesignEditor design={groupOptionDesign} device={device} deviceLabel={`${device === "desktop" ? "Web" : "Mobil"} · ${group.label}`} onChange={(changes) => updateGroupOptionDesign(group.id, changes)} showVisibilityControls={false} /> : null}
                </div>
                <div className={styles.paymentCollectionHeader}>
                  <div><strong>Grup seçenekleri</strong><small>Her seçeneğin kendi ek fiyatı olabilir.</small></div>
                  <button type="button" disabled={group.options.length >= COMMERCE_LIMITS.optionsPerGroup} onClick={() => {
                    if (group.options.length >= COMMERCE_LIMITS.optionsPerGroup) return;
                    const id = commerceId("secenek");
                    changeCommerce((current) => ({
                      ...current,
                      optionGroups: current.optionGroups.map((item) => item.id === group.id
                        ? {
                          ...item,
                          options: [...item.options, { id, label: `${item.options.length + 1}. seçenek`, description: "", enabled: true, priceMinor: 0 }],
                          defaultOptionId: item.defaultOptionId || id,
                        }
                        : item),
                    }));
                    setSelectedOptionIds((current) => ({ ...current, [optionSelectionKey]: id }));
                  }}>＋ Seçenek</button>
                </div>
                <div className={styles.optionCompactList} role="list" aria-label={`${group.label} seçenekleri`}>
                  {group.options.map((option, optionIndex) => {
                    const selected = option.id === selectedOptionId;
                    const optionRowButtonId = `option-row-${optionSelectionKey}:${option.id}`.replace(/[^a-zA-Z0-9_-]/g, "-");
                    return <div className={styles.optionCompactItem} role="listitem" key={option.id}>
                      <div className={`${styles.optionCompactRow} ${selected ? styles.optionCompactRowActive : ""}`}>
                      <button
                        className={styles.optionCompactMain}
                        type="button"
                        id={optionRowButtonId}
                        aria-pressed={selected}
                        aria-expanded={selected}
                        aria-controls={selected ? optionEditorDomId : undefined}
                        onClick={() => setSelectedOptionIds((current) => ({
                          ...current,
                          [optionSelectionKey]: current[optionSelectionKey] === option.id ? "" : option.id,
                        }))}
                      >
                        <span className={styles.optionCompactIndex}>{String(optionIndex + 1).padStart(2, "0")}</span>
                        <span className={styles.optionCompactMeta}><strong>{option.label || "İsimsiz seçenek"}</strong><small>{option.description || "Açıklama yok"}</small></span>
                        <span className={styles.optionCompactPrice}>{option.priceMinor ? formatMinor(option.priceMinor) : "Temel fiyat"}</span>
                        <span className={styles.optionCompactStatus} data-active={option.enabled}>{option.enabled ? "Aktif" : "Kapalı"}</span>
                      </button>
                      {commerceRowActions({
                        label: option.label || "Seçenek",
                        index: optionIndex,
                        total: group.options.length,
                        onDuplicate: () => {
                          if (group.options.length >= COMMERCE_LIMITS.optionsPerGroup) return showToast(`Bir grupta en fazla ${COMMERCE_LIMITS.optionsPerGroup} seçenek olabilir.`);
                          const copy = { ...option, id: commerceId("secenek"), label: `${option.label} kopyası` };
                          updateGroupOptions(group.id, (currentOptions) => {
                            const currentIndex = currentOptions.findIndex((item) => item.id === option.id);
                            const next = [...currentOptions];
                            next.splice(currentIndex + 1, 0, copy);
                            return next;
                          });
                          setSelectedOptionIds((current) => ({ ...current, [optionSelectionKey]: copy.id }));
                        },
                        onMove: (direction) => updateGroupOptions(group.id, (currentOptions) => moveCommerceItem(currentOptions, currentOptions.findIndex((item) => item.id === option.id), direction)),
                        onDelete: () => {
                          const fallbackOptionId = group.options[optionIndex + 1]?.id || group.options[optionIndex - 1]?.id || "";
                          changeCommerce((current) => ({
                            ...current,
                            optionGroups: current.optionGroups.map((item) => {
                              const remaining = item.id === group.id ? item.options.filter((entry) => entry.id !== option.id) : item.options;
                              const triggerOptionIds = item.visibleWhen?.groupId === group.id
                                ? item.visibleWhen.optionIds.filter((id) => id !== option.id)
                                : undefined;
                              return {
                                ...item,
                                defaultOptionId: item.id === group.id && item.defaultOptionId === option.id ? remaining[0]?.id : item.defaultOptionId,
                                visibleWhen: item.visibleWhen?.groupId === group.id
                                  ? triggerOptionIds?.length ? { ...item.visibleWhen, optionIds: triggerOptionIds } : undefined
                                  : item.visibleWhen,
                                options: remaining,
                              };
                            }),
                            priceRules: current.priceRules.filter((rule) => !rule.optionIds.includes(option.id)),
                          }));
                          setSelectedOptionIds((current) => current[optionSelectionKey] === option.id ? { ...current, [optionSelectionKey]: fallbackOptionId } : current);
                          setOptionEditorTabs((current) => {
                            const next = { ...current };
                            delete next[`${optionSelectionKey}:${option.id}`];
                            return next;
                          });
                        },
                      })}
                      </div>
                {selected && selectedOption ? <div
                  className={styles.optionCompactEditor}
                  id={optionEditorDomId}
                  role="region"
                  aria-labelledby={optionRowButtonId}
                >
                  <div className={styles.optionEditorHeader}><strong>Seçeneği düzenle</strong><small>{group.label} · {group.options.findIndex((option) => option.id === selectedOption.id) + 1}. sıra</small></div>
                  <div className={styles.optionEditorTabs} role="tablist" aria-label="Seçenek düzenleme bölümleri">
                    {OPTION_EDITOR_TABS.map(([tabId, label], tabIndex) => <button
                      type="button"
                      role="tab"
                      id={`${optionEditorDomId}-tab-${tabId}`}
                      aria-controls={optionEditorPanelId}
                      aria-selected={optionEditorTab === tabId}
                      tabIndex={optionEditorTab === tabId ? 0 : -1}
                      className={optionEditorTab === tabId ? styles.optionEditorTabActive : ""}
                      key={tabId}
                      onClick={() => setOptionEditorTabs((current) => ({ ...current, [optionEditorKey]: tabId }))}
                      onKeyDown={(event) => {
                        let nextIndex = tabIndex;
                        if (event.key === "ArrowRight") nextIndex = (tabIndex + 1) % OPTION_EDITOR_TABS.length;
                        else if (event.key === "ArrowLeft") nextIndex = (tabIndex - 1 + OPTION_EDITOR_TABS.length) % OPTION_EDITOR_TABS.length;
                        else if (event.key === "Home") nextIndex = 0;
                        else if (event.key === "End") nextIndex = OPTION_EDITOR_TABS.length - 1;
                        else return;
                        event.preventDefault();
                        const nextTab = OPTION_EDITOR_TABS[nextIndex][0];
                        setOptionEditorTabs((current) => ({ ...current, [optionEditorKey]: nextTab }));
                        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
                      }}
                    >{label}</button>)}
                  </div>
                  <div
                    className={styles.optionEditorBody}
                    role="tabpanel"
                    id={optionEditorPanelId}
                    aria-labelledby={`${optionEditorDomId}-tab-${optionEditorTab}`}
                  >
                    {optionEditorTab === "content" ? <div className={styles.optionEditorContent}>
                      <div className={styles.paymentFieldGrid}>
                        <label>Seçenek adı<input maxLength={60} value={selectedOption.label} onChange={(event) => updateOption(group.id, selectedOption.id, { label: event.target.value })} /></label>
                        <label>Ek / özel fiyat<div className={styles.paymentMoneyInput}><span>₺</span><input type="number" min="0" step=".01" value={fromMinor(selectedOption.priceMinor)} onChange={(event) => updateOption(group.id, selectedOption.id, { priceMinor: toMinor(event.target.value) })} /></div></label>
                        <label className={styles.paymentFieldWide}>Kısa açıklama<input maxLength={100} value={selectedOption.description} onChange={(event) => updateOption(group.id, selectedOption.id, { description: event.target.value })} /></label>
                      </div>
                    </div> : null}
                    {optionEditorTab === "text" ? <div className={styles.optionEditorText}>
                      <label className={styles.optionDesignToggle}><input type="checkbox" checked={optionUsesSharedText} onChange={(event) => updateOptionUseSharedText(group.id, selectedOption.id, event.target.checked, sharedOptionTextDesign)} /><span>Ortak yazı tasarımını kullan</span></label>
                      {optionUsesSharedText ? <div className={styles.optionTextSharedInfo}>
                        <span>Buradaki değişiklikler bu gruptaki tüm seçeneklere uygulanır.</span>
                      </div> : null}
                      <OptionTextDesignEditor
                        design={optionUsesSharedText ? sharedOptionTextDesign : selectedOptionTextDesign}
                        onChange={(changes) => {
                          if (optionUsesSharedText) {
                            const groupChanges = optionTextDesignChangesToGroup(changes);
                            if (groupUsesSharedDesign) updateSharedOptionDesign(groupChanges);
                            else updateGroupOptionDesign(group.id, groupChanges);
                            return;
                          }
                          updateOptionTextDesign(group.id, selectedOption.id, sharedOptionTextDesign, changes);
                        }}
                      />
                    </div> : null}
                    {optionEditorTab === "appearance" ? <div className={styles.optionEditorAppearance}>
                      <label className={styles.optionDesignToggle}><input type="checkbox" checked={selectedOption.enabled} onChange={(event) => updateOption(group.id, selectedOption.id, { enabled: event.target.checked })} /><span>Bu seçeneği göster</span></label>
                      <p>Görünüm kapatılırsa seçenek yönetimde korunur fakat ziyaretçilere gösterilmez.</p>
                    </div> : null}
                    {optionEditorTab === "flow" ? <div className={styles.optionEditorFlow}>
                      <label className={styles.optionFlowMasterToggle} data-active={selectedOptionChildFlowEnabled}>
                        <input
                          type="checkbox"
                          checked={selectedOptionChildFlowEnabled}
                          onChange={(event) => updateOption(group.id, selectedOption.id, { childFlowEnabled: event.target.checked })}
                        />
                        <span>
                          <strong>Bu seçeneğe tıklanınca bağlı alt grupları aç</strong>
                          <small>{selectedOptionChildFlowEnabled
                            ? "Aktif: bağlı alt gruplar bu seçimden sonra açılır."
                            : "Pasif: bağlantılar korunur, ancak alt gruplar açılmaz."}</small>
                        </span>
                      </label>
                      <section className={styles.optionFlowSection}>
                        <div className={styles.optionFlowHeader}>
                          <span><strong>Alt gruplar</strong><small>Bu seçenek seçilince açılacak sonraki gruplar.</small></span>
                          <button type="button" disabled={commerce.optionGroups.length >= COMMERCE_LIMITS.optionGroups} onClick={() => {
                            if (commerce.optionGroups.length >= COMMERCE_LIMITS.optionGroups) {
                              showToast(`En fazla ${COMMERCE_LIMITS.optionGroups} seçenek grubu eklenebilir.`);
                              return;
                            }
                            const childGroupId = commerceId("grup");
                            const childOptionId = commerceId("secenek");
                            changeCommerce((current) => {
                              const parentIndex = current.optionGroups.findIndex((item) => item.id === group.id);
                              if (parentIndex < 0) return current;
                              const next = [...current.optionGroups];
                              next.splice(parentIndex + 1, 0, {
                                id: childGroupId,
                                label: "Yeni alt grup",
                                description: "",
                                enabled: true,
                                required: true,
                                display: "buttons",
                                defaultOptionId: childOptionId,
                                visibleWhen: { groupId: group.id, optionIds: [selectedOption.id] },
                                useSharedDesign: true,
                                options: [{ id: childOptionId, label: "1. seçenek", description: "", enabled: true, priceMinor: 0 }],
                              });
                              return { ...current, optionGroups: next };
                            });
                            setExpandedOptionGroupId(childGroupId);
                            setSelectedOptionIds((current) => ({ ...current, [`${currentProject.id}:${childGroupId}`]: childOptionId }));
                          }}>＋ Yeni alt grup</button>
                        </div>
                        {laterOptionGroups.length ? <div className={styles.optionFlowGroupList}>
                          {laterOptionGroups.map((childGroup) => {
                            const linkedToThisParent = childGroup.visibleWhen?.groupId === group.id;
                            const linkedToSelectedOption = linkedToThisParent && childGroup.visibleWhen?.optionIds.includes(selectedOption.id);
                            const linkedToAnotherParent = Boolean(childGroup.visibleWhen && !linkedToThisParent);
                            const otherParent = linkedToAnotherParent
                              ? commerce.optionGroups.find((item) => item.id === childGroup.visibleWhen?.groupId)
                              : undefined;
                            return <label className={styles.optionFlowGroupRow} data-linked={linkedToSelectedOption} data-locked={linkedToAnotherParent} key={childGroup.id}>
                              <input type="checkbox" checked={linkedToSelectedOption} disabled={linkedToAnotherParent} onChange={(event) => {
                                const shouldLink = event.target.checked;
                                changeCommerce((current) => ({
                                  ...current,
                                  optionGroups: current.optionGroups.map((item) => {
                                    if (item.id !== childGroup.id) return item;
                                    const currentOptionIds = item.visibleWhen?.groupId === group.id ? item.visibleWhen.optionIds : [];
                                    const optionIds = shouldLink
                                      ? [...new Set([...currentOptionIds, selectedOption.id])]
                                      : currentOptionIds.filter((id) => id !== selectedOption.id);
                                    return { ...item, visibleWhen: optionIds.length ? { groupId: group.id, optionIds } : undefined };
                                  }),
                                }));
                              }} />
                              <span><strong>{childGroup.label || "İsimsiz grup"}</strong><small>{linkedToAnotherParent ? `${otherParent?.label || "Başka grup"} grubuna bağlı` : linkedToThisParent && !linkedToSelectedOption ? "Aynı üst grubun başka seçeneğine bağlı" : linkedToSelectedOption ? selectedOptionChildFlowEnabled ? "Bu seçenekle açılır" : "Bağlı, akış şu anda pasif" : "Bağlı değil"}</small></span>
                              <b>{linkedToAnotherParent ? "Kilitli" : linkedToSelectedOption ? selectedOptionChildFlowEnabled ? "Bağlı" : "Pasif" : "Bağla"}</b>
                            </label>;
                          })}
                        </div> : <p className={styles.optionFlowEmpty}>Bağlanabilecek sonraki grup yok. Yeni bir alt grup oluşturabilirsiniz.</p>}
                      </section>

                      <section className={styles.optionFlowSection}>
                        <div className={styles.optionFlowHeader}>
                          <span><strong>Fiyat kuralları</strong><small>İlk eşleşen aktif kural uygulanır.</small></span>
                          <button type="button" disabled={commerce.priceRules.length >= COMMERCE_LIMITS.priceRules} onClick={() => {
                            if (commerce.priceRules.length >= COMMERCE_LIMITS.priceRules) {
                              showToast(`En fazla ${COMMERCE_LIMITS.priceRules} fiyat kuralı eklenebilir.`);
                              return;
                            }
                            const ruleId = commerceId("kural");
                            changeCommerce((current) => ({
                              ...current,
                              priceRules: [...current.priceRules, {
                                id: ruleId,
                                label: `${selectedOption.label || "Seçenek"} fiyatı`,
                                enabled: true,
                                optionIds: [selectedOption.id],
                                amountMinor: selectedOption.priceMinor || current.baseAmountMinor,
                              }],
                            }));
                          }}>＋ Kural</button>
                        </div>
                        {relatedPriceRules.length ? <div className={styles.optionFlowRuleList}>
                          {relatedPriceRules.map((rule) => {
                            const ruleOrder = commerce.priceRules.findIndex((item) => item.id === rule.id) + 1;
                            return <div className={styles.optionFlowRuleRow} key={rule.id}>
                              <b aria-label={`${ruleOrder}. öncelik`}>{ruleOrder}</b>
                              <input aria-label="Kural adı" maxLength={70} value={rule.label} onChange={(event) => updatePriceRule(rule.id, { label: event.target.value })} />
                              <label className={styles.optionFlowRuleAmount}><span>₺</span><input aria-label={`${rule.label} tutarı`} type="number" min="0" step=".01" value={fromMinor(rule.amountMinor)} onChange={(event) => updatePriceRule(rule.id, { amountMinor: toMinor(event.target.value) })} /></label>
                              <label className={styles.optionFlowRuleToggle} title="Kural aktif"><input aria-label={`${rule.label} aktif`} type="checkbox" checked={rule.enabled} onChange={(event) => updatePriceRule(rule.id, { enabled: event.target.checked })} /></label>
                              <button type="button" onClick={() => { setExpandedPriceRuleId(rule.id); setPaymentWorkspace("rules"); }}>Detay</button>
                            </div>;
                          })}
                        </div> : <p className={styles.optionFlowEmpty}>Bu seçeneğe bağlı fiyat kuralı yok.</p>}
                      </section>
                    </div> : null}
                  </div>
                </div> : null}
                    </div>;
                  })}
                </div>
              </div> : null}
            </article>;
          }) : <div className={styles.paymentEmpty}><b>Henüz seçenek grubu yok</b><span>Ülke, bağış türü veya paket gibi ilk grubu ekleyin.</span><button type="button" onClick={addOptionGroup}>＋ İlk grubu ekle</button></div>}
        </div>
        <footer className={styles.paymentPanelFooter}><span>{commerce.optionGroups.length}/{COMMERCE_LIMITS.optionGroups} grup</span><span>Grup başına en fazla {COMMERCE_LIMITS.optionsPerGroup} seçenek</span></footer>
      </div> : null}

      {paymentWorkspace === "rules" ? <div className={styles.paymentPanel}>
        <div className={styles.paymentSectionHeading}>
          <div><strong>Fiyat kuralları</strong><small>Seçenek birleşimlerine kesin bir bağış tutarı atayın. Üstteki ilk eşleşme uygulanır.</small></div>
          <button type="button" disabled={commerce.priceRules.length >= COMMERCE_LIMITS.priceRules || !commerce.optionGroups.length} onClick={addPriceRule}>＋ Kural</button>
        </div>
        {!commerce.optionGroups.length ? <div className={styles.paymentNotice}><i>i</i><div><strong>Önce seçenek oluşturun</strong><small>Fiyat kuralı, seçenek gruplarındaki tercihlere bağlanır.</small></div><button type="button" onClick={() => setPaymentWorkspace("options")}>Seçeneklere git</button></div> : null}
        <div className={styles.paymentBuilderList}>
          {commerce.priceRules.length ? commerce.priceRules.map((rule, ruleIndex) => {
            const open = expandedPriceRuleId === rule.id;
            const selectedLabels = commerce.optionGroups.flatMap((group) => group.options.filter((option) => rule.optionIds.includes(option.id)).map((option) => option.label));
            return <article className={`${styles.paymentBuilderItem} ${open ? styles.paymentBuilderItemOpen : ""}`} key={rule.id}>
              <header>
                <button type="button" aria-expanded={open} onClick={() => setExpandedPriceRuleId(open ? "" : rule.id)}>
                  <span className={styles.paymentDragIndex}>{String(ruleIndex + 1).padStart(2, "0")}</span>
                  <span><strong>{rule.label || "İsimsiz kural"}</strong><small>{selectedLabels.length ? selectedLabels.join(" + ") : "Tüm seçimler"} → {formatMinor(rule.amountMinor)}</small></span>
                  <i>{rule.enabled ? "Aktif" : "Kapalı"}</i><b>{open ? "−" : "+"}</b>
                </button>
                {commerceRowActions({
                  label: rule.label || "Fiyat kuralı",
                  index: ruleIndex,
                  total: commerce.priceRules.length,
                  onDuplicate: () => {
                    if (commerce.priceRules.length >= COMMERCE_LIMITS.priceRules) return showToast(`En fazla ${COMMERCE_LIMITS.priceRules} fiyat kuralı eklenebilir.`);
                    const copy = { ...rule, id: commerceId("kural"), label: `${rule.label} kopyası`, optionIds: [...rule.optionIds] };
                    changeCommerce((current) => {
                      const index = current.priceRules.findIndex((item) => item.id === rule.id);
                      const next = [...current.priceRules];
                      next.splice(index + 1, 0, copy);
                      return { ...current, priceRules: next };
                    });
                    setExpandedPriceRuleId(copy.id);
                  },
                  onMove: (direction) => changeCommerce((current) => ({
                    ...current,
                    priceRules: moveCommerceItem(current.priceRules, current.priceRules.findIndex((item) => item.id === rule.id), direction),
                  })),
                  onDelete: () => {
                    if (!window.confirm(`“${rule.label || "Bu kural"}” silinsin mi?`)) return;
                    changeCommerce((current) => ({ ...current, priceRules: current.priceRules.filter((item) => item.id !== rule.id) }));
                    setExpandedPriceRuleId("");
                  },
                })}
              </header>
              {open ? <div className={styles.paymentBuilderBody}>
                <div className={styles.paymentFieldGrid}>
                  <label>Kural adı<input maxLength={70} value={rule.label} onChange={(event) => updatePriceRule(rule.id, { label: event.target.value })} /></label>
                  <label>Sonuç tutarı<div className={styles.paymentMoneyInput}><span>₺</span><input type="number" min="0" step=".01" value={fromMinor(rule.amountMinor)} onChange={(event) => updatePriceRule(rule.id, { amountMinor: toMinor(event.target.value) })} /></div></label>
                  <label className={styles.paymentCompactCheck}><input type="checkbox" checked={rule.enabled} onChange={(event) => updatePriceRule(rule.id, { enabled: event.target.checked })} /> Kural aktif</label>
                </div>
                <div className={styles.paymentRuleBuilder}>
                  <div><strong>Kombinasyon</strong><small>Boş bırakılan grup bu kuralı sınırlandırmaz.</small></div>
                  <div>
                    {commerce.optionGroups.filter((group) => group.enabled).map((group) => {
                      const groupOptionIds = new Set(group.options.map((option) => option.id));
                      const selectedOptionId = rule.optionIds.find((id) => groupOptionIds.has(id)) || "";
                      return <label key={group.id}>{group.label}<select value={selectedOptionId} onChange={(event) => {
                        const withoutGroup = rule.optionIds.filter((id) => !groupOptionIds.has(id));
                        updatePriceRule(rule.id, { optionIds: event.target.value ? [...withoutGroup, event.target.value] : withoutGroup });
                      }}><option value="">Herhangi biri</option>{group.options.filter((option) => option.enabled).map((option) => <option key={option.id} value={option.id}>{option.label}{option.priceMinor ? ` · ${formatMinor(option.priceMinor)}` : ""}</option>)}</select></label>;
                    })}
                  </div>
                  <p><b>Öncelik {ruleIndex + 1}:</b> Birden fazla kural eşleşirse listede daha yukarıdaki uygulanır.</p>
                </div>
              </div> : null}
            </article>;
          }) : <div className={styles.paymentEmpty}><b>Henüz fiyat kuralı yok</b><span>Seçeneklere göre değişmeyen projelerde bu alanı boş bırakabilirsiniz.</span>{commerce.optionGroups.length ? <button type="button" onClick={addPriceRule}>＋ İlk kuralı ekle</button> : null}</div>}
        </div>
        <footer className={styles.paymentPanelFooter}><span>{commerce.priceRules.length}/{COMMERCE_LIMITS.priceRules} kural</span><span>Fiyatlar güvenli biçimde kuruş olarak saklanır.</span></footer>
      </div> : null}

      {paymentWorkspace === "actions" ? <div className={styles.paymentPanel}>
        <div className={styles.paymentSectionHeading}>
          <div><strong>Çoklu düğmeler</strong><small>Sepet, ödeme, bağlantı ve WhatsApp eylemlerini birlikte yönetin.</small></div>
          <button type="button" disabled={commerce.actions.length >= COMMERCE_LIMITS.actions} onClick={addAction}>＋ Düğme</button>
        </div>
        <div className={styles.paymentActionLayout}>
          <div>
            <span>{device === "desktop" ? "Web" : "Mobil"} düğme yerleşimi</span>
            <small>Yalnız aktif cihaz görünümünü değiştirir.</small>
          </div>
          <label>Dizilim<select value={commerce[actionLayoutKey]} onChange={(event) => changeCommerce((current) => ({ ...current, [actionLayoutKey]: event.target.value as "row" | "stack" }))}><option value="row">Yan yana</option><option value="stack">Alt alta</option></select></label>
          <label>Aralık <b>{commerce[actionGapKey]} px</b><input type="range" min="0" max="32" value={commerce[actionGapKey]} onChange={(event) => changeCommerce((current) => ({ ...current, [actionGapKey]: Number(event.target.value) }))} /></label>
        </div>
        <div className={styles.paymentBuilderList}>
          {orderedActions.length ? orderedActions.map((action, actionIndex) => {
            const open = expandedActionId === action.id;
            const actionDevice = action[actionDeviceKey];
            const actionKindLabel = {
              "add-to-cart": "Sepete ekle",
              checkout: "Direkt ödeme",
              "internal-link": "Site içi bağlantı",
              "external-link": "Dış bağlantı",
              whatsapp: "WhatsApp",
            }[action.kind];
            const actionIcon = { none: "", plus: "＋", cart: "🛒", heart: "♥", arrow: "→" }[action.icon];
            const previewBackground = action.variant === "gradient"
              ? `linear-gradient(135deg, ${action.background}, ${action.backgroundEnd})`
              : action.variant === "outline"
                ? "transparent"
                : action.variant === "soft"
                  ? `${action.background}22`
                  : action.background;
            return <article className={`${styles.paymentBuilderItem} ${open ? styles.paymentBuilderItemOpen : ""}`} key={action.id}>
              <header>
                <button type="button" aria-expanded={open} onClick={() => setExpandedActionId(open ? "" : action.id)}>
                  <span className={styles.paymentDragIndex}>{String(actionIndex + 1).padStart(2, "0")}</span>
                  <span><strong>{actionDevice.label || actionKindLabel}</strong><small>{actionKindLabel} · {action.variant === "solid" ? "dolu" : action.variant === "outline" ? "çizgili" : action.variant === "soft" ? "yumuşak" : "geçişli"} · {device === "desktop" ? "web" : "mobil"}</small></span>
                  <i>{action.enabled && actionDevice.visible ? "Görünür" : "Kapalı"}</i><b>{open ? "−" : "+"}</b>
                </button>
                {commerceRowActions({
                  label: actionDevice.label || "Düğme",
                  index: actionIndex,
                  total: orderedActions.length,
                  onDuplicate: () => {
                    if (commerce.actions.length >= COMMERCE_LIMITS.actions) return showToast(`En fazla ${COMMERCE_LIMITS.actions} düğme eklenebilir.`);
                    const copy: DonationProjectAction = {
                      ...action,
                      id: commerceId("dugme"),
                      desktop: { ...action.desktop, label: `${action.desktop.label} kopyası`, order: commerce.actions.length },
                      mobile: { ...action.mobile, label: `${action.mobile.label} kopyası`, order: commerce.actions.length },
                    };
                    changeCommerce((current) => ({ ...current, actions: [...current.actions, copy] }));
                    setExpandedActionId(copy.id);
                  },
                  onMove: (direction) => moveAction(action.id, direction),
                  onDelete: () => {
                    if (!window.confirm(`“${actionDevice.label || "Bu düğme"}” silinsin mi?`)) return;
                    changeCommerce((current) => {
                      const remaining = current.actions.filter((item) => item.id !== action.id);
                      const desktopOrders = new Map(
                        [...remaining]
                          .sort((first, second) => first.desktop.order - second.desktop.order)
                          .map((item, order) => [item.id, order]),
                      );
                      const mobileOrders = new Map(
                        [...remaining]
                          .sort((first, second) => first.mobile.order - second.mobile.order)
                          .map((item, order) => [item.id, order]),
                      );
                      return {
                        ...current,
                        actions: remaining.map((item) => ({
                          ...item,
                          desktop: { ...item.desktop, order: desktopOrders.get(item.id) || 0 },
                          mobile: { ...item.mobile, order: mobileOrders.get(item.id) || 0 },
                        })),
                      };
                    });
                    setExpandedActionId("");
                  },
                })}
              </header>
              {open ? <div className={styles.paymentBuilderBody}>
                <div className={styles.paymentFieldGrid}>
                  <label>Eylem türü<select value={action.kind} onChange={(event) => updateAction(action.id, { kind: event.target.value as DonationProjectAction["kind"] })}><option value="add-to-cart">Sepete ekle</option><option value="checkout">Direkt ödeme</option><option value="internal-link">Site içi bağlantı</option><option value="external-link">Dış bağlantı</option><option value="whatsapp">WhatsApp</option></select></label>
                  <label>İkon<select value={action.icon} onChange={(event) => updateAction(action.id, { icon: event.target.value as DonationProjectAction["icon"] })}><option value="none">İkonsuz</option><option value="plus">Artı</option><option value="cart">Sepet</option><option value="heart">Kalp</option><option value="arrow">Ok</option></select></label>
                  <label>Stil<select value={action.variant} onChange={(event) => updateAction(action.id, { variant: event.target.value as DonationProjectAction["variant"] })}><option value="solid">Dolu</option><option value="outline">Çizgili</option><option value="soft">Yumuşak</option><option value="gradient">İki renk geçişli</option></select></label>
                  {action.kind === "internal-link" || action.kind === "external-link" || action.kind === "whatsapp" ? <label className={styles.paymentFieldWide}>{action.kind === "whatsapp" ? "WhatsApp bağlantısı / numarası" : "Bağlantı"}<input maxLength={300} value={action.href} onChange={(event) => updateAction(action.id, { href: event.target.value })} placeholder={action.kind === "internal-link" ? "/bagislar" : action.kind === "whatsapp" ? "https://wa.me/90..." : "https://..."} /></label> : null}
                </div>
                <div className={styles.paymentMiniToggles}>
                  <label><input type="checkbox" checked={action.enabled} onChange={(event) => updateAction(action.id, { enabled: event.target.checked })} /><span>Düğme aktif</span></label>
                  <label><input type="checkbox" checked={action.requiresValidSelection} onChange={(event) => updateAction(action.id, { requiresValidSelection: event.target.checked })} /><span>Geçerli seçim iste</span></label>
                </div>

                <div className={styles.paymentDeviceCard}>
                  <div><span>{device === "desktop" ? "WEB" : "MOBİL"}</span><div><strong>{device === "desktop" ? "Web görünümü" : "Mobil görünüm"}</strong><small>Etiket, boyut ve sıra bu cihaza özeldir.</small></div><label className={styles.paymentSwitch}><input type="checkbox" checked={actionDevice.visible} onChange={(event) => updateActionDevice(action.id, { visible: event.target.checked })} /><span /></label></div>
                  <div className={styles.paymentFieldGrid}>
                    <label>Düğme yazısı<input maxLength={40} value={actionDevice.label} onChange={(event) => updateActionDevice(action.id, { label: event.target.value })} /></label>
                    <label>Genişlik<select value={actionDevice.width} onChange={(event) => updateActionDevice(action.id, { width: event.target.value as DonationProjectAction[Device]["width"] })}><option value="auto">İçerik kadar</option><option value="half">Yarım alan</option><option value="full">Tam alan</option></select></label>
                    <label>Hizalama<select value={actionDevice.align} onChange={(event) => updateActionDevice(action.id, { align: event.target.value as DonationProjectAction[Device]["align"] })}><option value="start">Sol / başlangıç</option><option value="center">Orta</option><option value="end">Sağ / bitiş</option></select></label>
                    <label>Sıra<select value={actionIndex} onChange={(event) => setActionOrder(action.id, Number(event.target.value))}>{orderedActions.map((_, index) => <option key={index} value={index}>{index + 1}. sıra</option>)}</select></label>
                  </div>
                  <div className={styles.paymentDesignGrid}>
                    <label>Yükseklik <b>{actionDevice.height} px</b><input type="range" min="34" max="72" value={actionDevice.height} onChange={(event) => updateActionDevice(action.id, { height: Number(event.target.value) })} /></label>
                    <label>Köşe <b>{actionDevice.radius} px</b><input type="range" min="0" max="36" value={actionDevice.radius} onChange={(event) => updateActionDevice(action.id, { radius: Number(event.target.value) })} /></label>
                  </div>
                </div>

                <div className={styles.paymentColorGrid}>
                  <label className={styles.paymentColorField}>Ana renk<span><input type="color" value={action.background} onChange={(event) => updateAction(action.id, { background: event.target.value })} /><code>{action.background}</code></span></label>
                  {action.variant === "gradient" ? <label className={styles.paymentColorField}>Bitiş rengi<span><input type="color" value={action.backgroundEnd} onChange={(event) => updateAction(action.id, { backgroundEnd: event.target.value })} /><code>{action.backgroundEnd}</code></span></label> : null}
                  <label className={styles.paymentColorField}>Yazı rengi<span><input type="color" value={action.textColor} onChange={(event) => updateAction(action.id, { textColor: event.target.value })} /><code>{action.textColor}</code></span></label>
                  <label className={styles.paymentColorField}>Çerçeve<span><input type="color" value={action.borderColor} onChange={(event) => updateAction(action.id, { borderColor: event.target.value })} /><code>{action.borderColor}</code></span></label>
                </div>
                <div className={styles.paymentActionPreview}>
                  <span>Canlı düğme örneği</span>
                  <div style={{ justifyContent: actionDevice.align === "start" ? "flex-start" : actionDevice.align === "end" ? "flex-end" : "center" }}>
                    <i style={{
                      width: actionDevice.width === "full" ? "100%" : actionDevice.width === "half" ? "50%" : "auto",
                      minHeight: actionDevice.height,
                      borderRadius: actionDevice.radius,
                      background: previewBackground,
                      color: action.textColor,
                      borderColor: action.borderColor,
                    }}>{actionIcon ? <b>{actionIcon}</b> : null}{actionDevice.label || actionKindLabel}</i>
                  </div>
                </div>
              </div> : null}
            </article>;
          }) : <div className={styles.paymentEmpty}><b>Henüz düğme yok</b><span>Sepete ekle veya direkt ödeme düğmesi oluşturun.</span><button type="button" onClick={addAction}>＋ İlk düğmeyi ekle</button></div>}
        </div>
        <footer className={styles.paymentPanelFooter}><span>{commerce.actions.length}/{COMMERCE_LIMITS.actions} düğme</span><span>Sıra ve görünürlük {device === "desktop" ? "web" : "mobil"} için özeldir.</span></footer>
      </div> : null}
    </div>;
    return <div className={styles.lowerAccordion}>
      <section className={projectSelectorOpen ? styles.lowerAccordionOpen : ""}>
        <button type="button" onClick={() => setProjectSelectorOpen((current) => !current)}><span>Bağış kategorisi ve kart seçimi</span><b>{projectSelectorOpen ? "−" : "+"}</b></button>
        {projectSelectorOpen ? <div className={`${styles.lowerAccordionContent} ${styles.visualProjectSelector}`}>
          <div className={styles.miniCategoryPreview}>
            {donation.categories.map(({ id, label, imageAlt }) => {
              const projects = id === donation.allCategoryId ? donation.projects : donation.projects.filter((project) => project.category === id);
              const cover = donation.categoryImages[id]?.[lowerDevice] || donation.categoryImages[id]?.desktop;
              const active = projectCategory === id;
              return <button type="button" key={id} className={active ? styles.activeMiniCategory : ""} onClick={() => {
                const nextCategory = id as ProjectCategory;
                setProjectCategory(nextCategory);
                const ordered = id === donation.allCategoryId
                  ? projects.slice().sort((a, b) => (a[allOrderKey] ?? donation.projects.indexOf(a)) - (b[allOrderKey] ?? donation.projects.indexOf(b)))
                  : projects;
                setSelectedProjectId(ordered[0]?.id || "");
              }}>
                <span>{cover ? <Image src={cover} alt={imageAlt} fill sizes="72px" /> : <Image src="/__missing-category-image.webp" alt="" fill sizes="72px" unoptimized />}</span>
                <strong>{label}</strong>
                <small>{projects.length} kart</small>
              </button>;
            })}
          </div>
          <div className={styles.miniProjectPreview}>
            {categoryProjects.length ? categoryProjects.map((project, index) => <button type="button" draggable key={project.id} className={selectedProject?.id === project.id ? styles.activeMiniProject : ""} onDragStart={() => setDraggedProjectId(project.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropProject(project.id)} onDragEnd={() => setDraggedProjectId("")} onClick={() => setSelectedProjectId(project.id)}>
              <strong>{index + 1}. Kart</strong>
              <small>{donation.categories.find((category) => category.id === project.category)?.label}{!project.enabled ? " · Kapalı" : aggregateCategorySelected && !(lowerDevice === "desktop" ? project.showInAllDesktop !== false : project.showInAllMobile !== false) ? " · Gizli" : ""}</small>
            </button>) : <small>Bu kategoride henüz bağış kartı yok.</small>}
          </div>
          <label>Kategori<select value={projectCategory} onChange={(event) => {
            const nextCategory = event.target.value as ProjectCategory;
            setProjectCategory(nextCategory);
            const projects = nextCategory === donation.allCategoryId
              ? donation.projects.slice().sort((a, b) => (a[allOrderKey] ?? donation.projects.indexOf(a)) - (b[allOrderKey] ?? donation.projects.indexOf(b)))
              : donation.projects.filter((project) => project.category === nextCategory);
            setSelectedProjectId(projects[0]?.id || "");
          }}>{donation.categories.map(({ id, label }) => <option value={id} key={id}>{label} · {id === donation.allCategoryId ? donation.projects.length : donation.projects.filter((project) => project.category === id).length} kart</option>)}</select></label>
          <label>Bağış kartı<select value={selectedProject?.id || ""} onChange={(event) => setSelectedProjectId(event.target.value)}>
            {categoryProjects.length ? categoryProjects.map((project, index) => <option value={project.id} key={project.id}>{index + 1}. {project.title}{project.enabled ? "" : " (Kapalı)"}</option>) : <option value="">Bu kategoride kart yok</option>}
          </select></label>
          <div className={styles.projectQuickActions}>
            <button type="button" title={aggregateCategorySelected ? "Yeni kart için gerçek kategori seçin" : "Yeni kart"} aria-label="Yeni kart" disabled={aggregateCategorySelected} onClick={addProject}>＋</button>
            <button type="button" title="Kartı çoğalt" aria-label="Kartı çoğalt" disabled={!selectedProject} onClick={duplicateProject}>⧉</button>
            <button type="button" title="Sola taşı" aria-label="Sola taşı" disabled={!selectedProject} onClick={() => moveProject(-1)}>←</button>
            <button type="button" title="Sağa taşı" aria-label="Sağa taşı" disabled={!selectedProject} onClick={() => moveProject(1)}>→</button>
            <button type="button" title="Kartı sil" aria-label="Kartı sil" disabled={!selectedProject} onClick={deleteProject}>×</button>
          </div>
          <small>{categoryProjects.length} kart · Seçilen kartın ayarları aşağıdaki bölümlerde düzenlenir.</small>
          {selectedProject ? <nav className={styles.projectSettingsTabs} aria-label="Seçili kart ayarları">
            {[
              ["project-measurements", "Kart ayarları"],
              ["project-design", "Görsel ayarları"],
              ["project-content", "Yazı ayarları"],
              ["project-payment", "Fiyat ve düğme"],
            ].map(([id, label]) => <button type="button" key={id} className={lowerGroup === id ? styles.activeProjectSettingsTab : ""} onClick={() => setLowerGroup(id)}>{label}</button>)}
          </nav> : null}
        </div> : null}
      </section>
      {selectedProject ? <>
      <section style={{ order: 2 }} className={`${styles.projectSettingsPanel} ${lowerGroup === "project-measurements" ? styles.lowerAccordionOpen : ""}`}>
        <button type="button" onClick={() => setLowerGroup(lowerGroup === "project-measurements" ? "" : "project-measurements")}><span>Kart ayarları</span><b>{lowerGroup === "project-measurements" ? "−" : "+"}</b></button>
        {projectSelectorOpen && lowerGroup === "project-measurements" ? <div className={styles.lowerAccordionContent}>
          <label className={`${styles.headerCheck} ${styles.compactCardCheck}`}><input type="checkbox" checked={sharedImage.showHeading} onChange={(event) => updateSharedImage({ showHeading: event.target.checked })} /> Bölüm başlığını göster</label>
          <label className={`${styles.headerCheck} ${styles.compactCardCheck}`}><input type="checkbox" checked={sharedImage.titleVisible} onChange={(event) => updateSharedImage({ titleVisible: event.target.checked })} /> Kart başlığını göster</label>
          <label className={`${styles.headerCheck} ${styles.compactCardCheck}`}><input type="checkbox" checked={sharedImage.descriptionVisible} onChange={(event) => updateSharedImage({ descriptionVisible: event.target.checked })} /> Açıklamayı göster</label>
          <label className={`${styles.headerCheck} ${styles.compactCardCheck}`}><input type="checkbox" checked={selectedProject.enabled} onChange={(event) => updateProject({ enabled: event.target.checked })} /> Bu kartı göster</label>
          <label className={`${styles.headerCheck} ${styles.compactCardCheck}`}><input type="checkbox" checked={device === "desktop" ? selectedProject.showInAllDesktop !== false : selectedProject.showInAllMobile !== false} onChange={(event) => updateProject(device === "desktop" ? { showInAllDesktop: event.target.checked } : { showInAllMobile: event.target.checked })} /> {donation.categories.find((category) => category.id === donation.allCategoryId)?.label || "Tüm bağışlar"} kategorisinde {device === "desktop" ? "webde" : "mobilde"} göster</label>
          <label className={`${styles.headerCheck} ${styles.compactCardCheck}`}><input type="checkbox" checked={design.useSharedDesign} onChange={(event) => updateProjectDesign(device, { useSharedDesign: event.target.checked })} /> Ortak kart tasarımını kullan</label>
          {design.useSharedDesign ? <>
            {sharedRange("Kart genişliği", "cardWidth", device === "desktop" ? 220 : 180, device === "desktop" ? 700 : 420)}
            {sharedRange("Kart iç boşluğu", "cardPadding", 0, 60)}
            {sharedRange("Kart köşeleri", "cardRadius", 0, 60)}
            {sharedRange("Çerçeve kalınlığı", "cardBorderWidth", 0, 8)}
            <label>Kart arka planı<input type="color" value={sharedImage.cardBackground} onChange={(event) => updateSharedImage({ cardBackground: event.target.value })} /></label>
            <label>Çerçeve rengi<input type="color" value={sharedImage.cardBorderColor} onChange={(event) => updateSharedImage({ cardBorderColor: event.target.value })} /></label>
            <label>Gölge<select value={sharedImage.cardShadow} onChange={(event) => updateSharedImage({ cardShadow: event.target.value as DonationLowerDeviceSettings["cardShadow"] })}><option value="none">Yok</option><option value="soft">Hafif</option><option value="medium">Orta</option><option value="strong">Güçlü</option></select></label>
          </> : <>
            {designRange("Kart genişliği", "cardWidth", device === "desktop" ? 220 : 180, device === "desktop" ? 700 : 420)}
            {designRange("Kart iç boşluğu", "cardPadding", 0, 60)}
            {designRange("Kart köşeleri", "cardRadius", 0, 60)}
            {designRange("Çerçeve kalınlığı", "cardBorderWidth", 0, 8)}
            <label>Kart arka planı<input type="color" value={design.cardBackground} onChange={(event) => updateProjectDesign(device, { cardBackground: event.target.value })} /></label>
            <label>Çerçeve rengi<input type="color" value={design.cardBorderColor} onChange={(event) => updateProjectDesign(device, { cardBorderColor: event.target.value })} /></label>
          </>}
        </div> : null}
      </section>
      <section style={{ order: 4 }} className={`${styles.projectSettingsPanel} ${lowerGroup === "project-content" ? styles.lowerAccordionOpen : ""}`}>
        <button type="button" onClick={() => setLowerGroup(lowerGroup === "project-content" ? "" : "project-content")}><span>Yazı ayarları</span><b>{lowerGroup === "project-content" ? "−" : "+"}</b></button>
        {projectSelectorOpen && lowerGroup === "project-content" ? <div className={styles.lowerAccordionContent}>
          <div className={styles.moduleTextSettingsGroup}>
            <strong>Bölüm başlığı metinleri</strong>
            <label>Üst etiket<input type="text" value={sharedImage.headingEyebrow} onChange={(event) => updateSharedImage({ headingEyebrow: event.target.value })} /></label>
            <label>Ana başlık<input type="text" value={sharedImage.headingTitle} onChange={(event) => updateSharedImage({ headingTitle: event.target.value })} /></label>
          </div>
          <div className={styles.moduleTextSettingsGroup}>
            <strong>Seçili kartın yazıları</strong>
          <label>Kart başlığı<input value={selectedProject.title} onChange={(event) => updateProject({ title: event.target.value })} /></label>
          <label>Açıklama<textarea rows={4} value={selectedProject.description} onChange={(event) => updateProject({ description: event.target.value })} /></label>
          {design.useSharedDesign ? <>
            {sharedRange("Başlık boyutu", "titleSize", 12, 48)}
            {sharedRange("Başlık kalınlığı", "titleWeight", 300, 900, "")}
            {sharedRange("Açıklama boyutu", "descriptionSize", 9, 24)}
            <label>Başlık rengi<input type="color" value={sharedImage.titleColor} onChange={(event) => updateSharedImage({ titleColor: event.target.value })} /></label>
            <label>Açıklama rengi<input type="color" value={sharedImage.descriptionColor} onChange={(event) => updateSharedImage({ descriptionColor: event.target.value })} /></label>
          </> : <>
            {designRange("Başlık boyutu", "titleSize", 12, 48)}
            {designRange("Başlık kalınlığı", "titleWeight", 300, 900, "")}
            {designRange("Açıklama boyutu", "descriptionSize", 9, 24)}
            <label>Başlık rengi<input type="color" value={design.titleColor} onChange={(event) => updateProjectDesign(device, { titleColor: event.target.value })} /></label>
            <label>Açıklama rengi<input type="color" value={design.descriptionColor} onChange={(event) => updateProjectDesign(device, { descriptionColor: event.target.value })} /></label>
          </>}
          </div>
        </div> : null}
      </section>
      <section style={{ order: 3 }} className={`${styles.projectSettingsPanel} ${lowerGroup === "project-design" ? styles.lowerAccordionOpen : ""}`}>
        <button type="button" onClick={() => setLowerGroup(lowerGroup === "project-design" ? "" : "project-design")}><span>Görsel ayarları</span><b>{lowerGroup === "project-design" ? "−" : "+"}</b></button>
        {projectSelectorOpen && lowerGroup === "project-design" ? <div className={styles.lowerAccordionContent}>
          <div className={styles.projectMediaStatus}>
            <label><input type="checkbox" checked={design.imageVisible !== false} onChange={(event) => updateProjectDesign(device, { imageVisible: event.target.checked })} /> Kart medyasını göster</label>
            <label><input type="checkbox" checked={useSharedMediaDesign} onChange={(event) => updateProjectDesign(device, { useSharedImageDesign: event.target.checked })} /> Ortak ölçüleri kullan</label>
            <span>{device === "desktop" ? "WEB" : "MOBİL"} · {mediaItems.length} medya</span>
          </div>
          <div className={styles.projectMediaSubtabs}>
            <button type="button" className={mediaSettingsGroup === "gallery" ? styles.activeProjectMediaSubtab : ""} onClick={() => setMediaSettingsGroup("gallery")}>Medya galerisi</button>
            <button type="button" className={mediaSettingsGroup === "appearance" ? styles.activeProjectMediaSubtab : ""} onClick={() => setMediaSettingsGroup("appearance")}>Galeri görünümü</button>
            <button type="button" className={mediaSettingsGroup === "video" ? styles.activeProjectMediaSubtab : ""} onClick={() => setMediaSettingsGroup("video")}>Video penceresi</button>
          </div>

          {mediaSettingsGroup === "gallery" ? <div className={styles.projectMediaManager}>
            <div className={styles.projectMediaHeader}>
              <div><strong>{device === "desktop" ? "Web" : "Mobil"} kart galerisi</strong><small>Görseller WebP’ye dönüştürülür; videolar yalnızca oynatıldığında yüklenir.</small></div>
              <nav>
                <label className={styles.secondaryMediaButton}>{uploading ? "Hazırlanıyor…" : "+ Görsel"}<input hidden type="file" accept=".webp,.jpg,.jpeg,.png,.avif,image/webp,image/jpeg,image/png,image/avif" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadProjectMedia(file, device); event.target.value = ""; }} /></label>
                <label className={styles.primaryButton}>{uploading ? "Yükleniyor…" : "+ Video"}<input hidden type="file" accept=".mp4,video/mp4" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadProjectMedia(file, device); event.target.value = ""; }} /></label>
              </nav>
            </div>
            {mediaItems.length ? <>
              <div className={styles.projectMediaStrip}>
                {mediaItems.map((media, index) => <button type="button" key={media.id} className={selectedMedia?.id === media.id ? styles.activeProjectMediaItem : ""} onClick={() => setSelectedMediaIds((current) => ({ ...current, [device]: media.id }))}>
                  <ProjectMediaPreview media={media} sizes="90px" />
                  <strong>{index === 0 ? "Ana medya" : `${index + 1}. medya`}</strong>
                  <small>{media.type === "video" ? "Video" : "Görsel"}</small>
                </button>)}
              </div>
              {selectedMedia ? <div className={styles.projectMediaInspector}>
                <ProjectMediaPreview media={selectedMedia} sizes="240px" />
                <div className={styles.projectMediaDetails}>
                  <span>{selectedMedia.type === "video" ? "VİDEO" : "GÖRSEL"}{selectedMediaIndex === 0 ? " · ANA MEDYA" : ""}</span>
                  <strong>{selectedMedia.originalName || `${selectedMediaIndex + 1}. medya`}</strong>
                  <small>{selectedMedia.width && selectedMedia.height ? `${selectedMedia.width} × ${selectedMedia.height} px · ` : ""}{selectedMedia.size ? formatSize(selectedMedia.size) : "R2 medya dosyası"}</small>
                  <label>Başlık ve alternatif açıklama<input value={selectedMedia.alt || ""} maxLength={160} onChange={(event) => updateProjectMediaItem(device, selectedMedia.id, { alt: event.target.value })} placeholder="Görseli kısa ve anlaşılır biçimde açıklayın" /></label>
                  {selectedMedia.type === "video" ? <div className={styles.projectPosterActions}>
                    <label>{uploadingPosterId === selectedMedia.id ? "Kapak hazırlanıyor…" : selectedMedia.poster ? "Kapağı değiştir" : "Kapak görseli yükle"}<input hidden type="file" accept=".webp,.jpg,.jpeg,.png,.avif,image/webp,image/jpeg,image/png,image/avif" disabled={Boolean(uploadingPosterId)} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadProjectPoster(file, device, selectedMedia); event.target.value = ""; }} /></label>
                    {selectedMedia.poster ? <button type="button" onClick={() => removeProjectPoster(device, selectedMedia)}>Kapağı kaldır</button> : null}
                  </div> : null}
                  <nav className={styles.projectMediaActions}>
                    <button type="button" disabled={selectedMediaIndex === 0} onClick={() => makePrimaryProjectMedia(device, selectedMedia.id)}>Ana medya yap</button>
                    <button type="button" disabled={selectedMediaIndex <= 0} onClick={() => moveProjectMedia(device, selectedMediaIndex, -1)}>←</button>
                    <button type="button" disabled={selectedMediaIndex < 0 || selectedMediaIndex === mediaItems.length - 1} onClick={() => moveProjectMedia(device, selectedMediaIndex, 1)}>→</button>
                    <button type="button" onClick={() => void removeProjectMedia(device, selectedMedia)}>Sil</button>
                  </nav>
                </div>
              </div> : null}
            </> : <div className={styles.emptyModuleGallery}>Bu karta ait {device === "desktop" ? "web" : "mobil"} galerisi henüz boş. Sitede kırık görsel gösterilecek.</div>}
            <p className={styles.moduleHint}>Video için MP4 (720p önerilir, en fazla 150 MB) kullanın. Fotoğraflar ve video kapakları yükleme sırasında otomatik WebP’ye dönüştürülür.</p>
          </div>
          : null}

          {mediaSettingsGroup === "appearance" ? <div className={styles.projectMediaDesignGrid}>
            <label>Görsel davranışı<select value={mediaDesign.imageFit || "cover"} onChange={(event) => useSharedMediaDesign ? updateSharedImage({ imageFit: event.target.value as "cover" | "contain" }) : updateProjectDesign(device, { imageFit: event.target.value as "cover" | "contain" })}><option value="cover">Alanı doldur</option><option value="contain">Tamamını göster</option></select></label>
            <label className={styles.headerCheck}><input type="checkbox" checked={mediaDesign.mediaThumbnailsVisible !== false} onChange={(event) => useSharedMediaDesign ? updateSharedImage({ mediaThumbnailsVisible: event.target.checked }) : updateProjectDesign(device, { mediaThumbnailsVisible: event.target.checked })} /> Küçük önizlemeleri göster</label>
            {useSharedMediaDesign ? <>
              {sharedRange("Ana medya yüksekliği", "imageHeight", 80, 500)}
              {sharedRange("Ana medya köşeleri", "imageRadius", 0, 60)}
              {sharedRange("Küçük görsel boyutu", "mediaThumbnailSize", 28, 96)}
              {sharedRange("Küçük görsel aralığı", "mediaThumbnailGap", 0, 24)}
              {sharedRange("Küçük görsel köşeleri", "mediaThumbnailRadius", 0, 30)}
              {sharedRange("Alt kenar mesafesi", "mediaThumbnailBottom", 0, 32)}
            </> : <>
              {designRange("Ana medya yüksekliği", "imageHeight", 80, 500)}
              {designRange("Ana medya köşeleri", "imageRadius", 0, 60)}
              {designRange("Küçük görsel boyutu", "mediaThumbnailSize", 28, 96)}
              {designRange("Küçük görsel aralığı", "mediaThumbnailGap", 0, 24)}
              {designRange("Küçük görsel köşeleri", "mediaThumbnailRadius", 0, 30)}
              {designRange("Alt kenar mesafesi", "mediaThumbnailBottom", 0, 32)}
            </>}
          </div> : null}

          {mediaSettingsGroup === "video" ? <div className={styles.projectMediaDesignGrid}>
            <div className={styles.videoModalNote}><i>▶</i><div><strong>Sayfa içi video penceresi</strong><small>Video yalnızca ziyaretçi oynatma düğmesine bastığında yüklenir. Kapatıldığında kullanıcı aynı konumda kalır.</small></div></div>
            {useSharedMediaDesign ? <>
              {sharedRange("Pencere genişliği", "videoModalWidth", 320, 1200)}
              {sharedRange("Pencere köşeleri", "videoModalRadius", 0, 40)}
              {sharedRange("Arka plan karartması", "videoModalBackdropOpacity", 30, 95, "%")}
            </> : <>
              {designRange("Pencere genişliği", "videoModalWidth", 320, 1200)}
              {designRange("Pencere köşeleri", "videoModalRadius", 0, 40)}
              {designRange("Arka plan karartması", "videoModalBackdropOpacity", 30, 95, "%")}
            </>}
          </div> : null}
        </div> : null}
      </section>
      <section style={{ order: 5 }} className={`${styles.projectSettingsPanel} ${lowerGroup === "project-payment" ? styles.lowerAccordionOpen : ""}`}>
        <button type="button" onClick={() => setLowerGroup(lowerGroup === "project-payment" ? "" : "project-payment")}><span>Fiyat ve düğme ayarları</span><b>{lowerGroup === "project-payment" ? "−" : "+"}</b></button>
        {projectSelectorOpen && lowerGroup === "project-payment" ? paymentControls : null}
      </section>
      </> : <div className={styles.emptyModuleGallery}>Bu kategoride henüz bağış kartı yok. Yukarıdaki “＋” düğmesiyle ilk kartı oluşturun.</div>}
    </div>;
  };

  const lowerControls = (device: Device) => {
    const value = device === "desktop" ? donation.lowerDesktop : donation.lowerMobile;
    const change = (changes: Partial<DonationLowerDeviceSettings>) => updateLower(device, changes);
    const groups = [
      ["layout", "Yerleşim ve ölçüler"],
      ["arrows", "Kaydırma okları"],
    ] as const;
    const range = (label: string, key: keyof DonationLowerDeviceSettings, min: number, max: number, suffix = "px") => (
      <label>{label} <b>{String(value[key])} {suffix}</b><input type="range" min={min} max={max} value={Number(value[key])} onChange={(event) => change({ [key]: Number(event.target.value) })} /></label>
    );
    return <div className={styles.lowerAccordion}>
      {groups.map(([id, label]) => <section key={id} className={lowerGroup === id ? styles.lowerAccordionOpen : ""}>
        <button type="button" onClick={() => setLowerGroup((current) => current === id ? "" : id)}><span>{label}</span><b>{lowerGroup === id ? "−" : "+"}</b></button>
        {lowerGroup === id ? <div className={styles.lowerAccordionContent}>
          {id === "layout" ? <>
            <label>Gösterim biçimi<select value={value.layout} onChange={(event) => change({ layout: event.target.value as "carousel" | "grid" })}><option value="carousel">Yatay kaydırma</option><option value="grid">Izgara</option></select></label>
            {value.layout === "grid" ? range("Sütun sayısı", "columns", 1, device === "desktop" ? 6 : 2, "") : null}
            {range("Bölüm genişliği", "sectionMaxWidth", device === "desktop" ? 700 : 280, device === "desktop" ? 1800 : 640)}
            {range("Yan iç boşluk", "sectionPadding", 0, 80)}
            {range("Üst bölümle mesafe", "sectionGap", 0, 100)}
            {range("Başlık ile kartlar arası mesafe", "headingGap", 0, 100)}
            {range("Alt bölümle mesafe", "sectionBottomGap", 0, 160)}
            {range("Kartlar arası boşluk", "cardGap", 0, 60)}
            <label className={styles.headerCheck}><input type="checkbox" checked={value.arrowsVisible} onChange={(event) => change({ arrowsVisible: event.target.checked })} /> Kaydırma oklarını göster</label>
          </> : null}
          {id === "arrows" ? <>
            <label className={styles.headerCheck}><input type="checkbox" checked={value.arrowsVisible} onChange={(event) => change({ arrowsVisible: event.target.checked })} /> Kaydırma oklarını göster</label>
            <label className={styles.headerCheck}><input type="checkbox" checked={value.leftArrowVisible} onChange={(event) => change({ leftArrowVisible: event.target.checked })} /> Sol oku göster</label>
            <label className={styles.headerCheck}><input type="checkbox" checked={value.rightArrowVisible} onChange={(event) => change({ rightArrowVisible: event.target.checked })} /> Sağ oku göster</label>
            <label>Hazır sembol<select value={value.arrowIcon} onChange={(event) => change({ arrowIcon: event.target.value as DonationLowerDeviceSettings["arrowIcon"] })}><option value="thin">İnce ok ← →</option><option value="chevron">Sade ok ‹ ›</option><option value="bold">Kalın ok ❮ ❯</option><option value="long">Uzun ok ⟵ ⟶</option><option value="triangle">Üçgen ◀ ▶</option></select></label>
            {range("Ok kutusu boyutu", "arrowSize", 28, 72)}
            {range("Sembol boyutu", "arrowIconSize", 12, 40)}
            {range("Kenara bindirme", "arrowOffset", -36, 36)}
            {range("Dikey konum", "arrowVerticalPosition", 10, 90, "%")}
            {range("Köşe yuvarlaklığı", "arrowRadius", 0, 50, "%")}
            {range("Şeffaflık", "arrowOpacity", 10, 100, "%")}
            {range("Çerçeve kalınlığı", "arrowBorderWidth", 0, 6)}
            <label>Arka plan rengi<input type="color" value={value.arrowBackground} onChange={(event) => change({ arrowBackground: event.target.value })} /></label>
            <label>Sembol rengi<input type="color" value={value.arrowColor} onChange={(event) => change({ arrowColor: event.target.value })} /></label>
            <label>Çerçeve rengi<input type="color" value={value.arrowBorderColor} onChange={(event) => change({ arrowBorderColor: event.target.value })} /></label>
            <label>Gölge<select value={value.arrowShadow} onChange={(event) => change({ arrowShadow: event.target.value as DonationLowerDeviceSettings["arrowShadow"] })}><option value="none">Yok</option><option value="soft">Hafif</option><option value="medium">Orta</option><option value="strong">Güçlü</option></select></label>
          </> : null}
        </div> : null}
      </section>)}
    </div>;
  };

  const upperGallerySections = (device: Device, group: UpperSettingsGroupRenderer) => {
    const deviceImages = images.filter((image) => image.device === device);
    const deviceLabel = device === "desktop" ? "Web" : "Mobil";
    const deviceName = deviceLabel.toLocaleLowerCase("tr-TR");
    const aspectRatio = device === "desktop" ? donation.desktopAspectRatio : donation.mobileAspectRatio;
    const cardWidth = device === "desktop" ? donation.desktopCardWidth : donation.mobileCardWidth;
    const cardHeight = device === "desktop" ? donation.desktopCardHeight : donation.mobileCardHeight;
    const cardGap = device === "desktop" ? donation.desktopCardGap : donation.mobileCardGap;
    const imageFit = device === "desktop" ? donation.desktopImageFit : donation.mobileImageFit;
    const imagePosition = device === "desktop" ? donation.desktopImagePosition : donation.mobileImagePosition;
    const borderRadius = device === "desktop" ? donation.desktopBorderRadius : donation.mobileBorderRadius;
    const borderWidth = device === "desktop" ? donation.desktopBorderWidth : donation.mobileBorderWidth;
    const borderColor = device === "desktop" ? donation.desktopBorderColor : donation.mobileBorderColor;
    const shadow = device === "desktop" ? donation.desktopShadow : donation.mobileShadow;
    const backgroundColor = device === "desktop" ? donation.desktopImageBackgroundColor : donation.mobileImageBackgroundColor;
    const visibleCategories = categoryVisibility(device);
    const allCategoryIds = donation.categories.map((category) => category.id);
    const orderedIds = [...categoryOrder(device), ...allCategoryIds].filter((id, index, list) => list.indexOf(id) === index);
    const orderedCategories = orderedIds
      .map((id) => donation.categories.find((category) => category.id === id))
      .filter((category): category is DonationCategory => Boolean(category));
    const selectedId = orderedCategories.some((category) => category.id === selectedUpperCategory[device])
      ? selectedUpperCategory[device]
      : orderedCategories[0]?.id || "";
    const selectedCategory = donation.categories.find((category) => category.id === selectedId);
    const selectedUrl = donation.categoryImages[selectedId]?.[device] || "";
    const scopedImages = deviceImages
      .filter((image) => image.categoryId === selectedId || (!image.categoryId && image.url === selectedUrl))
      .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
    const currentImageIsListed = scopedImages.some((image) => image.url === selectedUrl);
    const categoryAssets: GalleryImage[] = selectedUrl && !currentImageIsListed
      ? [{
          path: `current:${device}:${selectedId}`,
          url: selectedUrl,
          size: 0,
          device,
          categoryId: selectedId,
          originalName: "Mevcut kategori görseli",
          format: selectedUrl.split(".").at(-1) || "görsel",
        }, ...scopedImages]
      : scopedImages;
    const totalSize = scopedImages.reduce((sum, image) => sum + image.size, 0);

    return group("category-visual-center", "Kategori ve Görsel Merkezi", <div className={styles.categoryVisualCenter}>
      <div className={styles.categoryManagerStrip} ref={(element) => { categoryStripRefs.current[device] = element; }}>
        {orderedCategories.map((category, index) => {
          const { id, label, imageAlt } = category;
          const active = selectedId === id;
          const visible = visibleCategories.includes(id);
          const imageUrl = donation.categoryImages[id]?.[device] || "";
          return <article
            className={active ? styles.categoryManagerCardActive : styles.categoryManagerCard}
            data-category-id={id}
            draggable
            key={id}
            role="button"
            tabIndex={0}
            onClick={() => chooseUpperCategory(device, id)}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                chooseUpperCategory(device, id);
              }
            }}
            onDragStart={() => setDraggedUpperCategory(id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggedUpperCategory) reorderCategory(device, draggedUpperCategory as DonationCategoryId, id);
              setDraggedUpperCategory("");
            }}
            onDragEnd={() => setDraggedUpperCategory("")}
          >
            <button
              className={styles.categoryAllToggle}
              data-active={donation.allCategoryId === id}
              aria-pressed={donation.allCategoryId === id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleAllCategory(id);
              }}
              title="Bu kategoriyi tüm bağış kartlarını gösteren kategori yap"
            >{donation.allCategoryId === id ? <b>✓</b> : null} Tümü</button>
            <div className={styles.categoryCardMain}>
              <span className={styles.categoryManagerThumb}>
                {imageUrl
                  ? <Image src={imageUrl} alt={imageAlt} fill sizes="72px" />
                  : <Image src="/__missing-category-image.webp" alt="" fill sizes="42px" unoptimized />}
              </span>
              <span><strong>{label}</strong><small>{visible ? "Sitede görünüyor" : "Gizli"}</small></span>
            </div>
            <div className={styles.categoryManagerActions} onClick={(event) => event.stopPropagation()}>
              <label className={styles.categoryVisibilityToggle} title={`${label} kategorisini ${deviceName} görünümünde göster`}>
                <input type="checkbox" checked={visible} onChange={() => toggleCategory(id, device)} />
                <span>{visible ? "Açık" : "Kapalı"}</span>
              </label>
              <span className={styles.categoryOrderControls}>
                <label className={styles.categoryAddButton} title={`${label} için görsel yükle`}>
                  ↑
                  <input type="file" hidden accept=".webp,.jpg,.jpeg,.png,.avif,image/webp,image/jpeg,image/png,image/avif" disabled={uploading} onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(file, device, id);
                    event.target.value = "";
                  }} />
                </label>
                <button type="button" title="Sola taşı" disabled={index === 0} onClick={() => moveCategory(device, id, -1)}>←</button>
                <button type="button" title="Sağa taşı" disabled={index === orderedCategories.length - 1} onClick={() => moveCategory(device, id, 1)}>→</button>
              </span>
            </div>
          </article>;
        })}
        <button className={styles.categoryAddButton} type="button" onClick={() => addCategory(device)}>＋ Yeni kategori</button>
      </div>

      <div className={styles.categoryCompactGallery}>
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
