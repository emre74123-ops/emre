import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";
import { defaultSlides, type Slide } from "../../../../lib/slides";

async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: admin } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  return admin ? supabase : null;
}

export async function GET() {
  const supabase = await getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { data, error } = await supabase
    .from("site_settings")
    .select("setting_value")
    .eq("setting_key", "homepage_slides")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slides: Array.isArray(data?.setting_value) ? data.setting_value : defaultSlides });
}

export async function PUT(request: Request) {
  const supabase = await getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await request.json();
  const slides = Array.isArray(body.slides) ? body.slides.slice(0, 8).map((slide: Slide) => ({
    id: String(slide.id || crypto.randomUUID()),
    eyebrow: String(slide.eyebrow || "").slice(0, 60),
    title: String(slide.title || "").slice(0, 90),
    highlight: String(slide.highlight || "").slice(0, 90),
    description: String(slide.description || "").slice(0, 240),
    buttonText: String(slide.buttonText || "").slice(0, 40),
    buttonLink: String(slide.buttonLink || "#projeler").slice(0, 200),
    buttonEnabled: slide.buttonEnabled !== false,
    desktopButtonPosition: String(slide.desktopButtonPosition || "bottom-left"),
    mobileButtonPosition: String(slide.mobileButtonPosition || "bottom-center"),
    buttonStyle: String(slide.buttonStyle || "rounded"),
    buttonSize: String(slide.buttonSize || "medium"),
    buttonFont: String(slide.buttonFont || "sans"),
    buttonColor: /^#[0-9a-f]{6}$/i.test(String(slide.buttonColor)) ? String(slide.buttonColor) : "#128465",
    buttonTextColor: /^#[0-9a-f]{6}$/i.test(String(slide.buttonTextColor)) ? String(slide.buttonTextColor) : "#ffffff",
    desktopImage: String(slide.desktopImage || "").slice(0, 1000),
    mobileImage: String(slide.mobileImage || slide.desktopImage || "").slice(0, 1000),
    active: Boolean(slide.active),
  })) : [];
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { setting_key: "homepage_slides", setting_value: slides },
      { onConflict: "setting_key" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/api/slides");
  return NextResponse.json({ slides });
}

