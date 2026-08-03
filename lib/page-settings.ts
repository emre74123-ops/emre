export type ManagedPage = {
  id: string;
  title: string;
  slug: string;
  kind: "standard" | "project";
  enabled: boolean;
  locked: boolean;
};

export const defaultManagedPages: ManagedPage[] = [
  { id: "about", title: "Biz Kimiz?", slug: "biz-kimiz", kind: "standard", enabled: true, locked: true },
  { id: "transparency", title: "Şeffaflık", slug: "seffaflik", kind: "standard", enabled: true, locked: true },
  { id: "stories", title: "İyilik Hikâyeleri", slug: "iyilik-hikayeleri", kind: "standard", enabled: true, locked: true },
  { id: "contact", title: "İletişim", slug: "iletisim", kind: "standard", enabled: true, locked: true },
  { id: "project-education", title: "Eğitim Desteği", slug: "egitim-destegi", kind: "project", enabled: true, locked: false },
  { id: "project-water", title: "Temiz Su Projeleri", slug: "temiz-su-projeleri", kind: "project", enabled: true, locked: false },
  { id: "project-food", title: "Gıda Yardımları", slug: "gida-yardimlari", kind: "project", enabled: true, locked: false },
];

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
