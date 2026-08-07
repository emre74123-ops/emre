"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { defaultModuleSettings, normalizeDonationCategoryId, normalizeModuleSettings, type DonationCategory, type DonationLowerDeviceSettings, type DonationProject, type DonationProjectDesign, type DonationProjectMedia, type ModuleSettings } from "../../lib/module-settings";
import DonationModule from "../components/DonationModule";
import styles from "./admin.module.css";

type ModuleTab = "desktop" | "mobile";
type ModuleSection = "upper" | "lower";
type Device = "desktop" | "mobile";
type ProjectCategory = DonationProject["category"];
type DonationCategoryId = string;
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
  const updateProject = (changes: Partial<DonationProject>) => {
    if (!selectedProject) return;
    updateProjects(donation.projects.map((project) => project.id === selectedProject.id ? { ...project, ...changes } : project));
  };
  const updateProjectDesign = (device: Device, changes: Partial<DonationProjectDesign>) => {
    if (!selectedProject) return;
    updateProject({ [device]: { ...selectedProject[device], ...changes } });
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
    }]);
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
      setSelectedProjectId(aggregateCategorySelected ? next[0]?.id || "" : next.find((project) => project.category === projectCategory)?.id || "");
      showToast("Kart ve karta ait medya galerisi silindi.");
    });
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
      showToast("Modül ayarları canlı siteye kaydedildi.");
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

  function chooseUpperCategory(device: Device, id: string) {
    setSelectedUpperCategory((current) => ({ ...current, [device]: id }));
    requestAnimationFrame(() => {
      const rail = categoryStripRefs.current[device];
      const card = rail?.querySelector<HTMLElement>(`[data-category-id="${CSS.escape(id)}"]`);
      if (!rail || !card) return;
      const target = card.offsetLeft - Math.max(0, (rail.clientWidth - card.offsetWidth) / 2);
      rail.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    });
  }

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
    const design = (selectedProject || defaultModuleSettings.donation.projects[0])[device];
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
        <label>Slider üzerine bindirme <b>{desktop ? donation.desktopOverlap : donation.mobileOverlap} px</b><input type="range" min="0" max={desktop ? "100" : "60"} value={desktop ? donation.desktopOverlap : donation.mobileOverlap} onChange={(event) => update(desktop ? { desktopOverlap: Number(event.target.value) } : { mobileOverlap: Number(event.target.value) })} /></label>
        <label>Bağış alanıyla mesafe <b>{desktop ? donation.desktopContentGap : donation.mobileContentGap} px</b><input type="range" min="0" max={desktop ? "120" : "100"} value={desktop ? donation.desktopContentGap : donation.mobileContentGap} onChange={(event) => update(desktop ? { desktopContentGap: Number(event.target.value) } : { mobileContentGap: Number(event.target.value) })} /></label>
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
              {preview("desktop")}
            </div>
          </> : null}

          {tab === "mobile" ? <>
            <div className={styles.moduleEditorGrid}>
              <div className={styles.moduleConfigurationPanel}>
                {upperDesignSettings("mobile")}
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
