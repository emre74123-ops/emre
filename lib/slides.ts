
export type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  desktopImage: string;
  mobileImage: string;
  active: boolean;
};

export const defaultSlides: Slide[] = [
  {
    id: "iyilik",
    eyebrow: "İyiliğin adresi belli",
    title: "Bir iyilik,",
    highlight: "bir hayatı değiştirir.",
    description: "İhtiyacı, iyilik yapmak isteyenlerle şeffaf ve güvenilir bir zeminde buluşturuyoruz.",
    buttonText: "İyiliğe Ortak Ol",
    buttonLink: "#destek",
    desktopImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=2200&q=90",
    mobileImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&h=1400&q=88",
    active: true,
  },
  {
    id: "egitim",
    eyebrow: "Geleceğe birlikte",
    title: "Her çocuk,",
    highlight: "iyi bir başlangıcı hak eder.",
    description: "Eğitim desteğiyle çocukların hayallerine uzanan yolu birlikte açıyoruz.",
    buttonText: "Projeleri Keşfet",
    buttonLink: "#projeler",
    desktopImage: "https://images.unsplash.com/photo-1504159506876-f8338247a14a?auto=format&fit=crop&w=2200&q=90",
    mobileImage: "https://images.unsplash.com/photo-1504159506876-f8338247a14a?auto=format&fit=crop&w=900&h=1400&q=88",
    active: true,
  },
  {
    id: "dayanisma",
    eyebrow: "Dayanışma büyütür",
    title: "Birlikte daha",
    highlight: "güçlü ve umutluyuz.",
    description: "Kalıcı sosyal etki için güvenilir, ölçülebilir ve insan odaklı projeler geliştiriyoruz.",
    buttonText: "Bizi Tanıyın",
    buttonLink: "#hakkimizda",
    desktopImage: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=2200&q=90",
    mobileImage: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&h=1400&q=88",
    active: true,
  },
];

