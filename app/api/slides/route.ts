import { NextResponse } from "next/server";
import { readStoredSlides } from "../../../lib/slider-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const slides = await readStoredSlides();
  return NextResponse.json(
    { slides },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
  );
}

