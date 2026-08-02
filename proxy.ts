
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isPublicAdminRoute = pathname.startsWith("/admin/login") || pathname.startsWith("/admin/set-password");

  if (!user && !isPublicAdminRoute) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (user && !isPublicAdminRoute) {
    const { data: admin } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
    if (!admin) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/admin/login?error=yetkisiz", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

