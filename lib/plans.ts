// Single flat price per email: ₦480 one-time (~$0.30)
// Monthly renewal is slightly cheaper to encourage subscriptions
export const PRICE_PER_EMAIL_KOBO = 48000;        // ₦480 one-time
export const MONTHLY_PRICE_PER_EMAIL_KOBO = 35000; // ₦350/month

// Quantity bundles — buying more saves money
export const QUANTITY_OPTIONS = [
  { qty: 1,  label: "1 email",   discountPct: 0 },
  { qty: 3,  label: "3 emails",  discountPct: 5 },   // 5% off → ₦1,368 instead of ₦1,440
  { qty: 5,  label: "5 emails",  discountPct: 10 },  // 10% off → ₦2,160 instead of ₦2,400
  { qty: 10, label: "10 emails", discountPct: 15 },  // 15% off → ₦4,080 instead of ₦4,800
] as const;

export type Qty = (typeof QUANTITY_OPTIONS)[number]["qty"];

export function getBundlePrice(qty: number, billingType: "ONE_TIME" | "MONTHLY") {
  const basePerEmail =
    billingType === "ONE_TIME" ? PRICE_PER_EMAIL_KOBO : MONTHLY_PRICE_PER_EMAIL_KOBO;
  const option = QUANTITY_OPTIONS.find((o) => o.qty === qty) ?? QUANTITY_OPTIONS[0];
  const total = basePerEmail * qty;
  const discount = Math.floor((total * option.discountPct) / 100);
  return {
    total: total - discount,
    original: total,
    saved: discount,
    discountPct: option.discountPct,
    perEmail: Math.floor((total - discount) / qty),
  };
}

// Legacy plan list kept for dashboard display
export const PLANS = [
  {
    slug: "standard",
    name: "Standard",
    monthlyPriceKobo: MONTHLY_PRICE_PER_EMAIL_KOBO,
    oneTimePriceKobo: PRICE_PER_EMAIL_KOBO,
    storageGb: 10,
    description: "10 GB per email account",
  },
] as const;

export type PlanSlug = (typeof PLANS)[number]["slug"];

export function getPlanBySlug(slug: string) {
  return PLANS.find((p) => p.slug === slug) ?? null;
}

export function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}
