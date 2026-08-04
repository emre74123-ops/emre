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
  const { data: files, error } = await storage.storage.from("slider-images").list("modules/donation", {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const images = (files || [])
    .filter((file) => file.metadata?.mimetype?.startsWith("image/"))
    .map((file) => {
      const path = `modules/donation/${file.name}`;
      const { data } = storage.storage.from("slider-images").getPublicUrl(path);
      return { path, url: data.publicUrl, size: Number(file.metadata?.size || 0), createdAt: file.created_at };
    });
  return NextResponse.json({ images });
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const path = String((await request.json()).path || "");
  if (!/^modules\/donation\/[a-z0-9-]+\.[a-z0-9]+$/i.test(path)) {
    return NextResponse.json({ error: "Geçersiz görsel yolu." }, { status: 400 });
  }
  const { error } = await createAdminClient().storage.from("slider-images").remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
