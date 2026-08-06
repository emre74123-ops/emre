import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createR2UploadUrl, deleteR2Keys, r2PublicUrl } from "../../../../../lib/r2";

const imageTypes = new Set(["image/webp", "image/jpeg", "image/png", "image/avif"]);
const videoTypes = new Set(["video/mp4"]);

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  return Boolean(data);
}

function cleanProjectId(value: unknown) {
  return String(value || "").replace(/[^a-z0-9-]/gi, "").toLowerCase();
}

export async function POST(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body: {
    projectId?: unknown;
    device?: unknown;
    contentType?: unknown;
    size?: unknown;
    purpose?: unknown;
  } = await request.json();
  const projectId = cleanProjectId(body.projectId);
  const device = body.device === "mobile" ? "mobile" : "desktop";
  const contentType = String(body.contentType || "").toLowerCase();
  const size = Number(body.size || 0);
  const purpose = body.purpose === "poster" ? "poster" : "media";
  const isImage = imageTypes.has(contentType);
  const isVideo = videoTypes.has(contentType);

  if (!projectId) return NextResponse.json({ error: "Kart seçilmedi." }, { status: 400 });
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "WebP, JPG, PNG, AVIF görsel veya MP4 video yükleyin." }, { status: 400 });
  }
  if (purpose === "poster" && !isImage) {
    return NextResponse.json({ error: "Video kapağı görsel olmalıdır." }, { status: 400 });
  }
  const maxSize = isVideo ? 150 * 1024 * 1024 : 5 * 1024 * 1024;
  if (!Number.isFinite(size) || size <= 0 || size > maxSize) {
    return NextResponse.json({
      error: isVideo ? "Video en fazla 150 MB olabilir." : "Görsel en fazla 5 MB olabilir.",
    }, { status: 400 });
  }

  const extension = isVideo ? "mp4" : contentType.split("/")[1].replace("jpeg", "jpg");
  const key = `modules/donation/projects/${projectId}/${device}/${purpose}/${crypto.randomUUID()}.${extension}`;
  try {
    const uploadUrl = await createR2UploadUrl(key, contentType);
    return NextResponse.json({
      uploadUrl,
      key,
      path: `r2:${key}`,
      url: r2PublicUrl(key),
      type: isVideo ? "video" : "image",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Yükleme bağlantısı oluşturulamadı." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body: { paths?: unknown[]; path?: unknown } = await request.json();
  const paths = (Array.isArray(body.paths) ? body.paths : [body.path])
    .map((value) => String(value || ""))
    .filter((value) => value.startsWith("r2:"))
    .map((value) => value.slice(3));
  if (!paths.length) return NextResponse.json({ error: "Geçersiz medya yolu." }, { status: 400 });
  try {
    await deleteR2Keys(paths);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Medya silinemedi." }, { status: 500 });
  }
}
