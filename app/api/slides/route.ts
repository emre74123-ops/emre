import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { defaultSlides } from "../../../lib/slides";
import { getSettingColumns, readSiteSetting } from "../../../lib/site-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const supabase = await createClient();
  if (new URL(request.url).searchParams.get("diagnostics") === "slider-schema-2026") {
    const result = await getSettingColumns(supabase);
    return NextResponse.json({
      keyColumn: result.keyColumn,
      valueColumn: result.valueColumn,
      error: result.error?.message || null,
    });
  }
  const { value, error } = await readSiteSetting(supabase, "homepage_slides");
  const slides = !error && Array.isArray(value) ? value : defaultSlides;
  return NextResponse.json(
    { slides },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
  );
}

