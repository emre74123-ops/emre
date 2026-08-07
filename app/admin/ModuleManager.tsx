"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { defaultModuleSettings, donationCategoryOptions, normalizeModuleSettings, type DonationLowerDeviceSettings, type DonationProject, type DonationProjectDesign, type DonationProjectMedia, type ModuleSettings } from "../../lib/module-settings";
import DonationModule from "../components/DonationModule";
import styles from "./admin.module.css";

type ModuleTab = "desktop" | "mobile";
type ModuleSection = "upper" | "lower";
type Device = "desktop" | "mobile";
type ProjectCategory = DonationProject["category"] | "all";
type GalleryImage = { path: string; url: string; size: number; device: Device };

export default function ModuleManager({ showToast }: { showToast: (message: string) => void }) {
  const [settings, setSettings] = useState<ModuleSettings>(defaultModuleSettings);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [section, setSection] = useState<ModuleSection>("upper");
  const [lowerDevice, setLowerDevice] = useState<Device>("desktop");
  const [lowerGroup, setLowerGroup] = useState("project-content");
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(true);
  const [projectCategory, setProjectCategory] = useState<ProjectCategory>("all");
  const [selectedProjectId, setSelectedProjectId] = useState("general-support");
  const [draggedProjectId, setDraggedProjectId] = useState("");
  const [tab, setTab] = useState<ModuleTab>("desktop");
  const [desktopPanel, setDesktopPanel] = useState<"design" | "gallery">("design");
  const [mobilePanel, setMobilePanel] = useState<"design" | "gallery">("design");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [imageMeta, setImageMeta] = useState<Record<string, { width: number; height: number }>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadingPosterId, setUploadingPosterId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/modules", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/admin/modules/images", { cache: "no-store" }).then((response) => response.json()),
    ]).then(([settingsResult, imageResult]) => {
      if (settingsResult.settings) {
        setSettings(normalizeModuleSettings(settingsResult.settings));
      }
      setImages(imageResult.images || []);
    }).catch(() => undefined);
  }, []);

  const donation = settings.donation;
  const allOrderKey = lowerDevice === "desktop" ? "allOrderDesktop" : "allOrderMobile";
  const categoryProjects = (projectCategory === "all"
    ? donation.projects
    : donation.projects.filter((project) => project.category === projectCategory))
    .slice()
    .sort((a, b) => projectCategory === "all"
      ? (a[allOrderKey] ?? donation.projects.indexOf(a)) - (b[allOrderKey] ?? donation.projects.indexOf(b))
      : donation.projects.indexOf(a) - donation.projects.indexOf(b));
  const selectedProject = donation.projects.find((project) => project.id === selectedProjectId) || categoryProjects[0];
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
  const updateProject = (changes: Partial<DonationProject>) => {
    if (!selectedProject) return;
    updateProjects(donation.projects.map((project) => project.id === selectedProject.id ? { ...project, ...changes } : project));
  };
  const updateProjectDesign = (device: Device, changes: Partial<DonationProjectDesign>) => {
    if (!selectedProject) return;
    updateProject({ [device]: { ...selectedProject[device], ...changes } });
  };
  const addProject = () => {
    if (projectCategory === "all") {
      showToast("Yeni kart eklemek için önce gerçek bir bağış kategorisi seçin.");
      return;
    }
    const base = selectedProject || defaultModuleSettings.donation.projects[0];
    const id = `bagis-${Date.now()}`;
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
    };
    updateProjects([...donation.projects, project]);
    setSelectedProjectId(id);
  };
  const duplicateProject = () => {
    if (!selectedProject) return;
    const id = `${selectedProject.id}-kopya-${Date.now()}`;
    updateProjects([...donation.projects, { ...selectedProject, id, title: `${selectedProject.title} Kopyası`, desktopMedia: [], mobileMedia: [], desktop: { ...selectedProject.desktop }, mobile: { ...selectedProject.mobile } }]);
    setSelectedProjectId(id);
  };
  const deleteProject = () => {
    if (!selectedProject || !window.confirm("Bu bağış kartı ve karta ait web/mobil medya galerileri tamamen silinsin mi?")) return;
    const removedId = selectedProject.id;
    void fetch("/api/admin/modules/images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: removedId, deleteAll: true }),
    }).then(async (response) => {
      if (!response.ok) return showToast((await response.json()).error || "Kart galerisi silinemedi.");
      const next = donation.projects.filter((project) => project.id !== removedId);
      updateProjects(next);
      setSelectedProjectId(projectCategory === "all" ? next[0]?.id || "" : next.find((project) => project.category === projectCategory)?.id || "");
      showToast("Kart ve karta ait medya galerisi silindi.");
    });
  };
  const moveProject = (direction: -1 | 1) => {
    if (!selectedProject) return;
    if (projectCategory === "all") {
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
  async function uploadToR2(file: File, device: Device, purpose: "media" | "poster" = "media") {
    if (!selectedProject) return;
    const response = await fetch("/api/admin/modules/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: selectedProject.id,
        device,
        purpose,
        contentType: file.type,
        size: file.size,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Yükleme bağlantısı oluşturulamadı.");
    const uploadResponse = await fetch(result.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadResponse.ok) throw new Error("Dosya Cloudflare depolama alanına yüklenemedi.");
    return result as { url: string; path: string; type: "image" | "video" };
  }
  async function uploadProjectMedia(file: File, device: Device) {
    setUploading(true);
    try {
      const result = await uploadToR2(file, device);
      if (!result) return;
      updateProjectMedia(device, [...projectMedia(device), {
        id: crypto.randomUUID(),
        type: result.type,
        url: result.url,
        path: result.path,
        alt: selectedProject?.title,
      }]);
      showToast(result.type === "video" ? "Video bu karta ait galeriye eklendi." : "Görsel bu karta ait galeriye eklendi.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Medya yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }
  async function uploadProjectPoster(file: File, device: Device, media: DonationProjectMedia) {
    setUploadingPosterId(media.id);
    try {
      const result = await uploadToR2(file, device, "poster");
      if (!result) return;
      if (media.posterPath) {
        await fetch("/api/admin/modules/media", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: media.posterPath }),
        });
      }
      updateProjectMedia(device, projectMedia(device).map((item) => item.id === media.id
        ? { ...item, poster: result.url, posterPath: result.path }
        : item));
      showToast("Video kapak görseli kaydedildi.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Video kapağı yüklenemedi.");
    } finally {
      setUploadingPosterId("");
    }
  }
  async function removeProjectMedia(device: Device, media: DonationProjectMedia) {
    const r2Paths = [media.path, media.posterPath].filter((path): path is string => Boolean(path?.startsWith("r2:")));
    if (r2Paths.length) {
      const response = await fetch("/api/admin/modules/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paths: r2Paths }) });
      if (!response.ok) return showToast((await response.json()).error || "Medya silinemedi.");
    } else if (media.path) {
      const response = await fetch("/api/admin/modules/images", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: media.path }) });
      if (!response.ok) return showToast((await response.json()).error || "Medya silinemedi.");
    }
    updateProjectMedia(device, projectMedia(device).filter((item) => item.id !== media.id));
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
    if (projectCategory === "all") {
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
    setSaving(true);
    const response = await fetch("/api/admin/modules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return showToast(result.error || "Modül ayarları kaydedilemedi.");
    setSettings(normalizeModuleSettings(result.settings));
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
    const usages = donationCategoryOptions.filter(([id]) => donation.categoryImages[id][image.device] === image.url);
    const usageText = usages.length ? ` Bu görsel ${usages.map(([, label]) => label).join(", ")} kategorilerinde kullanılıyor; bu kategoriler varsayılan görsele dönecek.` : "";
    if (!window.confirm(`Bu görsel kalıcı olarak silinsin mi?${usageText}`)) return;
    if (usages.length) {
      const categoryImages = { ...donation.categoryImages };
      for (const [id] of usages) {
        categoryImages[id] = {
          ...categoryImages[id],
          [image.device]: defaultModuleSettings.donation.categoryImages[id][image.device],
        };
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

  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const imageRatio = (width: number, height: number) => {
    const divisor = (a: number, b: number): number => b ? divisor(b, a % b) : a;
    const common = divisor(width, height);
    const ratioWidth = width / common;
    const ratioHeight = height / common;
    return ratioWidth <= 20 && ratioHeight <= 20 ? `${ratioWidth}:${ratioHeight}` : (width / height).toFixed(2);
  };

  const preview = (device: "desktop" | "mobile") => (
    <div className={`${styles.modulePreview} ${device === "mobile" ? styles.modulePreviewMobile : styles.modulePreviewDesktop}`}>
      <div className={styles.modulePreviewLabel}>{device === "mobile" ? "Mobil canlı görünüm" : "Web canlı görünüm"}</div>
      <div className={styles.modulePreviewViewport}>
        <DonationModule embedded settings={donation} previewDevice={device} previewCategory={projectCategory} />
        <div className={styles.previewFollowingSection}><span>SONRAKİ BÖLÜM</span></div>
      </div>
    </div>
  );

  const projectControls = (device: Device) => {
    if (!selectedProject) return <div className={styles.emptyModuleGallery}>Bu kategoride henüz bağış kartı yok. “Yeni Kart” düğmesiyle ilk kartı oluşturun.</div>;
    const design = selectedProject[device];
    const sharedImage = device === "desktop" ? donation.lowerDesktop : donation.lowerMobile;
    const updateSharedImage = (changes: Partial<DonationLowerDeviceSettings>) => updateLower(device, changes);
    const designRange = (label: string, key: keyof DonationProjectDesign, min: number, max: number, suffix = "px") => (
      <label>{label} <b>{String(design[key])} {suffix}</b><input type="range" min={min} max={max} value={Number(design[key])} onChange={(event) => updateProjectDesign(device, { [key]: Number(event.target.value) })} /></label>
    );
    const sharedRange = (label: string, key: keyof DonationLowerDeviceSettings, min: number, max: number, suffix = "px") => (
      <label>{label} <b>{String(sharedImage[key])} {suffix}</b><input type="range" min={min} max={max} value={Number(sharedImage[key])} onChange={(event) => updateSharedImage({ [key]: Number(event.target.value) })} /></label>
    );
    return <div className={styles.lowerAccordion}>
      <section className={projectSelectorOpen ? styles.lowerAccordionOpen : ""}>
        <button type="button" onClick={() => setProjectSelectorOpen((current) => !current)}><span>Bağış kategorisi ve kart seçimi</span><b>{projectSelectorOpen ? "−" : "+"}</b></button>
        {projectSelectorOpen ? <div className={`${styles.lowerAccordionContent} ${styles.visualProjectSelector}`}>
          <div className={styles.miniCategoryPreview}>
            {donationCategoryOptions.map(([id, label]) => {
              const projects = id === "all" ? donation.projects : donation.projects.filter((project) => project.category === id);
              const cover = donation.categoryImages[id]?.[lowerDevice] || donation.categoryImages[id]?.desktop;
              const active = projectCategory === id;
              return <button type="button" key={id} className={active ? styles.activeMiniCategory : ""} onClick={() => {
                const nextCategory = id as ProjectCategory;
                setProjectCategory(nextCategory);
                const ordered = id === "all"
                  ? projects.slice().sort((a, b) => (a[allOrderKey] ?? donation.projects.indexOf(a)) - (b[allOrderKey] ?? donation.projects.indexOf(b)))
                  : projects;
                setSelectedProjectId(ordered[0]?.id || "");
              }}>
                <span>{cover ? <Image src={cover} alt="" fill sizes="72px" /> : <b>{label.slice(0, 1)}</b>}</span>
                <strong>{label}</strong>
                <small>{projects.length} kart</small>
              </button>;
            })}
          </div>
          <div className={styles.miniProjectPreview}>
            {categoryProjects.length ? categoryProjects.map((project, index) => <button type="button" draggable key={project.id} className={selectedProject?.id === project.id ? styles.activeMiniProject : ""} onDragStart={() => setDraggedProjectId(project.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropProject(project.id)} onDragEnd={() => setDraggedProjectId("")} onClick={() => setSelectedProjectId(project.id)}>
              <strong>{index + 1}. Kart</strong>
              <small>{donationCategoryOptions.find(([id]) => id === project.category)?.[1]}{!project.enabled ? " · Kapalı" : projectCategory === "all" && !(lowerDevice === "desktop" ? project.showInAllDesktop !== false : project.showInAllMobile !== false) ? " · Gizli" : ""}</small>
            </button>) : <small>Bu kategoride henüz bağış kartı yok.</small>}
          </div>
          <label>Kategori<select value={projectCategory} onChange={(event) => {
            const nextCategory = event.target.value as ProjectCategory;
            setProjectCategory(nextCategory);
            const projects = nextCategory === "all"
              ? donation.projects.slice().sort((a, b) => (a[allOrderKey] ?? donation.projects.indexOf(a)) - (b[allOrderKey] ?? donation.projects.indexOf(b)))
              : donation.projects.filter((project) => project.category === nextCategory);
            setSelectedProjectId(projects[0]?.id || "");
          }}>{donationCategoryOptions.map(([id, label]) => <option value={id} key={id}>{label} · {id === "all" ? donation.projects.length : donation.projects.filter((project) => project.category === id).length} kart</option>)}</select></label>
          <label>Bağış kartı<select value={selectedProject?.id || ""} onChange={(event) => setSelectedProjectId(event.target.value)}>
            {categoryProjects.length ? categoryProjects.map((project, index) => <option value={project.id} key={project.id}>{index + 1}. {project.title}{project.enabled ? "" : " (Kapalı)"}</option>) : <option value="">Bu kategoride kart yok</option>}
          </select></label>
          <div className={styles.projectQuickActions}>
            <button type="button" title={projectCategory === "all" ? "Yeni kart için gerçek kategori seçin" : "Yeni kart"} aria-label="Yeni kart" disabled={projectCategory === "all"} onClick={addProject}>＋</button>
            <button type="button" title="Kartı çoğalt" aria-label="Kartı çoğalt" disabled={!selectedProject} onClick={duplicateProject}>⧉</button>
            <button type="button" title="Sola taşı" aria-label="Sola taşı" disabled={!selectedProject} onClick={() => moveProject(-1)}>←</button>
            <button type="button" title="Sağa taşı" aria-label="Sağa taşı" disabled={!selectedProject} onClick={() => moveProject(1)}>→</button>
            <button type="button" title="Kartı sil" aria-label="Kartı sil" disabled={!selectedProject} onClick={deleteProject}>×</button>
          </div>
          <small>{categoryProjects.length} kart · Seçilen kartın ayarları aşağıdaki bölümlerde düzenlenir.</small>
          <nav className={styles.projectSettingsTabs} aria-label="Seçili kart ayarları">
            {[
              ["project-measurements", "Kart ayarları"],
              ["project-design", "Görsel ayarları"],
              ["project-content", "Yazı ayarları"],
              ["project-payment", "Fiyat ve düğme"],
            ].map(([id, label]) => <button type="button" key={id} className={lowerGroup === id ? styles.activeProjectSettingsTab : ""} onClick={() => setLowerGroup(id)}>{label}</button>)}
          </nav>
        </div> : null}
      </section>
      <section style={{ order: 2 }} className={`${styles.projectSettingsPanel} ${lowerGroup === "project-measurements" ? styles.lowerAccordionOpen : ""}`}>
        <button type="button" onClick={() => setLowerGroup(lowerGroup === "project-measurements" ? "" : "project-measurements")}><span>Kart ayarları</span><b>{lowerGroup === "project-measurements" ? "−" : "+"}</b></button>
        {projectSelectorOpen && lowerGroup === "project-measurements" ? <div className={styles.lowerAccordionContent}>
          <label className={`${styles.headerCheck} ${styles.compactCardCheck}`}><input type="checkbox" checked={sharedImage.showHeading} onChange={(event) => updateSharedImage({ showHeading: event.target.checked })} /> Bölüm başlığını göster</label>
          <label className={`${styles.headerCheck} ${styles.compactCardCheck}`}><input type="checkbox" checked={sharedImage.titleVisible} onChange={(event) => updateSharedImage({ titleVisible: event.target.checked })} /> Kart başlığını göster</label>
          <label className={`${styles.headerCheck} ${styles.compactCardCheck}`}><input type="checkbox" checked={sharedImage.descriptionVisible} onChange={(event) => updateSharedImage({ descriptionVisible: event.target.checked })} /> Açıklamayı göster</label>
          <label className={`${styles.headerCheck} ${styles.compactCardCheck}`}><input type="checkbox" checked={selectedProject.enabled} onChange={(event) => updateProject({ enabled: event.target.checked })} /> Bu kartı göster</label>
          <label className={`${styles.headerCheck} ${styles.compactCardCheck}`}><input type="checkbox" checked={device === "desktop" ? selectedProject.showInAllDesktop !== false : selectedProject.showInAllMobile !== false} onChange={(event) => updateProject(device === "desktop" ? { showInAllDesktop: event.target.checked } : { showInAllMobile: event.target.checked })} /> Tüm Bağışlar’da {device === "desktop" ? "webde" : "mobilde"} göster</label>
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
          <label className={styles.headerCheck}><input type="checkbox" checked={design.imageVisible !== false} onChange={(event) => updateProjectDesign(device, { imageVisible: event.target.checked })} /> Kart medyasını göster</label>
          <label className={styles.headerCheck}><input type="checkbox" checked={design.useSharedImageDesign !== false} onChange={(event) => updateProjectDesign(device, { useSharedImageDesign: event.target.checked })} /> Ortak görsel ayarlarını kullan</label>
          <label>Görsel davranışı<select value={design.useSharedImageDesign !== false ? sharedImage.imageFit : design.imageFit || "cover"} onChange={(event) => design.useSharedImageDesign !== false ? updateSharedImage({ imageFit: event.target.value as "cover" | "contain" }) : updateProjectDesign(device, { imageFit: event.target.value as "cover" | "contain" })}><option value="cover">Alanı doldur</option><option value="contain">Tamamını göster</option></select></label>
          {design.useSharedImageDesign !== false ? <>
            {sharedRange("Görsel yüksekliği", "imageHeight", 80, 500)}
            {sharedRange("Görsel köşeleri", "imageRadius", 0, 60)}
          </> : <>
            {designRange("Görsel yüksekliği", "imageHeight", 80, 500)}
            {designRange("Görsel köşeleri", "imageRadius", 0, 60)}
          </>}
          <div className={styles.projectMediaManager}>
            <div className={styles.projectMediaHeader}><strong>{device === "desktop" ? "Web" : "Mobil"} kart galerisi</strong><label className={styles.primaryButton}>{uploading ? "Yükleniyor…" : "+ Fotoğraf / video"}<input hidden type="file" accept=".webp,.jpg,.jpeg,.png,.avif,.mp4,image/webp,image/jpeg,image/png,image/avif,video/mp4" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadProjectMedia(file, device); event.target.value = ""; }} /></label></div>
            {projectMedia(device).length ? <div className={styles.projectMediaGrid}>{projectMedia(device).map((media, index) => <article key={media.id}>
              <div>{media.type === "video" ? media.poster ? <Image src={media.poster} alt="" fill sizes="100px" /> : <span>▶</span> : <Image src={media.url} alt={media.alt || ""} fill sizes="100px" />}</div>
              <small>{index === 0 ? "Ana kapak" : `${index + 1}. medya`} · {media.type === "video" ? "Video" : "Görsel"}</small>
              {media.type === "video" ? <label className={styles.projectPosterButton}>{uploadingPosterId === media.id ? "Kapak yükleniyor…" : media.poster ? "Kapağı değiştir" : "Kapak görseli yükle"}<input hidden type="file" accept=".webp,.jpg,.jpeg,.png,.avif,image/webp,image/jpeg,image/png,image/avif" disabled={Boolean(uploadingPosterId)} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadProjectPoster(file, device, media); event.target.value = ""; }} /></label> : null}
              <nav><button type="button" disabled={index === 0} onClick={() => moveProjectMedia(device, index, -1)}>←</button><button type="button" disabled={index === projectMedia(device).length - 1} onClick={() => moveProjectMedia(device, index, 1)}>→</button><button type="button" onClick={() => void removeProjectMedia(device, media)}>Sil</button></nav>
            </article>)}</div> : <div className={styles.emptyModuleGallery}>Bu karta ait {device === "desktop" ? "web" : "mobil"} galerisi henüz boş.</div>}
            <p className={styles.moduleHint}>İlk medya ana kapaktır. Video için MP4 (720p önerilir, en fazla 150 MB), görsel için WebP/JPG/PNG/AVIF (en fazla 5 MB) kullanın. Videolar kapak görseliyle açılır ve kullanıcı oynatmadan indirilmez.</p>
          </div>
        </div> : null}
      </section>
      <section style={{ order: 5 }} className={`${styles.projectSettingsPanel} ${lowerGroup === "project-payment" ? styles.lowerAccordionOpen : ""}`}>
        <button type="button" onClick={() => setLowerGroup(lowerGroup === "project-payment" ? "" : "project-payment")}><span>Fiyat ve düğme ayarları</span><b>{lowerGroup === "project-payment" ? "−" : "+"}</b></button>
        {projectSelectorOpen && lowerGroup === "project-payment" ? <div className={styles.lowerAccordionContent}>
          <label>Bağış biçimi<select value={selectedProject.pricingMode} onChange={(event) => updateProject({ pricingMode: event.target.value as DonationProject["pricingMode"] })}><option value="amount">Bağış tutarı</option><option value="quantity">Adet / hisse</option></select></label>
          {selectedProject.pricingMode === "quantity" ? <label>Birim fiyat<input type="number" min="0" value={selectedProject.fixedPrice} onChange={(event) => updateProject({ fixedPrice: Number(event.target.value) })} /></label> : null}
          <label>{selectedProject.pricingMode === "quantity" ? "Adet seçenekleri" : "Hazır tutarlar"}<input value={selectedProject.suggested.join(", ")} onChange={(event) => updateProject({ suggested: event.target.value.split(",").map((item) => Number(item.trim())).filter((item) => Number.isFinite(item) && item > 0).slice(0, 12) })} placeholder="250, 500, 1000" /></label>
          {selectedProject.pricingMode === "amount" ? <label className={styles.headerCheck}><input type="checkbox" checked={selectedProject.customAmountEnabled} onChange={(event) => updateProject({ customAmountEnabled: event.target.checked })} /> Özel tutar girişini göster</label> : null}
          {designRange("Fiyat düğmesi yüksekliği", "priceButtonHeight", 28, 64)}
          {designRange("Fiyat düğmesi köşeleri", "priceButtonRadius", 0, 32)}
          <label>Normal fiyat zemini<input type="color" value={design.priceBackground} onChange={(event) => updateProjectDesign(device, { priceBackground: event.target.value })} /></label>
          <label>Normal fiyat yazısı<input type="color" value={design.priceTextColor} onChange={(event) => updateProjectDesign(device, { priceTextColor: event.target.value })} /></label>
          <label>Seçili fiyat zemini<input type="color" value={design.selectedPriceBackground} onChange={(event) => updateProjectDesign(device, { selectedPriceBackground: event.target.value })} /></label>
          <label>Seçili fiyat yazısı<input type="color" value={design.selectedPriceTextColor} onChange={(event) => updateProjectDesign(device, { selectedPriceTextColor: event.target.value })} /></label>
          <label>Bağış düğmesi yazısı<input value={design.actionText} onChange={(event) => updateProjectDesign(device, { actionText: event.target.value })} /></label>
          {designRange("Bağış düğmesi yüksekliği", "actionHeight", 34, 72)}
          {designRange("Bağış düğmesi köşeleri", "actionRadius", 0, 36)}
          <label>Bağış düğmesi rengi<input type="color" value={design.actionBackground} onChange={(event) => updateProjectDesign(device, { actionBackground: event.target.value })} /></label>
          <label>Düğme yazı rengi<input type="color" value={design.actionTextColor} onChange={(event) => updateProjectDesign(device, { actionTextColor: event.target.value })} /></label>
        </div> : null}
      </section>
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

  const gallery = (device: Device) => {
    const deviceImages = images.filter((image) => image.device === device);
    const deviceLabel = device === "desktop" ? "Web" : "Mobil";
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
    return (
      <div className={styles.deviceGallery}>
        <div className={styles.compactImageSettings}>
          <div className={styles.compactSettingGroup}>
            <strong>Boyut ve oran</strong>
            <label>En-boy oranı<select value={aspectRatio} onChange={(event) => setAspectRatio(device, event.target.value)}>{aspectRatios.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Genişlik <b>{cardWidth} px</b><input type="range" min={device === "desktop" ? 60 : 50} max={device === "desktop" ? 500 : 320} value={cardWidth} onChange={(event) => updateImageWidth(device, Number(event.target.value))} /></label>
            {aspectRatio === "custom" ? <label>Yükseklik <b>{cardHeight} px</b><input type="range" min={device === "desktop" ? 60 : 50} max={device === "desktop" ? 500 : 400} value={cardHeight} onChange={(event) => update(device === "desktop" ? { desktopCardHeight: Number(event.target.value) } : { mobileCardHeight: Number(event.target.value) })} /></label> : <small>Yükseklik otomatik: {cardHeight} px</small>}
            <label>Görseller arası boşluk <b>{cardGap} px</b><input type="range" min="0" max={device === "desktop" ? 60 : 40} value={cardGap} onChange={(event) => update(device === "desktop" ? { desktopCardGap: Number(event.target.value) } : { mobileCardGap: Number(event.target.value) })} /></label>
          </div>
          <div className={styles.compactSettingGroup}>
            <strong>Yerleşim</strong>
            <label>Görsel davranışı<select value={imageFit} onChange={(event) => update(device === "desktop" ? { desktopImageFit: event.target.value as "cover" | "contain" } : { mobileImageFit: event.target.value as "cover" | "contain" })}><option value="cover">Alanı doldur</option><option value="contain">Tamamını göster</option></select></label>
            <label>Odak noktası<select value={imagePosition} onChange={(event) => update(device === "desktop" ? { desktopImagePosition: event.target.value } : { mobileImagePosition: event.target.value })}><option value="center">Orta</option><option value="top">Üst</option><option value="bottom">Alt</option><option value="left">Sol</option><option value="right">Sağ</option></select></label>
            <label>Arka plan<input type="color" value={backgroundColor} onChange={(event) => update(device === "desktop" ? { desktopImageBackgroundColor: event.target.value } : { mobileImageBackgroundColor: event.target.value })} /></label>
          </div>
          <div className={styles.compactSettingGroup}>
            <strong>Görünüm</strong>
            <label>Köşe yuvarlaklığı <b>{borderRadius} px</b><input type="range" min="0" max="80" value={borderRadius} onChange={(event) => update(device === "desktop" ? { desktopBorderRadius: Number(event.target.value) } : { mobileBorderRadius: Number(event.target.value) })} /></label>
            <label>Çerçeve kalınlığı <b>{borderWidth} px</b><input type="range" min="0" max="8" value={borderWidth} onChange={(event) => update(device === "desktop" ? { desktopBorderWidth: Number(event.target.value) } : { mobileBorderWidth: Number(event.target.value) })} /></label>
            <label>Çerçeve rengi<input type="color" value={borderColor} onChange={(event) => update(device === "desktop" ? { desktopBorderColor: event.target.value } : { mobileBorderColor: event.target.value })} /></label>
            <label>Gölge<select value={shadow} onChange={(event) => update(device === "desktop" ? { desktopShadow: event.target.value as typeof donation.desktopShadow } : { mobileShadow: event.target.value as typeof donation.mobileShadow })}><option value="none">Kapalı</option><option value="soft">Hafif</option><option value="medium">Orta</option><option value="strong">Güçlü</option></select></label>
          </div>
        </div>
        <div className={styles.moduleUpload}>
          <div><h3>{deviceLabel} görsel galerisi</h3><p>WebP önerilir. 250 KB üzerindeki dosyalarda boyut uyarısı gösterilir.</p></div>
          <label className={styles.primaryButton}>{uploading ? "Yükleniyor..." : "+ Görsel Yükle"}<input type="file" hidden accept=".webp,.jpg,.jpeg,.png,.svg,image/webp,image/jpeg,image/png,image/svg+xml" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file, device); event.target.value = ""; }} /></label>
        </div>
        <div className={styles.compactCategoryAssignments}>
          {donationCategoryOptions.map(([id, label]) => <section className={styles.deviceCategoryImageRow} key={id}>
            <div><strong>{label}</strong><small>Aktif {deviceLabel.toLocaleLowerCase("tr-TR")} görseli</small></div>
            <div className={styles.selectedModuleImage}><Image src={donation.categoryImages[id][device]} alt="" fill sizes="180px" /></div>
            <select value={donation.categoryImages[id][device]} onChange={(event) => selectCategoryImage(id, device, event.target.value)}>
              <option value={defaultModuleSettings.donation.categoryImages[id][device]}>Varsayılan görsel</option>
              {deviceImages.map((image, index) => <option value={image.url} key={image.path}>Galeri görseli {index + 1} · {formatSize(image.size)}</option>)}
            </select>
          </section>)}
        </div>
        {deviceImages.length ? <div className={styles.compactGalleryGrid}>
          {deviceImages.map((image) => {
            const meta = imageMeta[image.url];
            const usages = donationCategoryOptions.filter(([id]) => donation.categoryImages[id][device] === image.url);
            return <article className={styles.compactGalleryCard} key={image.path}>
              <div>
                <Image src={image.url} alt={`${deviceLabel} galeri görseli`} fill sizes="130px" onLoad={(event) => {
                  const element = event.currentTarget;
                  setImageMeta((current) => current[image.url] ? current : { ...current, [image.url]: { width: element.naturalWidth, height: element.naturalHeight } });
                }} />
                {usages.length ? <span>Kullanılıyor</span> : null}
              </div>
              <small>{meta ? `${meta.width}×${meta.height} · ${imageRatio(meta.width, meta.height)} · ` : ""}{formatSize(image.size)}</small>
              {image.size > 250 * 1024 ? <em>Boyut yüksek</em> : null}
              <p>{usages.length ? usages.map(([, label]) => label).join(", ") : "Kullanılmıyor"}</p>
              <button type="button" onClick={() => void deleteImage(image)}>Sil</button>
            </article>;
          })}
        </div> : <div className={styles.emptyModuleGallery}>Bu bölümde henüz özel görsel yok. Mevcut örnek görseller kullanılmaya devam ediyor.</div>}
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
                <nav className={styles.deviceSettingsTabs} aria-label="Web ayar bölümleri">
                  <button type="button" className={desktopPanel === "design" ? styles.activeDeviceSettingsTab : ""} onClick={() => setDesktopPanel("design")}>Web Tasarımı</button>
                  <button type="button" className={desktopPanel === "gallery" ? styles.activeDeviceSettingsTab : ""} onClick={() => setDesktopPanel("gallery")}>Web Görsel Ayarları</button>
                </nav>
                {desktopPanel === "design" ? <div className={styles.moduleControls}>
                  <h3>Web Ayarları</h3>
                  <label className={styles.headerCheck}><input type="checkbox" checked={donation.enabled} onChange={(event) => update({ enabled: event.target.checked })} /> Modülü ana sayfada göster</label>
                  <label className={styles.headerCheck}><input type="checkbox" checked={donation.autoScroll} onChange={(event) => update({ autoScroll: event.target.checked })} /> Kategorileri otomatik kaydır</label>
                  <label className={styles.headerCheck}><input type="checkbox" checked={donation.showProgress} onChange={(event) => update({ showProgress: event.target.checked })} /> İlerleme çizgisini göster</label>
                  <label>Kaydırma hızı <b>{donation.autoScrollSpeed.toFixed(2)}×</b><input type="range" min=".25" max="4" step=".25" value={donation.autoScrollSpeed} onChange={(event) => update({ autoScrollSpeed: Number(event.target.value) })} /></label>
                  <label>Slider üzerine bindirme <b>{donation.desktopOverlap} px</b><input type="range" min="0" max="100" value={donation.desktopOverlap} onChange={(event) => update({ desktopOverlap: Number(event.target.value) })} /></label>
                  <label>Bağış alanıyla mesafe <b>{donation.desktopContentGap} px</b><input type="range" min="0" max="120" value={donation.desktopContentGap} onChange={(event) => update({ desktopContentGap: Number(event.target.value) })} /></label>
                  <label>Kutucuk hizalama<select value={donation.desktopCategoryAlignment} onChange={(event) => update({ desktopCategoryAlignment: event.target.value as typeof donation.desktopCategoryAlignment })}><option value="left">Sola hizala</option><option value="center">Ortaya hizala</option></select></label>
                  <label>İki çizgi arası ek boşluk <b>{donation.desktopProgressExtraSpace} px</b><input type="range" min="0" max="160" value={donation.desktopProgressExtraSpace} onChange={(event) => update({ desktopProgressExtraSpace: Number(event.target.value) })} /></label>
                  <label>İlerleme başlangıç rengi<input type="color" value={donation.desktopProgressStartColor} onChange={(event) => update({ desktopProgressStartColor: event.target.value })} /></label>
                  <label>İlerleme bitiş rengi<input type="color" value={donation.desktopProgressEndColor} onChange={(event) => update({ desktopProgressEndColor: event.target.value })} /></label>
                  <label>İlerleme çizgisi zemini<input type="color" value={donation.desktopProgressTrackColor} onChange={(event) => update({ desktopProgressTrackColor: event.target.value })} /></label>
                  <label>İlerleme çizgisi konumu<select value={donation.desktopProgressPosition} onChange={(event) => update({ desktopProgressPosition: event.target.value as typeof donation.desktopProgressPosition })}><option value="top">Yalnızca üstte</option><option value="bottom">Yalnızca altta</option><option value="both">Üstte ve altta</option></select></label>
                  <label>Çizgi ile kart aralığı <b>{donation.desktopProgressGap} px</b><input type="range" min="0" max="60" value={donation.desktopProgressGap} onChange={(event) => update({ desktopProgressGap: Number(event.target.value) })} /></label>
                  <label>Çizgi kalınlığı <b>{donation.desktopProgressThickness} px</b><input type="range" min="1" max="8" value={donation.desktopProgressThickness} onChange={(event) => update({ desktopProgressThickness: Number(event.target.value) })} /></label>
                  <h3>Görünen kategoriler</h3>
                  {donationCategoryOptions.map(([id, label]) => <label className={styles.headerCheck} key={id}><input type="checkbox" checked={donation.visibleCategories.includes(id)} onChange={() => toggleCategory(id)} /> {label}</label>)}
                </div> : null}
                {desktopPanel === "gallery" ? gallery("desktop") : null}
              </div>
              {preview("desktop")}
            </div>
          </> : null}

          {tab === "mobile" ? <>
            <div className={styles.moduleEditorGrid}>
              <div className={styles.moduleConfigurationPanel}>
                <nav className={styles.deviceSettingsTabs} aria-label="Mobil ayar bölümleri">
                  <button type="button" className={mobilePanel === "design" ? styles.activeDeviceSettingsTab : ""} onClick={() => setMobilePanel("design")}>Mobil Tasarımı</button>
                  <button type="button" className={mobilePanel === "gallery" ? styles.activeDeviceSettingsTab : ""} onClick={() => setMobilePanel("gallery")}>Mobil Görsel Ayarları</button>
                </nav>
                {mobilePanel === "design" ? <div className={styles.moduleControls}>
                  <h3>Mobil Ayarları</h3>
                  <label className={styles.headerCheck}><input type="checkbox" checked={donation.enabled} onChange={(event) => update({ enabled: event.target.checked })} /> Modülü ana sayfada göster</label>
                  <label className={styles.headerCheck}><input type="checkbox" checked={donation.autoScroll} onChange={(event) => update({ autoScroll: event.target.checked })} /> Kategorileri otomatik kaydır</label>
                  <label className={styles.headerCheck}><input type="checkbox" checked={donation.showProgress} onChange={(event) => update({ showProgress: event.target.checked })} /> İlerleme çizgisini göster</label>
                  <label>Kaydırma hızı <b>{donation.autoScrollSpeed.toFixed(2)}×</b><input type="range" min=".25" max="4" step=".25" value={donation.autoScrollSpeed} onChange={(event) => update({ autoScrollSpeed: Number(event.target.value) })} /></label>
                  <label>Slider üzerine bindirme <b>{donation.mobileOverlap} px</b><input type="range" min="0" max="60" value={donation.mobileOverlap} onChange={(event) => update({ mobileOverlap: Number(event.target.value) })} /></label>
                  <label>Bağış alanıyla mesafe <b>{donation.mobileContentGap} px</b><input type="range" min="0" max="100" value={donation.mobileContentGap} onChange={(event) => update({ mobileContentGap: Number(event.target.value) })} /></label>
                  <label>İki çizgi arası ek boşluk <b>{donation.mobileProgressExtraSpace} px</b><input type="range" min="0" max="120" value={donation.mobileProgressExtraSpace} onChange={(event) => update({ mobileProgressExtraSpace: Number(event.target.value) })} /></label>
                  <label>İlerleme başlangıç rengi<input type="color" value={donation.mobileProgressStartColor} onChange={(event) => update({ mobileProgressStartColor: event.target.value })} /></label>
                  <label>İlerleme bitiş rengi<input type="color" value={donation.mobileProgressEndColor} onChange={(event) => update({ mobileProgressEndColor: event.target.value })} /></label>
                  <label>İlerleme çizgisi zemini<input type="color" value={donation.mobileProgressTrackColor} onChange={(event) => update({ mobileProgressTrackColor: event.target.value })} /></label>
                  <label>İlerleme çizgisi konumu<select value={donation.mobileProgressPosition} onChange={(event) => update({ mobileProgressPosition: event.target.value as typeof donation.mobileProgressPosition })}><option value="top">Yalnızca üstte</option><option value="bottom">Yalnızca altta</option><option value="both">Üstte ve altta</option></select></label>
                  <label>Çizgi ile kart aralığı <b>{donation.mobileProgressGap} px</b><input type="range" min="0" max="50" value={donation.mobileProgressGap} onChange={(event) => update({ mobileProgressGap: Number(event.target.value) })} /></label>
                  <label>Çizgi kalınlığı <b>{donation.mobileProgressThickness} px</b><input type="range" min="1" max="8" value={donation.mobileProgressThickness} onChange={(event) => update({ mobileProgressThickness: Number(event.target.value) })} /></label>
                  <h3>Görünen kategoriler</h3>
                  {donationCategoryOptions.map(([id, label]) => <label className={styles.headerCheck} key={id}><input type="checkbox" checked={donation.visibleCategories.includes(id)} onChange={() => toggleCategory(id)} /> {label}</label>)}
                </div> : null}
                {mobilePanel === "gallery" ? gallery("mobile") : null}
              </div>
              {preview("mobile")}
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
              <div className={styles.lowerPreviewSticky}>{preview(lowerDevice)}</div>
            </div>
          </div> : null}
        </div> : null}
      </section>

      <button className={styles.futureModuleCard} type="button" disabled><span>02</span><strong>Yeni modül alanı</strong><small>Bir sonraki modül burada yer alacak.</small><b>Yakında</b></button>
    </>
  );
}
