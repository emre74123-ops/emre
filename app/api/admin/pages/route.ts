import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { defaultManagedPages, normalizeSlug, type ManagedPage } from "../../../../lib/page-settings";
import { readManagedPages, writeManagedPages } from "../../../../lib/page-storage";
import { createClient } from "../../../../lib/supabase/server";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: admin } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  return Boolean(admin);
}

function cleanPages(input: unknown): ManagedPage[] {
  if (!Array.isArray(input)) return defaultManagedPages;
  const used = new Set<string>();
  return input.slice(0, 50).map((page: Partial<ManagedPage>, index) => {
    let slug = normalizeSlug(String(page.slug || page.title || `sayfa-${index + 1}`)) || `sayfa-${index + 1}`;
    while (used.has(slug)) slug = `${slug}-${index + 1}`;
    used.add(slug);
    return {
      id: String(page.id || crypto.randomUUID()).slice(0, 80),
      title: String(page.title || "Yeni Sayfa").trim().slice(0, 80),
      slug,
      kind: page.kind === "project" ? "project" : "standard",
      menuType: page.menuType === "dropdown" ? "dropdown" : "direct",
      parentId: page.parentId ? String(page.parentId).slice(0, 80) : null,
      enabled: Boolean(page.enabled),
      locked: Boolean(page.locked),
    };
  });
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  return NextResponse.json({ pages: await readManagedPages() });
}

export async function PUT(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await request.json();
  const pages = cleanPages(body.pages);
  const { error } = await writeManagedPages(pages);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/", "layout");
  return NextResponse.json({ pages });
}
