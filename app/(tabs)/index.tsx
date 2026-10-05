import { Image } from "expo-image";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Body, Button, Notice, RegionToggle } from "@/components/ui";
import { api, imageUrl, type Product } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";

export default function Shop() {
  const insets = useSafeAreaInsets();
  const { priceOf, currency } = useCart();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { products } = await api<{ products: Product[] }>("/api/products");
      setProducts(products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the shop");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const header = (
    <View style={[st.hero, { paddingTop: insets.top + 18 }]}>
      <Text style={st.wordmark}>RUME</Text>
      <Text style={st.tagline}>Made with intention. Made for you.</Text>
      <View style={{ marginTop: 18 }}>
        <RegionToggle light />
      </View>
      <Text style={st.heroNote}>Every piece is cut to your measurements. Prices include delivery.</Text>
    </View>
  );

  return (
    <FlatList
      data={products ?? []}
      keyExtractor={(p) => p.slug}
      numColumns={2}
      ListHeaderComponent={header}
      columnWrapperStyle={{ gap: 14, paddingHorizontal: 16 }}
      contentContainerStyle={{ paddingBottom: 32, gap: 22 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      ListEmptyComponent={
        <View style={{ padding: 24, gap: 12 }}>
          {error ? (
            <>
              <Notice tone="error">{error}</Notice>
              <Button label="Try again" variant="ghost" onPress={load} />
            </>
          ) : (
            <ActivityIndicator color={colors.oxblood} />
          )}
        </View>
      }
      renderItem={({ item }) => (
        <Link href={{ pathname: "/product/[slug]", params: { slug: item.slug } }} asChild>
          <Pressable style={{ flex: 1 }} accessibilityLabel={item.name}>
            <Image source={imageUrl(item.images[0]?.src)} style={st.img} contentFit="cover" contentPosition="top" transition={200} />
            <Text style={st.name} numberOfLines={2}>{item.name}</Text>
            <Body muted style={{ fontSize: 13 }}>{formatMoney(priceOf(item), currency)}</Body>
          </Pressable>
        </Link>
      )}
    />
  );
}

const st = StyleSheet.create({
  hero: { backgroundColor: colors.oxbloodDeep, paddingHorizontal: 20, paddingBottom: 24, marginBottom: 4 },
  wordmark: { fontFamily: fonts.display, fontSize: 64, letterSpacing: 6, color: colors.linen, lineHeight: 70 },
  tagline: { fontFamily: fonts.display, fontSize: 22, color: colors.sand, fontStyle: "italic" },
  heroNote: { fontFamily: fonts.body, fontSize: 13, color: "rgba(247,242,234,0.8)", marginTop: 12, lineHeight: 19 },
  img: { width: "100%", aspectRatio: 3 / 4, backgroundColor: "rgba(201,181,150,0.4)" },
  name: { fontFamily: fonts.display, fontSize: 19, color: colors.ink, marginTop: 8, lineHeight: 21 },
});
