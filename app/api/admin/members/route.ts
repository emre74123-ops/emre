import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  return Boolean(data);
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const adminClient = createAdminClient();
  const [{ data: authData, error: authError }, { data: adminRows, error: adminError }] = await Promise.all([
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    adminClient.from("admins").select("user_id, role"),
  ]);

  if (authError || adminError) {
    return NextResponse.json({ error: authError?.message || adminError?.message || "Üyeler yüklenemedi." }, { status: 500 });
  }

  const adminIds = new Set((adminRows || []).map((row) => row.user_id));
  const members = authData.users
    .filter((user) => !adminIds.has(user.id))
    .map((user) => ({
      id: user.id,
      name: String(user.user_metadata?.full_name || user.user_metadata?.name || ""),
      email: user.email || "",
      provider: user.app_metadata?.provider || "email",
      providers: Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : [],
      emailConfirmed: Boolean(user.email_confirmed_at),
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at || null,
    }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return NextResponse.json({
    members,
    summary: {
      total: members.length,
      confirmed: members.filter((member) => member.emailConfirmed).length,
      social: members.filter((member) => member.provider !== "email").length,
    },
  });
}
