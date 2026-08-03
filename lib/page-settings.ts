export type ManagedPage = {
  id: string;
  title: string;
  slug: string;
  kind: "standard" | "project";
  menuType: "direct" | "dropdown";
  parentId: string | null;
  enabled: boolean;
  locked: boolean;
  isHome: boolean;
};

export const defaultManagedPages: ManagedPage[] = [
  { id: "projects", title: "Projelerimiz", slug: "projelerimiz", kind: "standard", menuType: "dropdown", parentId: null, enabled: true, locked: true, isHome: false },
  { id: "about", title: "Biz Kimiz?", slug: "biz-kimiz", kind: "standard", menuType: "direct", parentId: null, enabled: true, locked: true, isHome: false },
  { id: "transparency", title: "ÅeffaflÄ±k", slug: "seffaflik", kind: "standard", menuType: "direct", parentId: null, enabled: true, locked: true, isHome: false },
  { id: "stories", title: "Ä°yilik HikÃ¢yeleri", slug: "iyilik-hikayeleri", kind: "standard", menuType: "direct", parentId: null, enabled: true, locked: true, isHome: false },
  { id: "contact", title: "Ä°letiÅŸim", slug: "iletisim", kind: "standard", menuType: "direct", parentId: null, enabled: true, locked: true, isHome: false },
  { id: "project-education", title: "EÄŸitim DesteÄŸi", slug: "egitim-destegi", kind: "project", menuType: "direct", parentId: "projects", enabled: true, locked: false, isHome: false },
  { id: "project-water", title: "Temiz Su Projeleri", slug: "temiz-su-projeleri", kind: "project", menuType: "direct", parentId: "projects", enabled: true, locked: false, isHome: false },
  { id: "project-food", title: "GÄ±da YardÄ±mlarÄ±", slug: "gida-yardimlari", kind: "project", menuType: "direct", parentId: "projects", enabled: true, locked: false, isHome: false },
];

export function normalizeManagedPages(pages: Partial<ManagedPage>[]) {
  const hasProjects = pages.some((page) => page.id === "projects");
  const source = hasProjects ? pages : [defaultManagedPages[0], ...pages];
  let homeAssigned = false;
  return source.map((page, index): ManagedPage => ({
    id: String(page.id || `page-${index + 1}`),
    title: String(page.title || "Yeni Sayfa"),
    slug: normalizeSlug(String(page.slug || page.title || `sayfa-${index + 1}`)),
    kind: page.kind === "project" ? "project" : "standard",
    menuType: page.menuType === "dropdown" ? "dropdown" : "direct",
    parentId: page.parentId === undefined ? (page.kind === "project" ? "projects" : null) : page.parentId,
    enabled: page.enabled !== false,
    locked: Boolean(page.locked),
    isHome: !page.parentId && !homeAssigned && (page.isHome === true || normalizeSlug(String(page.title || "")) === "anasayfa")
      ? (homeAssigned = true)
      : false,
  }));
}

export function managedPageHref(page: Pick<ManagedPage, "slug" | "isHome">) {
  return page.isHome ? "/" : `/${page.slug}`;
}

export function normalizeSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ä±/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
