export type CartItem = {
  id: string;
  project: string;
  amount: number;
  quantity: number;
};

export const CART_STORAGE_KEY = "iyilik-adresim-cart-v1";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): CartItem[] => {
      const amount = Number(item?.amount);
      const quantity = Number(item?.quantity);
      if (!item?.id || !item?.project || !Number.isFinite(amount) || amount <= 0) return [];
      return [{
        id: String(item.id),
        project: String(item.project).slice(0, 120),
        amount: Math.round(amount * 100) / 100,
        quantity: Number.isFinite(quantity) ? Math.min(99, Math.max(1, Math.round(quantity))) : 1,
      }];
    });
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.amount * item.quantity, 0);
}

export function formatTry(amount: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(amount);
}
