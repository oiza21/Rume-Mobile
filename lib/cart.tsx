import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { api, type CartLine, type MeasurementSet } from "./api";
import { useAuth } from "./auth";
import { currencyFor, type Currency, type Region } from "./format";
import { supabase } from "./supabase";

type CartState = {
  items: CartLine[];
  loading: boolean;
  /** "live" when instant sync is connected. */
  sync: "off" | "connecting" | "live";
  region: Region;
  currency: Currency;
  setRegion: (r: Region) => void;
  refresh: () => Promise<void>;
  add: (slug: string, measurements: MeasurementSet) => Promise<void>;
  setQuantity: (id: string, quantity: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  priceOf: (p: { priceNgn: number; priceUsd: number }) => number;
  total: number;
  count: number;
};

const Ctx = createContext<CartState | null>(null);
const REGION_KEY = "rume.region";

/**
 * The bag lives on the server (the website's /api/cart), so it's the same bag
 * on web and mobile. Supabase Realtime pushes changes from the website within
 * a second; the bag also refreshes whenever the app comes back to the front
 * or the Bag tab is opened.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [items, setItems] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [sync, setSync] = useState<CartState["sync"]>("off");
  const [region, setRegionState] = useState<Region>("NG");
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    AsyncStorage.getItem(REGION_KEY).then((r) => (r === "NG" || r === "INTL") && setRegionState(r));
  }, []);
  const setRegion = (r: Region) => {
    setRegionState(r);
    AsyncStorage.setItem(REGION_KEY, r);
  };

  const refresh = useCallback(async () => {
    if (!userId) return setItems([]);
    setLoading(true);
    try {
      const { items } = await api<{ items: CartLine[] }>("/api/cart");
      setItems(items);
    } catch (e) {
      console.warn("[cart] refresh failed", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load when signing in; clear when signing out.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Instant sync.
  useEffect(() => {
    if (!userId) {
      setSync("off");
      return;
    }
    setSync("connecting");
    const channel = supabase
      .channel(`cart-mobile-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cart_items", filter: `user_id=eq.${userId}` }, () => refresh())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "cart_items", filter: `user_id=eq.${userId}` }, () => refresh())
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "cart_items" }, (payload) => {
        const id = (payload.old as { id?: string }).id;
        if (!id || itemsRef.current.some((i) => i.id === id)) refresh();
      })
      .subscribe((status) => setSync(status === "SUBSCRIBED" ? "live" : status === "CLOSED" ? "off" : "connecting"));

    // Fallback: refresh when the app returns to the foreground.
    const sub = AppState.addEventListener("change", (s) => s === "active" && refresh());
    return () => {
      supabase.removeChannel(channel);
      sub.remove();
    };
  }, [userId, refresh]);

  const priceOf = useCallback((p: { priceNgn: number; priceUsd: number }) => (region === "NG" ? p.priceNgn : p.priceUsd), [region]);

  const value = useMemo<CartState>(
    () => ({
      items,
      loading,
      sync,
      region,
      currency: currencyFor(region),
      setRegion,
      refresh,
      add: async (slug, measurements) => {
        const { items } = await api<{ items: CartLine[] }>("/api/cart", { method: "POST", body: JSON.stringify({ slug, quantity: 1, measurements }) });
        setItems(items);
      },
      setQuantity: async (id, quantity) => {
        setItems((xs) => xs.map((x) => (x.id === id ? { ...x, quantity } : x)));
        const { items } = await api<{ items: CartLine[] }>(`/api/cart/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
        setItems(items);
      },
      remove: async (id) => {
        setItems((xs) => xs.filter((x) => x.id !== id));
        const { items } = await api<{ items: CartLine[] }>(`/api/cart/${id}`, { method: "DELETE" });
        setItems(items);
      },
      priceOf,
      total: items.reduce((s, i) => s + priceOf(i) * i.quantity, 0),
      count: items.reduce((n, i) => n + i.quantity, 0),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, loading, sync, region, refresh, priceOf],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}
