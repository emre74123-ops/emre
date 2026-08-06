import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { createClient } from "../../../../../lib/supabase/server";
import { deleteR2Prefix } from "../../../../../lib/r2";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  return Boolean(data);
}

export async function GET(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const storage = createAdminClient();
  const projectId = new URL(request.url).searchParams.get("projectId")?.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "";
  const images = [];
  for (const device of ["desktop", "mobile"] as const) {
    const directory = projectId ? `modules/donation/projects/${projectId}/${device}` : `modules/donation/${device}`;
    const { data: files, error } = await storage.storage.from("slider-images").list(directory, {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    for (const file of files || []) {
      if (!file.metadata?.mimetype?.startsWith("image/")) continue;
      const path = `${directory}/${file.name}`;
      const { data } = storage.storage.from("slider-images").getPublicUrl(path);
      images.push({ path, url: data.publicUrl, device, projectId, size: Number(file.metadata?.size || 0), createdAt: file.created_at });
    }
  }
  return NextResponse.json({ images });
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await request.json();
  const projectId = String(body.projectId || "").replace(/[^a-z0-9-]/gi, "").toLowerCase();
  if (body.deleteAll && projectId) {
    try {
      await deleteR2Prefix(`modules/donation/projects/${projectId}/`);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "R2 kart galerisi silinemedi." }, { status: 500 });
    }
    const storage = createAdminClient();
    const paths: string[] = [];
    for (const device of ["desktop", "mobile"] as const) {
      const directory = `modules/donation/projects/${projectId}/${device}`;
      const { data } = await storage.storage.from("slider-images").list(directory, { limit: 200 });
      for (const file of data || []) paths.push(`${directory}/${file.name}`);
    }
    if (paths.length) {
      const { error } = await storage.storage.from("slider-images").remove(paths);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }
  const path = String(body.path || "");
  if (!/^modules\/donation\/(?:(?:desktop|mobile)|projects\/[a-z0-9-]+\/(?:desktop|mobile))\/[a-z0-9-]+\.[a-z0-9]+$/i.test(path)) {
    return NextResponse.json({ error: "Geçersiz görsel yolu." }, { status: 400 });
  }
  const { error } = await createAdminClient().storage.from("slider-images").remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
