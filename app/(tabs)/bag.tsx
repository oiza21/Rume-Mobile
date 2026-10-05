import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Body, Button, Display, Notice, RegionToggle } from "@/components/ui";
import { imageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";

export default function Bag() {
  const { session } = useAuth();
  const { items, loading, refresh, setQuantity, remove, priceOf, currency, total, sync } = useCart();

  // Beginner sync: reload every time this tab is opened.
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (!session) {
    return (
      <View style={{ padding: 20, gap: 14 }}>
        <Display>Your bag</Display>
        <Body>Sign in with the same Google account you use on the website to see the same bag here.</Body>
        <Button label="Sign in" onPress={() => router.push("/(tabs)/account")} />
      </View>
    );
  }

  const lead = items.length ? Math.max(...items.map((i) => i.leadTimeDays)) : 0;

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      ListHeaderComponent={
        <View style={st.syncRow} accessibilityLiveRegion="polite">
          <View style={[st.syncDot, { backgroundColor: sync === "live" ? "#3E8E5A" : colors.sand }]} />
          <Body muted style={{ fontSize: 12 }}>
            {sync === "live" ? "Live: changes on the website appear here instantly" : "Connecting live sync…"}
          </Body>
        </View>
      }
      ListEmptyComponent={
        <View style={{ gap: 14, paddingTop: 20 }}>
          <Body>Your bag is empty.</Body>
          <Button label="Browse the pieces" onPress={() => router.push("/(tabs)")} />
        </View>
      }
      renderItem={({ item }) => (
        <View style={st.line}>
          <Pressable onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: item.slug } })}>
            <Image source={imageUrl(item.image)} style={st.img} contentFit="cover" contentPosition="top" />
          </Pressable>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={st.name}>{item.name}</Text>
            <Body style={{ fontSize: 14 }}>{formatMoney(priceOf(item) * item.quantity, currency)}</Body>
            <Body muted style={{ fontSize: 12 }}>Made to measure ({Object.keys(item.measurements.values).length} measurements, {item.measurements.unit})</Body>
            <View style={st.qtyRow}>
              <Pressable accessibilityLabel="Decrease quantity" disabled={item.quantity <= 1} onPress={() => setQuantity(item.id, item.quantity - 1).catch(() => refresh())} style={[st.qtyBtn, item.quantity <= 1 && { opacity: 0.35 }]}>
                <Text style={st.qtyTxt}>−</Text>
              </Pressable>
              <Text style={st.qty} accessibilityLabel={`Quantity ${item.quantity}`}>{item.quantity}</Text>
              <Pressable accessibilityLabel="Increase quantity" disabled={item.quantity >= 10} onPress={() => setQuantity(item.id, item.quantity + 1).catch(() => refresh())} style={st.qtyBtn}>
                <Text style={st.qtyTxt}>+</Text>
              </Pressable>
              <Pressable onPress={() => remove(item.id).catch(() => refresh())} style={{ marginLeft: "auto" }} accessibilityRole="button">
                <Text style={st.remove}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      ListFooterComponent={
        items.length ? (
          <View style={st.summary}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13 }}>Delivering to</Text>
            <RegionToggle />
            <View style={st.totalRow}>
              <Text style={st.total}>Total</Text>
              <Text style={st.total}>{formatMoney(total, currency)}</Text>
            </View>
            <Body muted style={{ fontSize: 12 }}>Delivery included. Ready in about {lead} days.</Body>
            <Button label="Continue to checkout" onPress={() => router.push("/checkout")} />
          </View>
        ) : null
      }
    />
  );
}

const st = StyleSheet.create({
  syncRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  line: { flexDirection: "row", gap: 14, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  img: { width: 92, height: 120, backgroundColor: "rgba(201,181,150,0.4)" },
  name: { fontFamily: fonts.display, fontSize: 21, color: colors.ink, lineHeight: 23 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  qtyBtn: { width: 34, height: 34, borderWidth: 1, borderColor: "rgba(34,26,22,0.25)", alignItems: "center", justifyContent: "center" },
  qtyTxt: { fontFamily: fonts.bodyMedium, fontSize: 18, color: colors.ink },
  qty: { fontFamily: fonts.bodyMedium, fontSize: 15, minWidth: 18, textAlign: "center" },
  remove: { fontFamily: fonts.body, fontSize: 13, textDecorationLine: "underline", color: colors.ink },
  summary: { backgroundColor: colors.linen, padding: 18, gap: 10, marginTop: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, marginTop: 4 },
  total: { fontFamily: fonts.bodyMedium, fontSize: 17, color: colors.ink },
});
