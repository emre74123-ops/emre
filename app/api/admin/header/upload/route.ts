import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { createClient } from "../../../../../lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { data: admin } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Logo seçilmedi." }, { status: 400 });
  const allowed = ["image/svg+xml", "image/webp", "image/png"];
  if (!allowed.includes(file.type) || file.size > 1024 * 1024) {
    return NextResponse.json({ error: "Logo SVG, WebP veya PNG olmalı ve 1 MB'ı geçmemelidir." }, { status: 400 });
  }

  const storage = createAdminClient();
  await storage.storage.createBucket("slider-images", { public: true, fileSizeLimit: 5 * 1024 * 1024 }).catch(() => undefined);
  const extension = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const path = `header/logo-${crypto.randomUUID()}.${extension}`;
  const { error } = await storage.storage.from("slider-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = storage.storage.from("slider-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}

