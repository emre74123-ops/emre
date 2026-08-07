"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { defaultModuleSettings, donationCategoryOptions, normalizeModuleSettings, type DonationLowerDeviceSettings, type DonationProject, type DonationProjectDesign, type DonationProjectMedia, type ModuleSettings } from "../../lib/module-settings";
import DonationModule from "../components/DonationModule";
import styles from "./admin.module.css";

type ModuleTab = "desktop" | "mobile";
type ModuleSection = "upper" | "lower";
type Device = "desktop" | "mobile";
type ProjectCategory = DonationProject["category"] | "all";
type DonationCategoryId = typeof donationCategoryOptions[number][0];
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
};
type UpperSettingsGroupRenderer = (id: string, title: string, content: ReactNode) => ReactNode;

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
  const [upperDesktopGroup, setUpperDesktopGroup] = useState("publishing");
  const [upperMobileGroup, setUpperMobileGroup] = useState("publishing");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [imageMeta, setImageMeta] = useState<Record<string, { width: number; height: number }>>({});
  const [selectedUpperCategory, setSelectedUpperCategory] = useState<Record<Device, DonationCategoryId>>({ desktop: "all", mobile: "all" });
  const [draggedUpperCategory, setDraggedUpperCategory] = useState("");
  const [galleryQuery, setGalleryQuery] = useState("");
  const [gallerySort, setGallerySort] = useState<"newest" | "oldest" | "smallest" | "largest">("newest");
  const [uploading, setUploading] = useState(false);
  const [uploadingPosterId, setUploadingPosterId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/modules", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/admin/modules/category-media", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/admin/modules/images", { cache: "no-store" }).then((response) => response.json()),
    ]).then(([settingsResult, categoryMediaResult, legacyImageResult]) => {
      if (settingsResult.settings) {
        setSettings(normalizeModuleSettings(settingsResult.settings));
      }
      setImages([...(categoryMediaResult.images || []), ...(legacyImageResult.images || [])]);
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
      showToast("Yeni kart eklemek iÃ§in Ã¶nce gerÃ§ek bir baÄŸÄ±ÅŸ kategorisi seÃ§in.");
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
      title: "Yeni baÄŸÄ±ÅŸ kartÄ±",
      description: "BaÄŸÄ±ÅŸ kartÄ± aÃ§Ä±klamasÄ±nÄ± buradan dÃ¼zenleyin.",
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
    updateProjects([...donation.projects, { ...selectedProject, id, title: `${selectedProject.title} KopyasÄ±`, desktopMedia: [], mobileMedia: [], desktop: { ...selectedProject.desktop }, mobile: { ...selectedProject.mobile } }]);
    setSelectedProjectId(id);
  };
  const deleteProject = () => {
    if (!selectedProject || !window.confirm("Bu baÄŸÄ±ÅŸ kartÄ± ve karta ait web/mobil medya galerileri tamamen silinsin mi?")) return;
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
    if (!response.ok) throw new Error(result.error || "YÃ¼kleme baÄŸlantÄ±sÄ± oluÅŸturulamadÄ±.");
    const uploadResponse = await fetch(result.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadResponse.ok) throw new Error("Dosya Cloudflare depolama alanÄ±na yÃ¼klenemedi.");
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
      showToast(result.type === "video" ? "Video bu karta ait galeriye eklendi." : "GÃ¶rsel bu karta ait galeriye eklendi.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Medya yÃ¼klenemedi.");
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
      showToast("Video kapak gÃ¶rseli kaydedildi.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Video kapaÄŸÄ± yÃ¼klenemedi.");
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
    if (!response.ok) return showToast(result.error || "ModÃ¼l ayarlarÄ± kaydedilemedi.");
    setSettings(normalizeModuleSettings(result.settings));
    showToast("ModÃ¼l ayarlarÄ± canlÄ± siteye kaydedildi.");
  }

  const categoryVisibility = (device: Device) => device === "desktop"
    ? donation.desktopVisibleCategories
    : donation.mobileVisibleCategories;
  const categoryOrder = (device: Device) => device === "desktop"
    ? donation.desktopCategoryOrder
    : donation.mobileCategoryOrder;

  function toggleCategory(id: DonationCategoryId, device: Device) {
    const current = catego×ŸuêÚ$z{-®éÜj×ìKÆÖ–æÆ,K6–ÃÂö'WGFöãà¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2ç&–Ö'”'WGFöçÓà¢·WÆöF–ærò%vV%†¬K&ÆìK–÷.(
b"¢"²|;g'6VÂœ;Æ¶ÆR'Ğ¢Æ–çWBG—SÒ&f–ÆR"†–FFVâ66WCÒ"çvV'Âæ§rÂæ§VrÂçærÂæf–bÆ–ÖvR÷vV'Æ–ÖvRö§VrÆ–ÖvR÷ærÆ–ÖvRöf–b"F—6&ÆVC×·WÆöF–æwÒöä6†ævS×²†WfVçB’Óâ°¢6öç7Bf–ÆRÒWfVçBçF&vWBæf–ÆW3òå³Ó°¢–b†f–ÆR’fö–BWÆöD–ÖvR†f–ÆRÂFWf–6R“°¢WfVçBçF&vWBçfÇVRÒ"#°¢×Òóà¢ÂöÆ&VÃà¢ÂöF—cà ¢¶f–ÇFW&VD–ÖvW2æÆVæwF‚òÆF—b6Æ74æÖS×·7G–ÆW2æ6FVv÷'”vÆÆW'”w&–GÓà¢¶f–ÇFW&VD–ÖvW2æÖ‚†–ÖvR’Óâ°¢6öç7BÖWFÒ–ÖvRçv–GF‚bb–ÖvRæ†V–v‡Bò²v–GFƒ¢–ÖvRçv–GF‚Â†V–v‡C¢–ÖvRæ†V–v‡BÒ¢–ÖvTÖWF¶–ÖvRçW&ÅÓ°¢6öç7BW6vW2ÒFöæF–öä6FVv÷'”÷F–öç2æf–ÇFW"‚…¶–EÒ’ÓâFöæF–öâæ6FVv÷'”–ÖvW5¶–EÕ¶FWf–6UÒÓÓÒ–ÖvRçW&Â“°¢6öç7B—56VÆV7FVBÒ6VÆV7FVEW&ÂÓÓÒ–ÖvRçW&Ã°¢6öç7B6fVEW&6VçBÒ–ÖvRæ÷&–v–æÅ6—¦Rbb–ÖvRæ÷&–v–æÅ6—¦Râ–ÖvRç6—¦P¢òÖF‚ç&÷VæB‚ƒÒ–ÖvRç6—¦Rò–ÖvRæ÷&–v–æÅ6—¦R’¢¢¢°¢&WGW&âÆ'F–6ÆR6Æ74æÖS×¶—56VÆV7FVBò7G–ÆW2æ6FVv÷'”vÆÆW'”6&E6VÆV7FVB¢7G–ÆW2æ6FVv÷'”vÆÆW'”6&GÒ¶W“×¶–ÖvRçF‡Óà¢Æ'WGFöâG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6VÆV7D6FVv÷'”–ÖvR‡6VÆV7FVD–BÂFWf–6RÂ–ÖvRçW&Â—Óà¢Ç7ãà¢Ä–ÖvR7&3×¶–ÖvRçW&ÇÒÇC×¶G¶FWf–6TÆ&VÇÒvÆW&’|;g'6VÆ–Òf–ÆÂ6—¦W3Ò#ƒ‚"öäÆöC×²†WfVçB’Óâ°¢6öç7BVÆVÖVçBÒWfVçBæ7W'&VçEF&vWC°¢6WD–ÖvTÖWF‚†7W'&VçB’Óâ7W'&VçE¶–ÖvRçW&ÅÒò7W'&VçB¢²ââæ7W'&VçBÂ¶–ÖvRçW&ÅÓ¢²v–GFƒ¢VÆVÖVçBææGW&Åv–GF‚Â†V–v‡C¢VÆVÖVçBææGW&Ä†V–v‡BÒÒ“°¢×Òóà¢Â÷7ãà¢Ç7G&öæsç¶–ÖvRæ÷&–v–æÄæÖRÇÂ–ÖvRçF‚ç7Æ—B‚"ò"’æB‚Ó’ÇÂ$¶FVv÷&’|;g'6VÆ’'ÓÂ÷7G&öæsà¢Ç6ÖÆÃç¶ÖWFòG¶ÖWFçv–GF‡Ü9rG¶ÖWFæ†V–v‡GÒ+rG¶–ÖvU&F–ò†ÖWFçv–GF‚ÂÖWFæ†V–v‡B—Ò+r¢"'×²†–ÖvRæf÷&ÖBÇÂ–ÖvRçF‚ç7Æ—B‚"â"’æB‚Ó’ÇÂ&|;g'6VÂ"’çFõWW$66R‚—ÓÂ÷6ÖÆÃà¢Âö'WGFöãà¢ÆF—b6Æ74æÖS×·7G–ÆW2æ6FVv÷'”÷F–Ö—¦F–öçÓà¢¶–ÖvRæ÷&–v–æÅ6—¦Rbb–ÖvRæ÷&–v–æÅ6—¦Râ–ÖvRç6—¦P¢òÇ7ãç¶f÷&ÖE6—¦R†–ÖvRæ÷&–v–æÅ6—¦R—Ò(i"Æ#ç¶f÷&ÖE6—¦R†–ÖvRç6—¦R—ÓÂö#ç·6fVEW&6VçBò+rRG·6fVEW&6VçGÒ¼;Ì:|;Æ¶¢"'ÓÂ÷7ãà¢¢Ç7ãç¶f÷&ÖE6—¦R†–ÖvRç6—¦R—ÓÂ÷7ãçĞ¢·W6vW2æÆVæwF€¢òÇ7â6Æ74æÖS×·7G–ÆW2æ6FVv÷'•W6vT&FvWÓç·W6vW2æÖ‚…²ÂÆ&VÅÒ’ÓâÆ&VÂ’æ¦ö–â‚"Â"—ÓÂ÷7ãà¢¢Ç7ãä·VÆÆìKÆÜK–÷#Â÷7ãçĞ¢ÂöF—cà¢ÆF—b6Æ74æÖS×·7G–ÆW2æ6FVv÷'”ÖævW$7F–öç7Óà¢Æ'WGFöâG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6VÆV7D6FVv÷'”–ÖvR‡6VÆV7FVD–BÂFWf–6RÂ–ÖvRçW&Â—Óç¶—56VÆV7FVBò%6\:v–Æ’"¢G·6VÆV7FVDÆ&VÇÒœ:v–â·VÆÆæÓÂö'WGFöãà¢Æ'WGFöâG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâfö–BFVÆWFT–ÖvR†–ÖvR—Óå6–ÃÂö'WGFöãà¢ÂöF—cà¢Âö'F–6ÆSã°¢Ò—Ğ¢ÂöF—câ¢ÆF—b6Æ74æÖS×·7G–ÆW2æ6FVv÷'”V×G—Óà¢Ç7G&öæsç·VW'’ò$&ÖìK¦Æ\YöÆ\YöVâ|;g'6VÂ–ö²"¢G¶FWf–6TÆ&VÇÒvÆW&—6’†Vì;Ç¢&üYöÓÂ÷7G&öæsà¢Çç·VW'’ò$&Ö¶VÆ–ÖW6–æ’F\IöœY÷F—&–ââ"¢,KÆ²|;g'6VÆ–æ—¦’œ;Æ¶ÆVFœIö–æ—¦FR÷FöÖF–²öÆ&²vV%(	—–RL;fì;ÌY÷L;Ç,;ÆÌ;Ç'W&F|;g,;ÆæV6V²â'ÓÂ÷à¢ÂöF—cçĞ¢ÂöF—câ“°¢Ó° Ğ¢6öç7BWW$FW6–vå6WGF–æw2Ò†FWf–6S¢FWf–6R’Óâ°¢6öç7BFW6·F÷ÒFWf–6RÓÓÒ&FW6·F÷#°¢6öç7B÷Väw&÷WÒFW6·F÷òWW$FW6·F÷w&÷W¢WW$Öö&–ÆTw&÷W°¢6öç7B6WD÷Väw&÷WÒFW6·F÷ò6WEWW$FW6·F÷w&÷W¢6WEWW$Öö&–ÆTw&÷W°¢6öç7BFövvÆTw&÷WÒ†w&÷W¢7G&–ær’Óâ6WD÷Väw&÷W‚†7W'&VçB’Óâ7W'&VçBÓÓÒw&÷Wò""¢w&÷W“°¢6öç7Bw&÷WÒ†–C¢7G&–ærÂF—FÆS¢7G&–ærÂ6öçFVçC¢&V7DæöFR’Óâ€¢Ç6V7F–öâ6Æ74æÖS×¶÷Väw&÷WÓÓÒ–Bò7G–ÆW2æÆ÷vW$66÷&F–öä÷Vâ¢"'Óà¢Æ'WGFöâG—SÒ&'WGFöâ"öä6Æ–6³×²‚’ÓâFövvÆTw&÷W†–B—Óà¢Ç7ãç·F—FÆWÓÂ÷7ããÆ#ç¶÷Väw&÷WÓÓÒ–Bò.(‰""¢"²'ÓÂö#à¢Âö'WGFöãà¢¶÷Väw&÷WÓÓÒ–BòÆF—b6Æ74æÖS×·7G–ÆW2æÆ÷vW$66÷&F–öä6öçFVçGÓç¶6öçFVçGÓÂöF—câ¢çVÆÇĞ¢Â÷6V7F–öãà¢“° ¢&WGW&âÆF—b6Æ74æÖS×·7G–ÆW2çWW%Væ–f–VEæVÇÓà¢Æ†VFW"6Æ74æÖS×·7G–ÆW2çWW%Væ–f–VD†VFW'Óà¢Ç7ãç¶FW6·F÷ò%tT""¢$Ôô,KÂ'ÓÂ÷7ãà¢ÆF—cãÇ7G&öæsç¶FW6·F÷ò%vV"–&Æ,K"¢$Öö&–Â–&Æ,K'ÓÂ÷7G&öæsãÇ6ÖÆÃåF6,KÒÂ|;g'6VÆÆW"fRvÆW&’FV²ÖW&¶W¦FSÂ÷6ÖÆÃãÂöF—cà¢Æ“ãB,9dÌ9ÄÓÂö“à¢Âö†VFW#à¢ÆF—b6Æ74æÖS×¶G·7G–ÆW2æÆ÷vW$66÷&F–öçÒG·7G–ÆW2çWW%6WGF–æw466÷&F–öçÖÓà¢¶w&÷W‚'V&Æ—6†–ær"Â%–œKâfR¶–LK&Ö"ÂÃà¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2æ†VFW$6†V6·ÓãÆ–çWBG—SÒ&6†V6¶&÷‚"6†V6¶VC×¶FöæF–öâæVæ&ÆVGÒöä6†ævS×²†WfVçB’ÓâWFFR‡²Væ&ÆVC¢WfVçBçF&vWBæ6†V6¶VBÒ—ÒóâÖöL;ÆÌ;Âæ6–fF|;g7FW#ÂöÆ&VÃà¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2æ†VFW$6†V6·ÓãÆ–çWBG—SÒ&6†V6¶&÷‚"6†V6¶VC×¶FöæF–öâæWFõ67&öÆÇÒöä6†ævS×²†WfVçB’ÓâWFFR‡²WFõ67&öÆÃ¢WfVçBçF&vWBæ6†V6¶VBÒ—Òóâ¶FVv÷&–ÆW&’÷FöÖF–²¶–LK#ÂöÆ&VÃà¢ÆÆ&VÃä¶–LK&ÖŒK¬KÆ#ç¶FöæF–öâæWFõ67&öÆÅ7VVBçFôf—†VBƒ"—Ü9sÂö#ãÆ–çWBG—SÒ'&ævR"Ö–ãÒ"ã#R"ÖƒÒ#B"7FWÒ"ã#R"fÇVS×¶FöæF–öâæWFõ67&öÆÅ7VVGÒöä6†ævS×²†WfVçB’ÓâWFFR‡²WFõ67&öÆÅ7VVC¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò—ÒóãÂöÆ&VÃà¢ÆÆ&VÃä&YöÆæ|K:rfR&—FœYò¶–LK&ÖœKÆ#ç¶FW6·F÷òFöæF–öâæFW6·F÷VFvU67&öÆÅFF–ær¢FöæF–öâæÖö&–ÆTVFvU67&öÆÅFF–æwÒƒÂö#ãÆ–çWBG—SÒ'&ævR"Ö–ãÒ#"Öƒ×¶FW6·F÷ò#c"¢#'ÒfÇVS×¶FW6·F÷òFöæF–öâæFW6·F÷VFvU67&öÆÅFF–ær¢FöæF–öâæÖö&–ÆTVFvU67&öÆÅFF–æwÒöä6†ævS×²†WfVçB’ÓâWFFR†FW6·F÷ò²FW6·F÷VFvU67&öÆÅFF–æs¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò¢²Öö&–ÆTVFvU67&öÆÅFF–æs¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò—ÒóãÂöÆ&VÃà¢Âóâ—Ğ¢¶w&÷W‚'Æ6VÖVçB"Â%–W&Æ\Yö–Ò"ÂÃà¢ÆÆ&VÃå6Æ–FW";Ç¦W&–æR&–æF—&ÖRÆ#ç¶FW6·F÷òFöæF–öâæFW6·F÷÷fW&Æ¢FöæF–öâæÖö&–ÆT÷fW&ÆÒƒÂö#ãÆ–çWBG—SÒ'&ævR"Ö–ãÒ#"Öƒ×¶FW6·F÷ò#"¢#c'ÒfÇVS×¶FW6·F÷òFöæF–öâæFW6·F÷÷fW&Æ¢FöæF–öâæÖö&–ÆT÷fW&ÆÒöä6†ævS×²†WfVçB’ÓâWFFR†FW6·F÷ò²FW6·F÷÷fW&Æ¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò¢²Öö&–ÆT÷fW&Æ¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò—ÒóãÂöÆ&VÃà¢ÆÆ&VÃä&IüKYòÆìK–ÆÖW6fRÆ#ç¶FW6·F÷òFöæF–öâæFW6·F÷6öçFVçDv¢FöæF–öâæÖö&–ÆT6öçFVçDvÒƒÂö#ãÆ–çWBG—SÒ'&ævR"Ö–ãÒ#"Öƒ×¶FW6·F÷ò##"¢#'ÒfÇVS×¶FW6·F÷òFöæF–öâæFW6·F÷6öçFVçDv¢FöæF–öâæÖö&–ÆT6öçFVçDvÒöä6†ævS×²†WfVçB’ÓâWFFR†FW6·F÷ò²FW6·F÷6öçFVçDv¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò¢²Öö&–ÆT6öçFVçDv¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò—ÒóãÂöÆ&VÃà¢¶FW6·F÷òÆÆ&VÃä·WGV7V²†—¦ÆÖÇ6VÆV7BfÇVS×¶FöæF–öâæFW6·F÷6FVv÷'”Æ–væÖVçGÒöä6†ævS×²†WfVçB’ÓâWFFR‡²FW6·F÷6FVv÷'”Æ–væÖVçC¢WfVçBçF&vWBçfÇVR2G—VöbFöæF–öâæFW6·F÷6FVv÷'”Æ–væÖVçBÒ—ÓãÆ÷F–öâfÇVSÒ&ÆVgB#å6öÆ†—¦ÆÂö÷F–öããÆ÷F–öâfÇVSÒ&6VçFW"#ä÷'F–†—¦ÆÂö÷F–öããÂ÷6VÆV7CãÂöÆ&VÃâ¢çVÆÇĞ¢ÆÆ&VÃìK¶’:v—¦v’&<KV²&üYöÇV²Æ#ç¶FW6·F÷òFöæF–öâæFW6·F÷&öw&W74W‡G&76R¢FöæF–öâæÖö&–ÆU&öw&W74W‡G&76WÒƒÂö#ãÆ–çWBG—SÒ'&ævR"Ö–ãÒ#"Öƒ×¶FW6·F÷ò#c"¢##'ÒfÇVS×¶FW6·F÷òFöæF–öâæFW6·F÷&öw&W74W‡G&76R¢FöæF–öâæÖö&–ÆU&öw&W74W‡G&76WÒöä6†ævS×²†WfVçB’ÓâWFFR†FW6·F÷ò²FW6·F÷&öw&W74W‡G&76S¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò¢²Öö&–ÆU&öw&W74W‡G&76S¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò—ÒóãÂöÆ&VÃà¢Âóâ—Ğ¢¶w&÷W‚'&öw&W72"Â,KÆW&ÆVÖR:v—¦v—6’"ÂÃà¢ÆÆ&VÂ6Æ74æÖS×·7G–ÆW2æ†VFW$6†V6·ÓãÆ–çWBG—SÒ&6†V6¶&÷‚"6†V6¶VC×¶FöæF–öâç6†÷u&öw&W77Òöä6†ævS×²†WfVçB’ÓâWFFR‡²6†÷u&öw&W73¢WfVçBçF&vWBæ6†V6¶VBÒ—ÒóâKÆW&ÆVÖR:v—¦v—6–æ’|;g7FW#ÂöÆ&VÃà¢ÆÆ&VÃä&YöÆæ|K:r&Væv“Æ–çWBG—SÒ&6öÆ÷""fÇVS×¶FW6·F÷òFöæF–öâæFW6·F÷&öw&W757F'D6öÆ÷"¢FöæF–öâæÖö&–ÆU&öw&W757F'D6öÆ÷'Òöä6†ævS×²†WfVçB’ÓâWFFR†FW6·F÷ò²FW6·F÷&öw&W757F'D6öÆ÷#¢WfVçBçF&vWBçfÇVRÒ¢²Öö&–ÆU&öw&W757F'D6öÆ÷#¢WfVçBçF&vWBçfÇVRÒ—ÒóãÂöÆ&VÃà¢ÆÆ&VÃä&—FœYò&Væv“Æ–çWBG—SÒ&6öÆ÷""fÇVS×¶FW6·F÷òFöæF–öâæFW6·F÷&öw&W74VæD6öÆ÷"¢FöæF–öâæÖö&–ÆU&öw&W74VæD6öÆ÷'Òöä6†ævS×²†WfVçB’ÓâWFFR†FW6·F÷ò²FW6·F÷&öw&W74VæD6öÆ÷#¢WfVçBçF&vWBçfÇVRÒ¢²Öö&–ÆU&öw&W74VæD6öÆ÷#¢WfVçBçF&vWBçfÇVRÒ—ÒóãÂöÆ&VÃà¢ÆÆ&VÃì8v—¦v’¦VÖ–æ“Æ–çWBG—SÒ&6öÆ÷""fÇVS×¶FW6·F÷òFöæF–öâæFW6·F÷&öw&W75G&6´6öÆ÷"¢FöæF–öâæÖö&–ÆU&öw&W75G&6´6öÆ÷'Òöä6†ævS×²†WfVçB’ÓâWFFR†FW6·F÷ò²FW6·F÷&öw&W75G&6´6öÆ÷#¢WfVçBçF&vWBçfÇVRÒ¢²Öö&–ÆU&öw&W75G&6´6öÆ÷#¢WfVçBçF&vWBçfÇVRÒ—ÒóãÂöÆ&VÃà¢ÆÆ&VÃì8v—¦v’¶öçV×SÇ6VÆV7BfÇVS×¶FW6·F÷òFöæF–öâæFW6·F÷&öw&W75÷6—F–öâ¢FöæF–öâæÖö&–ÆU&öw&W75÷6—F–öçÒöä6†ævS×²†WfVçB’ÓâWFFR†FW6·F÷ò²FW6·F÷&öw&W75÷6—F–öã¢WfVçBçF&vWBçfÇVR2G—VöbFöæF–öâæFW6·F÷&öw&W75÷6—F–öâÒ¢²Öö&–ÆU&öw&W75÷6—F–öã¢WfVçBçF&vWBçfÇVR2G—VöbFöæF–öâæÖö&–ÆU&öw&W75÷6—F–öâÒ—ÓãÆ÷F–öâfÇVSÒ'F÷#å–ÆìK¦6;Ç7GFSÂö÷F–öããÆ÷F–öâfÇVSÒ&&÷GFöÒ#å–ÆìK¦6ÇGFÂö÷F–öããÆ÷F–öâfÇVSÒ&&÷F‚#ì9Ç7GFRfRÇGFÂö÷F–öããÂ÷6VÆV7CãÂöÆ&VÃà¢ÆÆ&VÃì8v—¦v’–ÆR¶'B&ÌKIüKÆ#ç¶FW6·F÷òFöæF–öâæFW6·F÷&öw&W74v¢FöæF–öâæÖö&–ÆU&öw&W74vÒƒÂö#ãÆ–çWBG—SÒ'&ævR"Ö–ãÒ#"Öƒ×¶FW6·F÷ò#c"¢#S'ÒfÇVS×¶FW6·F÷òFöæF–öâæFW6·F÷&öw&W74v¢FöæF–öâæÖö&–ÆU&öw&W74vÒöä6†ævS×²†WfVçB’ÓâWFFR†FW6·F÷ò²FW6·F÷&öw&W74v¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò¢²Öö&–ÆU&öw&W74v¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò—ÒóãÂöÆ&VÃà¢ÆÆ&VÃì8v—¦v’¶ÌKæÌKIüKÆ#ç¶FW6·F÷òFöæF–öâæFW6·F÷&öw&W75F†–6¶æW72¢FöæF–öâæÖö&–ÆU&öw&W75F†–6¶æW77ÒƒÂö#ãÆ–çWBG—SÒ'&ævR"Ö–ãÒ#"ÖƒÒ#‚"fÇVS×¶FW6·F÷òFöæF–öâæFW6·F÷&öw&W75F†–6¶æW72¢FöæF–öâæÖö&–ÆU&öw&W75F†–6¶æW77Òöä6†ævS×²†WfVçB’ÓâWFFR†FW6·F÷ò²FW6·F÷&öw&W75F†–6¶æW73¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò¢²Öö&–ÆU&öw&W75F†–6¶æW73¢çVÖ&W"†WfVçBçF&vWBçfÇVR’Ò—ÒóãÂöÆ&VÃà¢Âóâ—Ğ¢·WW$vÆÆW'•6V7F–öç2†FWf–6RÂw&÷W—Ğ¢ÂöF—cà¢ÂöF—cã°¢Ó° ¢&WGW&â€¢ÃàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2çvT†VF–æwÓàĞ¢ÆF—cãÇå6—FR&–Æ\YöVæÆW&“Â÷ãÆƒäÖöL;ÆÆÆW#ÂöƒãÇ7ãä'V|;Ææ¼;ÂfRvVÆV6V·FRV¶ÆVæV6V²6—FRÖöL;ÆÆÆW&–æ’FV²ÖW&¶W¦FVâœ;fæWBãÂ÷7ããÂöF—càĞ¢Æ'WGFöâ6Æ74æÖS×·7G–ÆW2ç&–Ö'”'WGFöçÒG—SÒ&'WGFöâ"F—6&ÆVC×·6f–æwÒöä6Æ–6³×·6fWÓç·6f–ærò$¶–FVF–Æ—–÷"âââ"¢$¶–FWBfR–œKæÆ'ÓÂö'WGFöãàĞ¢ÂöF—càĞ Ğ¢ÆF—b6Æ74æÖS×·7G–ÆW2æFVÖô&ææW'ÓãÇ7ãî)zcÂ÷7ããÇãÇ7G&öæsäÖöL;ÆÂÖW&¶W¦’†¬K"ãÂ÷7G&öæsä†W"ÖöL;ÆÂ¶VæF’¶'LKæF:|KÌK#²vVÆV6V·FRV¶ÆW–V6\Iö–Ö—¢ÖöL;ÆÆÆW"'W&F<K&ÆìK"ãÂ÷ãÂöF—càĞ Ğ¢Ç6V7F–öâ6Æ74æÖS×·7G–ÆW2æÖöGVÆTÖævW$6&GÓàĞ¢Æ'WGFöâ6Æ74æÖS×·7G–ÆW2æÖöGVÆTÖævW$†VFW'ÒG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6WDW‡æFVB‚‡fÇVR’ÓâfÇVR—Ò&–ÖW‡æFVC×¶W‡æFVGÓàĞ¢Ç7â6Æ74æÖS×·7G–ÆW2æÖöGVÆTçVÖ&W'ÓãÂ÷7ãàĞ¢Ç7ããÇ7G&öæsä&IüKYòÖöL;ÆÌ;ÃÂ÷7G&öæsãÇ6ÖÆÃäæ6–f+r6Æ–FW"6öç&<KÂ÷6ÖÆÃãÂ÷7ãàĞ¢Æ’6Æ74æÖS×¶FöæF–öâæVæ&ÆVBò7G–ÆW2æÖöGVÆTÆ—fR¢7G–ÆW2æÖöGVÆTöfgÓç¶FöæF–öâæVæ&ÆVBò%–œKæF"¢$¶ÌK'ÓÂö“àĞ¢Æ#ç¶W‡æFVBò.(‰""¢"²'ÓÂö#àĞ¢Âö'WGFöãàĞ Ğ¢¶W‡æFVBòÆF—b6Æ74æÖS×·7G–ÆW2æÖöGVÆTÖævW$&öG—ÓàĞ¢Ææb6Æ74æÖS×·7G–ÆW2æÖöGVÆU6V7F–öåF'7Ò&–ÖÆ&VÃÒ$&IüKYòÖöL;ÆÌ;Âæ,;fÌ;ÆÖÆW&’#àĞ¢Æ'WGFöâ6Æ74æÖS×·6V7F–öâÓÓÒ'WW""ò7G–ÆW2æ7F—fTÖöGVÆU6V7F–öåF"¢"'ÒG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6WE6V7F–öâ‚'WW""—ÓàĞ¢Ç7ããÂ÷7ããÇ7G&öæsì9Ç7B,;fÌ;ÆÓÂ÷7G&öæsãÇ6ÖÆÃä&IüKYò¶FVv÷&–ÆW&“Â÷6ÖÆÃàĞ¢Âö'WGFöãàĞ¢Æ'WGFöâ6Æ74æÖS×·6V7F–öâÓÓÒ&Æ÷vW""ò7G–ÆW2æ7F—fTÖöGVÆU6V7F–öåF"¢"'ÒG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6WE6V7F–öâ‚&Æ÷vW""—ÓàĞ¢Ç7ãã#Â÷7ããÇ7G&öæsäÇB,;fÌ;ÆÓÂ÷7G&öæsãÇ6ÖÆÃä&IüKYò6\:vVæV¶ÆW&“Â÷6ÖÆÃàĞ¢Âö'WGFöãàĞ¢ÂöæcàĞ Ğ¢·6V7F–öâÓÓÒ'WW""òÃàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖöGVÆU6V7F–öä–çG&÷ÓàĞ¢Ç7ãì9Å5B,9dÌ9ÄÓÂ÷7ããÆƒ#ä&IüKYò¶FVv÷&–ÆW&“Âöƒ#ãÇä¶FVv÷&’·WGVÆ,KìKÂ|;g'6VÆÆW&’Â¶–LK&ÖFg&ìKYüKìKfR–W&Æ\Yö–Ö’œ;fæWF–âãÂ÷àĞ¢ÂöF—càĞ¢Ææb6Æ74æÖS×·7G–ÆW2æÆ÷vW$FWf–6UF'7Ò&–ÖÆ&VÃÒ,9Ç7B,;fÌ;ÆÒ6–†¢–&Æ,K#à¢Æ'WGFöâ6Æ74æÖS×·F"ÓÓÒ&FW6·F÷"ò7G–ÆW2æ7F—fTÆ÷vW$FWf–6UF"¢"'ÒG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6WEF"‚&FW6·F÷"—ÓãÇ7ãåtT#Â÷7ããÇ7G&öæsåvV"–&Æ,KÂ÷7G&öæsãÇ6ÖÆÃäÖ6;Ç7L;Â|;g,;Æì;ÆÜ;ÃÂ÷6ÖÆÃãÂö'WGFöãà¢Æ'WGFöâ6Æ74æÖS×·F"ÓÓÒ&Öö&–ÆR"ò7G–ÆW2æ7F—fTÆ÷vW$FWf–6UF"¢"'ÒG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ6WEF"‚&Öö&–ÆR"—ÓãÇ7ãäÔô,KÃÂ÷7ããÇ7G&öæsäÖö&–Â–&Æ,KÂ÷7G&öæsãÇ6ÖÆÃåFVÆVföâ|;g,;Æì;ÆÜ;ÃÂ÷6ÖÆÃãÂö'WGFöãà¢Âöæcà Ğ¢·F"ÓÓÒ&FW6·F÷"òÃà¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖöGVÆTVF—F÷$w&–GÓà¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖöGVÆT6öæf–wW&F–öåæVÇÓà¢·WW$FW6–vå6WGF–æw2‚&FW6·F÷"—Ğ¢ÂöF—cà¢·&Wf–Wr‚&FW6·F÷"—Ğ¢ÂöF—càĞ¢Âóâ¢çVÆÇĞĞ Ğ¢·F"ÓÓÒ&Öö&–ÆR"òÃà¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖöGVÆTVF—F÷$w&–GÓà¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖöGVÆT6öæf–wW&F–öåæVÇÓà¢·WW$FW6–vå6WGF–æw2‚&Öö&–ÆR"—Ğ¢ÂöF—cà¢·&Wf–Wr‚&Öö&–ÆR"—ĞĞ¢ÂöF—càĞ¢Âóâ¢çVÆÇĞĞ¢Âóâ¢çVÆÇĞĞ Ğ¢·6V7F–öâÓÓÒ&Æ÷vW""òÆF—b6Æ74æÖS×·7G–ÆW2æÖöGVÆTÆ÷vW%6V7F–öçÓàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÖöGVÆU6V7F–öä–çG&÷ÓàĞ¢Ç7ãäÅB,9dÌ9ÄÓÂ÷7ããÆƒ#ä&IüKYò6\:vVæV¶ÆW&“Âöƒ#ãÇå6\:v–ÆVâ¶FVv÷&—–R—B&IüKYò¶'FÆ,KfR&IüKYòœYöÆVÖÆW&’'R—,KÆæFœ;fæWF–ÆV6V²ãÂ÷àĞ¢ÂöF—càĞ¢Ææb6Æ74æÖS×·7G–ÆW2æÆ÷vW$FWf–6UF'7Ò&–ÖÆ&VÃÒ$ÇB,;fÌ;ÆÒ6–†¢–&Æ,K#àĞ¢Æ'WGFöâ6Æ74æÖS×¶Æ÷vW$FWf–6RÓÓÒ&FW6·F÷"ò7G–ÆW2æ7F—fTÆ÷vW$FWf–6UF"¢"'ÒG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ²6WDÆ÷vW$FWf–6R‚&FW6·F÷"“²6WDÆ÷vW$w&÷W‚'&ö¦V7BÖ6öçFVçB"“²×ÓãÇ7ãåtT#Â÷7ããÇ7G&öæsåvV"–&Æ,KÂ÷7G&öæsãÇ6ÖÆÃäÖ6;Ç7L;Â|;g,;Æì;ÆÜ;ÃÂ÷6ÖÆÃãÂö'WGFöãà¢Æ'WGFöâ6Æ74æÖS×¶Æ÷vW$FWf–6RÓÓÒ&Öö&–ÆR"ò7G–ÆW2æ7F—fTÆ÷vW$FWf–6UF"¢"'ÒG—SÒ&'WGFöâ"öä6Æ–6³×²‚’Óâ²6WDÆ÷vW$FWf–6R‚&Öö&–ÆR"“²6WDÆ÷vW$w&÷W‚'&ö¦V7BÖ6öçFVçB"“²×ÓãÇ7ãäÔô,KÃÂ÷7ããÇ7G&öæsäÖö&–Â–&Æ,KÂ÷7G&öæsãÇ6ÖÆÃåFVÆVföâ|;g,;Æì;ÆÜ;ÃÂ÷6ÖÆÃãÂö'WGFöãà¢ÂöæcàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÆ÷vW$VF—F÷$w&–GÓàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÆ÷vW%6WGF–æw5æVÇÓàĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÆ÷vW%æVÄ†VF–æwÓãÇ7ãç¶Æ÷vW$FWf–6RÓÓÒ&FW6·F÷"ò%tT"”$Ä$’"¢$Ôô,KÂ”$Ä$’'ÓÂ÷7ããÇåL;ÆÒF6,KÒfR–W&Æ\Yö–Ò–&Æ,K'R6–†¢œ:v–â&IüK×<K¦LK"ãÂ÷ãÂöF—càĞ¢·&ö¦V7D6öçG&öÇ2†Æ÷vW$FWf–6R—ĞĞ¢¶Æ÷vW$6öçG&öÇ2†Æ÷vW$FWf–6R—ĞĞ¢ÂöF—càĞ¢ÆF—b6Æ74æÖS×·7G–ÆW2æÆ÷vW%&Wf–Wu7F–6·—Óç·&Wf–Wr†Æ÷vW$FWf–6R—ÓÂöF—càĞ¢ÂöF—càĞ¢ÂöF—câ¢çVÆÇĞĞ¢ÂöF—câ¢çVÆÇĞĞ¢Â÷6V7F–öãàĞ Ğ¢Æ'WGFöâ6Æ74æÖS×·7G–ÆW2ægWGW&TÖöGVÆT6&GÒG—SÒ&'WGFöâ"F—6&ÆVCãÇ7ãã#Â÷7ããÇ7G&öæså–Væ’ÖöL;ÆÂÆìKÂ÷7G&öæsãÇ6ÖÆÃä&—"6öç&¶’ÖöL;ÆÂ'W&F–W"Æ6²ãÂ÷6ÖÆÃãÆ#å–¼KæFÂö#ãÂö'WGFöãàĞ¢ÂóàĞ¢“°Ğ§ĞĞ