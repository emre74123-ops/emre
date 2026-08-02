
import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { defaultSlides } from "../../../lib/slides";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "homepage_slides").maybeSingle();
  const slides = Array.isArray(data?.value) ? data.value : defaultSlides;
  return NextResponse.json({ slides }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

