
import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: admin } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  return admin ? { supabase, user } : null;
}

export async function GET() {
  const client = await getAdminClient();
  if (!client) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { data, error } = await client.supabase.from("campaigns").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

export async function POST(request: Request) {
  const client = await getAdminClient();
  if (!client) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Kampanya adı zorunludur." }, { status: 400 });
  const slugBase = title.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data, error } = await client.supabase.from("campaigns").insert({
    title,
    slug: `${slugBase}-${Date.now().toString().slice(-6)}`,
    category: String(body.category || "Genel"),
    description: String(body.description || ""),
    target_amount: Number(body.target_amount || 0),
    status: "draft",
    created_by: client.user.id,
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}

