import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { defaultHeaderSettings, type HeaderMenuItem, type HeaderSettings } from "../../../../lib/header-settings";
import { readHeaderSettings, writeHeaderSettings } from "../../../../lib/header-storage";
import { createClient } from "../../../../lib/supabase/server";

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: admin } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  return Boolean(admin);
}

function safeColor(value: unknown, fallback: string) {
  const color = String(value || "");
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function safeLink(value: unknown, fallback = "#") {
  const link = String(value || "").trim().slice(0, 500);
  return /^(#|\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(link) ? link : fallback;
}

function safeNumber(value: unknown, minimum: number, maximum: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

function cleanSettings(input: Partial<HeaderSettings>): HeaderSettings {
  const menuItems = Array.isArray(input.menuItems)
    ? input.menuItems.slice(0, 10).map((item: HeaderMenuItem) => ({
        id: String(item.id || crypto.randomUUID()).slice(0, 80),
        label: String(item.label || "Menü").trim().slice(0, 40),
        href: safeLink(item.href),
        enabled: Boolean(item.enabled),
        newTab: Boolean(item.newTab),
      }))
    : defaultHeaderSettings.menuItems;
  const mobileMenuItems = Array.isArray(input.mobileMenuItems)
    ? input.mobileMenuItems.slice(0, 10).map((item: HeaderMenuItem) => ({
        id: String(item.id || crypto.randomUUID()).slice(0, 80),
        label: String(item.label || "Menü").trim().slice(0, 40),
        href: safeLink(item.href),
        enabled: Boolean(item.enabled),
        newTab: Boolean(item.newTab),
        sourcePageId: item.sourcePageId ? String(item.sourcePageId).slice(0, 80) : undefined,
        mobileIcon: String(item.mobileIcon || "home").slice(0, 30),
        mobileIconBg: safeColor(item.mobileIconBg, "#4f86df"),
      }))
    : defaultHeaderSettings.mobileMenuItems;

  return {
    logoUrl: safeLink(input.logoUrl, ""),
    logoAlt: String(input.logoAlt || defaultHeaderSettings.logoAlt).trim().slice(0, 100),
    brandName: String(input.brandName || defaultHeaderSettings.brandName).trim().slice(0, 40),
    brandTagline: String(input.brandTagline || defaultHeaderSettings.brandTagline).trim().slice(0, 40),
    showBrandText: Boolean(input.showBrandText),
    sticky: Boolean(input.sticky),
    backgroundColor: safeColor(input.backgroundColor, defaultHeaderSettings.backgroundColor),
    textColor: safeColor(input.textColor, defaultHeaderSettings.textColor),
    accentColor: safeColor(input.accentColor, defaultHeaderSettings.accentColor),
    menuDesktopSize: safeNumber(input.menuDesktopSize, 11, 22, defaultHeaderSettings.menuDesktopSize),
    menuMobileSize: safeNumber(input.menuMobileSize, 12, 24, defaultHeaderSettings.menuMobileSize),
    menuFontWeight: safeNumber(input.menuFontWeight, 400, 900, defaultHeaderSettings.menuFontWeight),
    menuGap: safeNumber(input.menuGap, 8, 55, defaultHeaderSettings.menuGap),
    menuLetterSpacing: safeNumber(input.menuLetterSpacing, -1, 4, defaultHeaderSettings.menuLetterSpacing),
    menuTextTransform: input.menuTextTransform === "uppercase" ? "uppercase" : "none",
    menuFontFamily: input.menuFontFamily === "serif" ? "serif" : "sans",
    menuAlignment: ["start", "center", "end"].includes(String(input.menuAlignment)) ? input.menuAlignment as HeaderSettings["menuAlignment"] : "center",
    menuHoverColor: safeColor(input.menuHoverColor, defaultHeaderSettings.menuHoverColor),
    menuActiveColor: safeColor(input.menuActiveColor, defaultHeaderSettings.menuActiveColor),
    menuUnderlineEnabled: Boolean(input.menuUnderlineEnabled),
    menuUnderlineColor: safeColor(input.menuUnderlineColor, defaultHeaderSettings.menuUnderlineColor),
    menuUnderlineThickness: safeNumber(input.menuUnderlineThickness, 1, 5, defaultHeaderSettings.menuUnderlineThickness),
    topBarEnabled: Boolean(input.topBarEnabled),
    phone: String(input.phone || "").trim().slice(0, 30),
    email: String(input.email || "").trim().slice(0, 120),
    accountEnabled: Boolean(input.accountEnabled),
    accountLabel: String(input.accountLabel || "Üye Girişi").trim().slice(0, 30),
    accountHref: safeLink(input.accountHref, "#uye-girisi"),
    supportEnabled: Boolean(input.supportEnabled),
    supportLabel: String(input.supportLabel || "Destek Ol").trim().slice(0, 30),
    supportHref: safeLink(input.supportHref, "#destek"),
    menuItems,
    mobileMenuItems,
    mobileMenuLayout: input.mobileMenuLayout === "drawer" ? "drawer" : "dropdown",
    mobileMenuAnimation: input.mobileMenuAnimation === "fade" ? "fade" : "slide",
    mobileMenuLogoUrl: safeLink(input.mobileMenuLogoUrl, ""),
    mobileMenuBackgroundColor: safeColor(input.mobileMenuBackgroundColor, defaultHeaderSettings.mobileMenuBackgroundColor),
    mobileMenuTextColor: safeColor(input.mobileMenuTextColor, defaultHeaderSettings.mobileMenuTextColor),
    mobileMenuAccentColor: safeColor(input.mobileMenuAccentColor, defaultHeaderSettings.mobileMenuAccentColor),
    mobileMenuFontSize: safeNumber(input.mobileMenuFontSize, 18, 40, defaultHeaderSettings.mobileMenuFontSize),
    mobileMenuFontWeight: safeNumber(input.mobileMenuFontWeight, 400, 900, defaultHeaderSettings.mobileMenuFontWeight),
    mobileMenuGap: safeNumber(input.mobileMenuGap, 0, 25, defaultHeaderSettings.mobileMenuGap),
    mobileMenuShowNumbers: Boolean(input.mobileMenuShowNumbers),
    mobileMenuShowAccount: Boolean(input.mobileMenuShowAccount),
    mobileMenuShowSupport: Boolean(input.mobileMenuShowSupport),
    mobileMenuShowContact: Boolean(input.mobileMenuShowContact),
    mobileMenuDescription: String(input.mobileMenuDescription || "").trim().slice(0, 160),
    mobileMenuInstagram: safeLink(input.mobileMenuInstagram, ""),
    mobileMenuFacebook: safeLink(input.mobileMenuFacebook, ""),
    mobileMenuX: safeLink(input.mobileMenuX, ""),
  };
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  return NextResponse.json({ settings: await readHeaderSettings() });
}

export async function PUT(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const settings = cleanSettings(await request.json());
  const { error } = await writeHeaderSettings(settings);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  return NextResponse.json({ settings });
}
