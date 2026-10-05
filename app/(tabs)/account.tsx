import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Body, Button, Display, Notice } from "@/components/ui";
import { api, type Order } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney, STATUS_LABEL } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";

const STAGES = ["paid", "in_production", "ready", "shipped", "delivered"];

export default function Account() {
  const { session, loading, signInWithGoogle, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!session) return;
    try {
      const { orders } = await api<{ orders: Order[] }>("/api/me/orders");
      setOrders(orders);
    } catch {
      /* shown as empty */
    }
  }, [session]);

  useFocusEffect(useCallback(() => { loadOrders(); }, [loadOrders]));

  if (loading) return null;

  if (!session) {
    return (
      <View style={{ padding: 20, gap: 14 }}>
        <Display>Sign in</Display>
        <Body>Use the same Google account as on the website. Your bag, saved measurements and orders are shared between the two.</Body>
        {error && <Notice tone="error">{error}</Notice>}
        <Button
          label="Continue with Google"
          loading={busy}
          onPress={async () => {
            setBusy(true);
            setError(null);
            try {
              await signInWithGoogle();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Sign-in didn't complete. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
    );
  }

  const name = (session.user.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadOrders(); setRefreshing(false); }} />}>
      <Display>{name ? `Hello, ${name}` : "Your account"}</Display>
      <Body muted>{session.user.email}</Body>

      <Text style={st.h2}>Your orders</Text>
      {orders.length === 0 ? (
        <Body muted>No orders yet.</Body>
      ) : (
        orders.map((o) => {
          const at = STAGES.indexOf(o.status);
          return (
            <View key={o.id} style={st.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={st.orderNo}>#{o.order_number}</Text>
                <Body style={{ fontSize: 14 }}>{formatMoney(o.total, o.currency)}</Body>
              </View>
              <Body muted style={{ fontSize: 13 }}>{o.order_items.map((i) => (i.quantity > 1 ? `${i.name} × ${i.quantity}` : i.name)).join(", ")}</Body>
              <Text style={st.status}>{STATUS_LABEL[o.status] ?? o.status}</Text>
              {at >= 0 && (
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {STAGES.map((s, i) => <View key={s} style={[st.bar, i <= at && { backgroundColor: colors.oxblood }]} />)}
                </View>
              )}
              {o.status === "shipped" && o.tracking_number ? <Body style={{ fontSize: 13 }}>{o.carrier ?? "Courier"} tracking: {o.tracking_number}</Body> : null}
            </View>
          );
        })
      )}

      <Button label="Sign out" variant="ghost" onPress={signOut} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  h2: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, marginTop: 8 },
  card: { backgroundColor: colors.linen, padding: 16, gap: 6 },
  orderNo: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  status: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink, marginTop: 4 },
  bar: { flex: 1, height: 3, backgroundColor: "rgba(34,26,22,0.1)" },
});
