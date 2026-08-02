import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { defaultSlides } from "../../../lib/slides";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("setting_value")
    .eq("setting_key", "homepage_slides")
    .maybeSingle();
  const slides = !error && Array.isArray(data?.setting_value) ? data.setting_value : defaultSlides;
  return NextResponse.json(
    { slides },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
  );
}

