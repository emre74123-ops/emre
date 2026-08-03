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
      phone: String(user.user_metadata?.phone || user.phone || ""),
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
      withPhone: members.filter((member) => member.phone).length,
    },
  });
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  if (!userId) {
    return NextResponse.json({ error: "Silinecek üye belirtilmedi." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: adminRow, error: adminLookupError } = await adminClient
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminLookupError) {
    return NextResponse.json({ error: adminLookupError.message }, { status: 500 });
  }
  if (adminRow) {
    return NextResponse.json({ error: "Yönetici hesabı bu bölümden silinemez." }, { status: 403 });
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message || "Üyelik silinemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
