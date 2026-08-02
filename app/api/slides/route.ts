import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { defaultSlides } from "../../../lib/slides";
import { readSiteSetting } from "../../../lib/site-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await createClient();
  const { value, error } = await readSiteSetting(supabase, "homepage_slides");
  const slides = !error && Array.isArray(value) ? value : defaultSlides;
  return NextResponse.json(
    { slides },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
  );
}

