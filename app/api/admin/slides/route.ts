import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";
import { type Slide } from "../../../../lib/slides";
import { readStoredSlides, writeStoredSlides } from "../../../../lib/slider-storage";

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
  const slides = await readStoredSlides();
  return NextResponse.json({ slides });
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
    desktopImage: String(slide.desktopImage || "").slice(0, 1000),
    mobileImage: String(slide.mobileImage || slide.desktopImage || "").slice(0, 1000),
    active: Boolean(slide.active),
  })) : [];
  const { error } = await writeStoredSlides(slides);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/api/slides");
  return NextResponse.json({ slides });
}

