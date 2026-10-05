export type Region = "NG" | "INTL";
export type Currency = "NGN" | "USD";
export const currencyFor = (r: Region): Currency => (r === "NG" ? "NGN" : "USD");

const group = (n: string) => n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Amount is in kobo or cents. Written by hand so it doesn't depend on the phone's Intl support. */
export function formatMoney(minor: number, currency: Currency) {
  const major = minor / 100;
  if (currency === "NGN") return `₦${group(Math.round(major).toString())}`;
  const [whole, cents] = major.toFixed(2).split(".");
  return `$${group(whole)}${cents === "00" ? "" : `.${cents}`}`;
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  in_production: "Being made",
  ready: "Ready",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
