import { API_URL } from "./config";
import { supabase } from "./supabase";

export type Unit = "cm" | "in";
export type MeasurementSet = { unit: Unit; values: Record<string, number>; notes?: string };
export type MeasurementField = { key: string; label: string; hint: string };

export type Product = {
  slug: string;
  name: string;
  collection: string;
  category: string;
  garment: string;
  summary: string;
  description: string;
  fabric: string;
  colour: string;
  techniques: string[];
  focus: string;
  priceNgn: number;
  priceUsd: number;
  leadTimeDays: number;
  images: { src: string; label: string }[];
  featured?: boolean;
};

export type CartLine = {
  id: string;
  slug: string;
  name: string;
  image: string;
  garment: string;
  priceNgn: number;
  priceUsd: number;
  leadTimeDays: number;
  quantity: number;
  measurements: MeasurementSet;
};

export type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency: "NGN" | "USD";
  created_at: string;
  tracking_number: string | null;
  carrier: string | null;
  order_items: { name: string; quantity: number }[];
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Website images may be relative paths like /images/x.jpg. */
export const imageUrl = (src: string) => (!src ? "" : src.startsWith("http") ? src : `${API_URL}${src}`);

/**
 * Calls the website's API. When signed in, the Supabase access token is sent
 * as a Bearer token, so the website knows it's the same account.
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((json as { error?: string }).error ?? `Request failed (${res.status})`, res.status);
  return json as T;
}
