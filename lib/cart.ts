export type CartItem = {
  id: string;
  projectId?: string;
  project: string;
  amount: number;
  quantity: number;
  pricingVersion?: number;
  selections?: Array<{ group: string; option: string }>;
};

export const CART_STORAGE_KEY = "iyilik-adresim-cart-v2";
export const CART_MAX_QUANTITY = 10_000;
const LEGACY_CART_STORAGE_KEY = "iyilik-adresim-cart-v1";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || window.localStorage.getItem(LEGACY_CART_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): CartItem[] => {
      const amount = Number(item?.amount);
      const quantity = Number(item?.quantity);
      if (!item?.id || !item?.project || !Number.isFinite(amount) || amount <= 0) return [];
      return [{
        id: String(item.id),
        projectId: item?.projectId ? String(item.projectId).slice(0, 100) : undefined,
        project: String(item.project).slice(0, 120),
        amount: Math.round(amount * 100) / 100,
        quantity: Number.isFinite(quantity) ? Math.min(CART_MAX_QUANTITY, Math.max(1, Math.round(quantity))) : 1,
        pricingVersion: Number(item?.pricingVersion) === 2 ? 2 : undefined,
        selections: Array.isArray(item?.selections)
          ? item.selections.slice(0, 12).flatMap((selection: unknown) => {
              if (!selection || typeof selection !== "object") return [];
              const candidate = selection as { group?: unknown; option?: unknown };
              const group = String(candidate.group || "").trim().slice(0, 80);
              const option = String(candidate.option || "").trim().slice(0, 120);
              return group && option ? [{ group, option }] : [];
            })
          : undefined,
      }];
    });
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private mode; the in-memory cart still works.
  }
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.amount * item.quantity, 0);
}

export function formatTry(amount: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(amount);
}
