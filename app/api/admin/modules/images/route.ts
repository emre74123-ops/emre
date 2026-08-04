import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { createClient } from "../../../../../lib/supabase/server";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  return Boolean(data);
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const storage = createAdminClient();
  const images = [];
  for (const device of ["desktop", "mobile"] as const) {
    const { data: files, error } = await storage.storage.from("slider-images").list(`modules/donation/${device}`, {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    for (const file of files || []) {
      if (!file.metadata?.mimetype?.startsWith("image/")) continue;
      const path = `modules/donation/${device}/${file.name}`;
      const { data } = storage.storage.from("slider-images").getPublicUrl(path);
      images.push({ path, url: data.publicUrl, device, size: Number(file.metadata?.size || 0), createdAt: file.created_at });
    }
  }
  return NextResponse.json({ images });
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const path = String((await request.json()).path || "");
  if (!/^modules\/donation\/(desktop|mobile)\/[a-z0-9-]+\.[a-z0-9]+$/i.test(path)) {
    return NextResponse.json({ error: "Geçersiz görsel yolu." }, { status: 400 });
  }
  const { error } = await createAdminClient().storage.from("slider-images").remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
