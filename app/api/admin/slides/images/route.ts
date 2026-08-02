import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";

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
  const { data: root, error } = await storage.storage.from("slider-images").list("", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const folders = (root || []).filter((item) => !item.metadata && /^\d{4}$/.test(item.name));
  const images = [];
  for (const folder of folders) {
    const { data: files } = await storage.storage.from("slider-images").list(folder.name, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    for (const file of files || []) {
      if (!file.metadata?.mimetype?.startsWith("image/")) continue;
      const path = `${folder.name}/${file.name}`;
      const { data } = storage.storage.from("slider-images").getPublicUrl(path);
      images.push({
        path,
        url: data.publicUrl,
        size: Number(file.metadata.size || 0),
        createdAt: file.created_at,
      });
    }
  }

  images.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return NextResponse.json({ images });
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const path = String((await request.json()).path || "");
  if (!/^\d{4}\/[a-z0-9-]+\.[a-z0-9]+$/i.test(path)) {
    return NextResponse.json({ error: "Geçersiz görsel yolu." }, { status: 400 });
  }
  const storage = createAdminClient();
  const { error } = await storage.storage.from("slider-images").remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

