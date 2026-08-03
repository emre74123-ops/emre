export type HeaderMenuItem = {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  newTab: boolean;
};

export type HeaderSettings = {
  logoUrl: string;
  logoAlt: string;
  brandName: string;
  brandTagline: string;
  showBrandText: boolean;
  sticky: boolean;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  menuDesktopSize: number;
  menuMobileSize: number;
  menuFontWeight: number;
  menuGap: number;
  menuLetterSpacing: number;
  menuTextTransform: "none" | "uppercase";
  menuFontFamily: "sans" | "serif";
  menuAlignment: "start" | "center" | "end";
  menuHoverColor: string;
  menuActiveColor: string;
  menuUnderlineEnabled: boolean;
  menuUnderlineColor: string;
  menuUnderlineThickness: number;
  topBarEnabled: boolean;
  phone: string;
  email: string;
  accountEnabled: boolean;
  accountLabel: string;
  accountHref: string;
  supportEnabled: boolean;
  supportLabel: string;
  supportHref: string;
  menuItems: HeaderMenuItem[];
};

export const defaultHeaderSettings: HeaderSettings = {
  logoUrl: "",
  logoAlt: "İyilik Adresim logosu",
  brandName: "İyilik",
  brandTagline: "Adresim",
  showBrandText: true,
  sticky: true,
  backgroundColor: "#fffdf8",
  textColor: "#173b35",
  accentColor: "#ed7048",
  menuDesktopSize: 15,
  menuMobileSize: 16,
  menuFontWeight: 700,
  menuGap: 30,
  menuLetterSpacing: 0,
  menuTextTransform: "none",
  menuFontFamily: "sans",
  menuAlignment: "center",
  menuHoverColor: "#ed7048",
  menuActiveColor: "#128465",
  menuUnderlineEnabled: true,
  menuUnderlineColor: "#ed7048",
  menuUnderlineThickness: 2,
  topBarEnabled: false,
  phone: "",
  email: "merhaba@iyilikadresim.org",
  accountEnabled: true,
  accountLabel: "Üye Girişi",
  accountHref: "#uye-girisi",
  supportEnabled: true,
  supportLabel: "Destek Ol",
  supportHref: "#destek",
  menuItems: [
    { id: "projects", label: "Projelerimiz", href: "#projeler", enabled: true, newTab: false },
    { id: "about", label: "Biz Kimiz?", href: "#hakkimizda", enabled: true, newTab: false },
    { id: "transparency", label: "Şeffaflık", href: "#seffaflik", enabled: true, newTab: false },
    { id: "stories", label: "İyilik Hikâyeleri", href: "#hikayeler", enabled: true, newTab: false },
    { id: "contact", label: "İletişim", href: "#iletisim", enabled: true, newTab: false },
  ],
};
