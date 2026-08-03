export type ManagedPage = {
  id: string;
  title: string;
  slug: string;
  kind: "standard" | "project";
  menuType: "direct" | "dropdown";
  parentId: string | null;
  enabled: boolean;
  locked: boolean;
};

export const defaultManagedPages: ManagedPage[] = [
  { id: "projects", title: "Projelerimiz", slug: "projelerimiz", kind: "standard", menuType: "dropdown", parentId: null, enabled: true, locked: true },
  { id: "about", title: "Biz Kimiz?", slug: "biz-kimiz", kind: "standard", menuType: "direct", parentId: null, enabled: true, locked: true },
  { id: "transparency", title: "Şeffaflık", slug: "seffaflik", kind: "standard", menuType: "direct", parentId: null, enabled: true, locked: true },
  { id: "stories", title: "İyilik Hikâyeleri", slug: "iyilik-hikayeleri", kind: "standard", menuType: "direct", parentId: null, enabled: true, locked: true },
  { id: "contact", title: "İletişim", slug: "iletisim", kind: "standard", menuType: "direct", parentId: null, enabled: true, locked: true },
  { id: "project-education", title: "Eğitim Desteği", slug: "egitim-destegi", kind: "project", menuType: "direct", parentId: "projects", enabled: true, locked: false },
  { id: "project-water", title: "Temiz Su Projeleri", slug: "temiz-su-projeleri", kind: "project", menuType: "direct", parentId: "projects", enabled: true, locked: false },
  { id: "project-food", title: "Gıda Yardımları", slug: "gida-yardimlari", kind: "project", menuType: "direct", parentId: "projects", enabled: true, locked: false },
];

export function normalizeManagedPages(pages: Partial<ManagedPage>[]) {
  const hasProjects = pages.some((page) => page.id === "projects");
  const source = hasProjects ? pages : [defaultManagedPages[0], ...pages];
  return source.map((page, index): ManagedPage => ({
    id: String(page.id || `page-${index + 1}`),
    title: String(page.title || "Yeni Sayfa"),
    slug: normalizeSlug(String(page.slug || page.title || `sayfa-${index + 1}`)),
    kind: page.kind === "project" ? "project" : "standard",
    menuType: page.menuType === "dropdown" ? "dropdown" : "direct",
    parentId: page.parentId === undefined ? (page.kind === "project" ? "projects" : null) : page.parentId,
    enabled: page.enabled !== false,
    locked: Boolean(page.locked),
  }));
}

export function normalizeSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
