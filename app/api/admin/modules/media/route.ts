import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createR2UploadUrl, deleteR2Keys, headR2Object, r2PublicUrl } from "../../../../../lib/r2";

const imageType = "image/webp";
const videoType = "video/mp4";
const maxImageSize = 5 * 1024 * 1024;
const maxVideoSize = 150 * 1024 * 1024;
const maxDimension = 8192;
const cacheControl = "public, max-age=31536000, immutable";
const projectMediaKeyPattern = /^modules\/donation\/projects\/([a-z0-9-]+)\/(desktop|mobile)\/(media|poster)\/[a-z0-9][a-z0-9-]{0,127}\.(webp|png|jpe?g|avif|mp4)$/i;

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

function optionalPositiveInteger(value: unknown, max: number) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= max ? number : null;
}

function cleanOriginalName(value: unknown) {
  const name = String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 180);
  return name || undefined;
}

function cleanOwnedMediaKey(value: unknown) {
  const path = String(value || "");
  const key = path.startsWith("r2:") ? path.slice(3) : path;
  return projectMediaKeyPattern.test(key) ? key : "";
}

export async function POST(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body: {
    action?: unknown;
    path?: unknown;
    projectId?: unknown;
    device?: unknown;
    contentType?: unknown;
    size?: unknown;
    width?: unknown;
    height?: unknown;
    originalName?: unknown;
    posterWidth?: unknown;
    posterHeight?: unknown;
    posterSize?: unknown;
    posterOriginalName?: unknown;
    purpose?: unknown;
  } = await request.json();
  if (body.action === "complete") {
    const key = cleanOwnedMediaKey(body.path);
    const expectedContentType = String(body.contentType || "").toLowerCase();
    const expectedSize = Number(body.size || 0);
    if (!key || ![imageType, videoType].includes(expectedContentType) || !Number.isFinite(expectedSize) || expectedSize <= 0) {
      return NextResponse.json({ error: "Geçersiz medya doğrulama isteği." }, { status: 400 });
    }
    try {
      const object = await headR2Object(key);
      const maxSize = expectedContentType === videoType ? maxVideoSize : maxImageSize;
      if (object.contentType !== expectedContentType || object.size !== expectedSize || object.size > maxSize) {
        await deleteR2Keys([key]);
        return NextResponse.json({ error: "Yüklenen dosyanın türü veya boyutu doğrulanamadı." }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        path: `r2:${key}`,
        url: r2PublicUrl(key),
        contentType: object.contentType,
        size: object.size,
      });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Yüklenen medya doğrulanamadı." }, { status: 500 });
    }
  }

  const projectId = cleanProjectId(body.projectId);
  const device = body.device === "mobile" ? "mobile" : "desktop";
  const contentType = String(body.contentType || "").toLowerCase();
  const purpose = body.purpose === "poster" ? "poster" : "media";
  const isImage = contentType === imageType;
  const isVideo = contentType === videoType;
  const size = Number(purpose === "poster" ? body.posterSize ?? body.size ?? 0 : body.size ?? 0);
  const width = optionalPositiveInteger(
    purpose === "poster" ? body.posterWidth ?? body.width : body.width,
    maxDimension,
  );
  const height = optionalPositiveInteger(
    purpose === "poster" ? body.posterHeight ?? body.height : body.height,
    maxDimension,
  );
  const originalName = cleanOriginalName(
    purpose === "poster" ? body.posterOriginalName ?? body.originalName : body.originalName,
  );

  if (!projectId) return NextResponse.json({ error: "Kart seçilmedi." }, { status: 400 });
  if (purpose === "poster" && !isImage) {
    return NextResponse.json({ error: "Video kapağı WebP biçiminde olmalıdır." }, { status: 400 });
  }
  if (purpose === "media" && !isImage && !isVideo) {
    return NextResponse.json({ error: "WebP görsel veya MP4 video yükleyin." }, { status: 400 });
  }
  const maxSize = isVideo ? maxVideoSize : maxImageSize;
  if (!Number.isFinite(size) || size <= 0 || size > maxSize) {
    return NextResponse.json({
      error: isVideo ? "Video en fazla 150 MB olabilir." : "Görsel en fazla 5 MB olabilir.",
    }, { status: 400 });
  }
  if (width === null || height === null) {
    return NextResponse.json({
      error: "Medya ölçüleri 1 ile 8192 piksel arasında olmalıdır.",
    }, { status: 400 });
  }

  const extension = isVideo ? "mp4" : contentType.split("/")[1].replace("jpeg", "jpg");
  const key = `modules/donation/projects/${projectId}/${device}/${purpose}/${crypto.randomUUID()}.${extension}`;
  try {
    const uploadUrl = await createR2UploadUrl(key, contentType, {
      cacheControl,
      metadata: {
        projectid: projectId,
        device,
        purpose,
        originalname: originalName || "",
        width: width ? String(width) : "",
        height: height ? String(height) : "",
        declaredsize: String(size),
      },
    });
    return NextResponse.json({
      uploadUrl,
      key,
      path: `r2:${key}`,
      url: r2PublicUrl(key),
      type: isVideo ? "video" : "image",
      purpose,
      width,
      height,
      size,
      originalName,
      ...(purpose === "poster" ? {
        posterWidth: width,
        posterHeight: height,
        posterSize: size,
        posterOriginalName: originalName,
      } : {}),
      requiredHeaders: { "Content-Type": contentType, "Cache-Control": cacheControl },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Yükleme bağlantısı oluşturulamadı." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body: { paths?: unknown[]; path?: unknown } = await request.json();
  const paths = (Array.isArray(body.paths) ? body.paths : [body.path])
    .map(cleanOwnedMediaKey)
    .filter(Boolean);
  if (!paths.length) return NextResponse.json({ error: "Geçersiz medya yolu." }, { status: 400 });
  try {
    await deleteR2Keys(paths);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Medya silinemedi." }, { status: 500 });
  }
}
