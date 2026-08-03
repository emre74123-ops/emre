export type HeaderMenuItem = {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  newTab: boolean;
  sourcePageId?: string;
  mobileIcon?: string;
  mobileIconBg?: string;
  mobileDescription?: string;
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
  mobileMenuItems: HeaderMenuItem[];
  mobileMenuLayout: "dropdown" | "drawer";
  mobileMenuAnimation: "slide" | "fade";
  mobileMenuLogoUrl: string;
  mobileMenuBackgroundColor: string;
  mobileMenuTextColor: string;
  mobileMenuAccentColor: string;
  mobileMenuFontSize: number;
  mobileMenuTitleColor: string;
  mobileMenuTitleSize: number;
  mobileMenuDescriptionColor: string;
  mobileMenuDescriptionSize: number;
  mobileMenuActiveTextColor: string;
  mobileMenuActiveBorderColor: string;
  mobileMenuFontWeight: number;
  mobileMenuGap: number;
  mobileMenuShowNumbers: boolean;
  mobileMenuShowAccount: boolean;
  mobileMenuShowSupport: boolean;
  mobileMenuShowContact: boolean;
  mobileMenuDescription: string;
  mobileMenuInstagram: string;
  mobileMenuFacebook: string;
  mobileMenuX: string;
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
  mobileMenuItems: [
    { id: "mobile-projects", label: "Projelerimiz", href: "#projeler", enabled: true, newTab: false, mobileDescription: "Yardım ve iyilik projelerimizi keşfedin" },
    { id: "mobile-about", label: "Biz Kimiz?", href: "#hakkimizda", enabled: true, newTab: false, mobileDescription: "Bizi ve çalışma ilkelerimizi tanıyın" },
    { id: "mobile-transparency", label: "Şeffaflık", href: "#seffaflik", enabled: true, newTab: false, mobileDescription: "Faaliyet ve şeffaflık bilgilerimiz" },
    { id: "mobile-stories", label: "İyilik Hikâyeleri", href: "#hikayeler", enabled: true, newTab: false, mobileDescription: "İyiliğin umut veren hikâyeleri" },
    { id: "mobile-contact", label: "İletişim", href: "#iletisim", enabled: true, newTab: false, mobileDescription: "Bizimle iletişime geçin" },
  ],
  mobileMenuLayout: "dropdown",
  mobileMenuAnimation: "slide",
  mobileMenuLogoUrl: "",
  mobileMenuBackgroundColor: "#f3f7f6",
  mobileMenuTextColor: "#173b35",
  mobileMenuAccentColor: "#ed7048",
  mobileMenuFontSize: 28,
  mobileMenuTitleColor: "#173b35",
  mobileMenuTitleSize: 16,
  mobileMenuDescriptionColor: "#607c76",
  mobileMenuDescriptionSize: 12,
  mobileMenuActiveTextColor: "#128465",
  mobileMenuActiveBorderColor: "#128465",
  mobileMenuFontWeight: 600,
  mobileMenuGap: 9,
  mobileMenuShowNumbers: true,
  mobileMenuShowAccount: true,
  mobileMenuShowSupport: true,
  mobileMenuShowContact: true,
  mobileMenuDescription: "İyiliğin güvenilir ve şeffaf adresi.",
  mobileMenuInstagram: "",
  mobileMenuFacebook: "",
  mobileMenuX: "",
};
