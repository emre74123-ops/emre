import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import {
  createR2UploadUrl,
  deleteR2Keys,
  headR2Object,
  listR2Objects,
  r2PublicUrl,
  type R2ObjectSummary,
} from "../../../../../lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const devices = ["desktop", "mobile"] as const;
type Device = (typeof devices)[number];

const contentType = "image/webp";
const cacheControl = "public, max-age=31536000, immutable";
const maxOptimizedSize = 2 * 1024 * 1024;
const maxOriginalSize = 50 * 1024 * 1024;
const maxDimension = 4096;
const categoryKeyPattern =
  /^modules\/donation\/categories\/(desktop|mobile)\/[a-z0-9][a-z0-9._-]*\.webp$/i;

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  return Boolean(data);
}

function isDevice(value: unknown): value is Device {
  return devices.includes(value as Device);
}

function prefixFor(device: Device) {
  return `modules/donation/categories/${device}/`;
}

function positiveInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function encodeOriginalName(value: string) {
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 180);
  try {
    return encodeURIComponent(clean);
  } catch {
    return "gorsel.webp";
  }
}

function decodeOriginalName(value: string | undefined) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function metadataNumber(value: string | undefined) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeCategoryKey(value: unknown) {
  const path = String(value || "").trim();
  return path.startsWith("r2:") ? path.slice(3) : path;
}

async function describeObject(summary: R2ObjectSummary, device: Device) {
  try {
    const details = await headR2Object(summary.key);
    const metadata = details.metadata;
    return {
      key: summary.key,
      path: `r2:${summary.key}`,
      url: r2PublicUrl(summary.key),
      device,
      size: details.size || summary.size,
      createdAt: (details.lastModified || summary.lastModified)?.toISOString() || null,
      contentType: details.contentType || null,
      width: metadataNumber(metadata.width),
      height: metadataNumber(metadata.height),
      originalSize: metadataNumber(metadata.originalsize),
      originalName: decodeOriginalName(metadata.originalname),
    };
  } catch {
    return {
      key: summary.key,
      path: `r2:${summary.key}`,
      url: r2PublicUrl(summary.key),
      device,
      size: summary.size,
      createdAt: summary.lastModified?.toISOString() || null,
      contentType: null,
      width: null,
      height: null,
      originalSize: null,
      originalName: null,
    };
  }
}

async function listDeviceImages(device: Device) {
  const objects = (await listR2Objects(prefixFor(device)))
    .filter((object) => categoryKeyPattern.test(object.key));
  const images = [];
  for (let index = 0; index < objects.length; index += 20) {
    images.push(...await Promise.all(
      objects.slice(index, index + 20).map((object) => describeObject(object, device)),
    ));
  }
  return images;
}

export async function GET(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const requestedDevice = new URL(request.url).searchParams.get("device") || "all";
  if (requestedDevice !== "all" && !isDevice(requestedDevice)) {
    return NextResponse.json({ error: "Geçersiz cihaz seçimi." }, { status: 400 });
  }

  try {
    const selectedDevices = requestedDevice === "all"
      ? [...devices]
      : [requestedDevice as Device];
    const groups = await Promise.all(selectedDevices.map(async (device) => ({
      device,
      images: await listDeviceImages(device),
    })));
    const images = groups
      .flatMap((group) => group.images)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    return NextResponse.json(
      { images },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Kategori görselleri alınamadı.",
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let body: {
    device?: unknown;
    contentType?: unknown;
    size?: unknown;
    width?: unknown;
    height?: unknown;
    originalSize?: unknown;
    originalName?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz yükleme bilgisi." }, { status: 400 });
  }

  if (!isDevice(body.device)) {
    return NextResponse.json({ error: "Web veya mobil görünüm seçilmelidir." }, { status: 400 });
  }
  if (String(body.contentType || "").toLowerCase() !== contentType) {
    return NextResponse.json({
      error: "Görsel tarayıcıda optimize edilip WebP biçimine dönüştürülmelidir.",
    }, { status: 400 });
  }

  const size = positiveInteger(body.size);
  const width = positiveInteger(body.width);
  const height = positiveInteger(body.height);
  const originalSize = positiveInteger(body.originalSize);
  const originalName = String(body.originalName || "").trim();

  if (!size || size > maxOptimizedSize) {
    return NextResponse.json({
      error: "Optimize edilmiş WebP görseli en fazla 2 MB olabilir.",
    }, { status: 400 });
  }
  if (!width || !height || width > maxDimension || height > maxDimension) {
    return NextResponse.json({
      error: "Görsel ölçüleri 1 ile 4096 piksel arasında olmalıdır.",
    }, { status: 400 });
  }
  if (!originalSize || originalSize > maxOriginalSize) {
    return NextResponse.json({
      error: "Orijinal görsel en fazla 50 MB olabilir.",
    }, { status: 400 });
  }
  if (!originalName || originalName.length > 180) {
    return NextResponse.json({ error: "Geçerli bir dosya adı gereklidir." }, { status: 400 });
  }

  const key = `${prefixFor(body.device)}${crypto.randomUUID()}.webp`;
  const metadata = {
    device: body.device,
    width: String(width),
    height: String(height),
    originalsize: String(originalSize),
    originalname: encodeOriginalName(originalName),
    optimizedsize: String(size),
    format: "webp",
  };

  try {
    const uploadUrl = await createR2UploadUrl(key, contentType, {
      metadata,
      cacheControl,
      expiresInSeconds: 300,
    });
    return NextResponse.json({
      uploadUrl,
      expiresIn: 300,
      key,
      path: `r2:${key}`,
      url: r2PublicUrl(key),
      device: body.device,
      contentType,
      requiredHeaders: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Yükleme bağlantısı oluşturulamadı.",
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let body: {
    paths?: unknown[];
    keys?: unknown[];
    path?: unknown;
    key?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz silme bilgisi." }, { status: 400 });
  }

  const values = [
    ...(Array.isArray(body.paths) ? body.paths : []),
    ...(Array.isArray(body.keys) ? body.keys : []),
    body.path,
    body.key,
  ].filter((value) => value !== undefined && value !== null && value !== "");
  const keys = [...new Set(values.map(normalizeCategoryKey))];

  if (!keys.length || keys.some((key) => !categoryKeyPattern.test(key))) {
    return NextResponse.json({ error: "Geçersiz kategori görseli yolu." }, { status: 400 });
  }

  try {
    await deleteR2Keys(keys);
    return NextResponse.json({ success: true, deleted: keys.length, keys });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Kategori görseli silinemedi.",
    }, { status: 500 });
  }
}
