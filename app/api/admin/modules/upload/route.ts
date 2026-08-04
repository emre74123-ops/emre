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
  if (!(file instanceof File)) return NextResponse.json({ error: "Görsel seçilmedi." }, { status: 400 });
  if (!["image/webp", "image/jpeg", "image/png", "image/svg+xml"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "WebP, JPG, PNG veya SVG biçiminde ve 2 MB'dan küçük bir görsel yükleyin." }, { status: 400 });
  }

  const storage = createAdminClient();
  await storage.storage.createBucket("slider-images", { public: true, fileSizeLimit: 5 * 1024 * 1024 }).catch(() => undefined);
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "webp";
  const path = `modules/donation/${crypto.randomUUID()}.${extension}`;
  const { error } = await storage.storage.from("slider-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = storage.storage.from("slider-images").getPublicUrl(path);
  return NextResponse.json({ path, url: data.publicUrl });
}
