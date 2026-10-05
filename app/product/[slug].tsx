import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Body, Button, Display, Notice, RegionToggle } from "@/components/ui";
import { api, imageUrl, type MeasurementField, type MeasurementSet, type Product, type Unit } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const { add, priceOf, currency } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [fields, setFields] = useState<MeasurementField[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);

  const [unit, setUnit] = useState<Unit>("cm");
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [save, setSave] = useState(true);
  const [prefilled, setPrefilled] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api<{ product: Product; measurementFields: MeasurementField[] }>(`/api/products/${slug}`)
      .then(({ product, measurementFields }) => {
        setProduct(product);
        setFields(measurementFields);
      })
      .catch((e) => setLoadError(e.message));
  }, [slug]);

  // Same saved measurements as the website account.
  useEffect(() => {
    if (!session) return;
    api<{ measurements: MeasurementSet | null }>("/api/me/measurements")
      .then(({ measurements }) => {
        if (!measurements) return;
        setUnit(measurements.unit);
        setValues(Object.fromEntries(Object.entries(measurements.values).map(([k, v]) => [k, String(v)])));
        setPrefilled(true);
      })
      .catch(() => {});
  }, [session]);

  if (loadError) return <View style={{ padding: 20 }}><Notice tone="error">{loadError}</Notice></View>;
  if (!product) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.oxblood} />;

  async function onAdd() {
    setError(null);
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(values)) {
      const n = Number(v.replace(",", "."));
      if (v.trim() && Number.isFinite(n) && n > 0) clean[k] = n;
    }
    const max = unit === "cm" ? 260 : 102;
    const miss = fields.filter((f) => !(clean[f.key] > 0 && clean[f.key] <= max)).map((f) => f.label);
    setMissing(miss);
    if (miss.length) return setError(`Add a valid number for: ${miss.join(", ")}.`);

    setAdding(true);
    try {
      await add(product!.slug, { unit, values: clean, notes: notes.trim() || undefined });
      if (save) await api("/api/me/measurements", { method: "PUT", body: JSON.stringify({ unit, values: clean }) }).catch(() => {});
      setAdded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add to your bag");
    } finally {
      setAdding(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {product.images.map((img) => (
            <View key={img.src}>
              <Image source={imageUrl(img.src)} style={{ width, height: width * 1.25, backgroundColor: "rgba(201,181,150,0.4)" }} contentFit="cover" contentPosition="top" />
              <Text style={st.tag}>{img.label}</Text>
            </View>
          ))}
        </ScrollView>
        {product.images.length > 1 && (
          <View style={st.dots}>
            {product.images.map((img, i) => <View key={img.src} style={[st.dot, i === photo && { backgroundColor: colors.oxblood }]} />)}
          </View>
        )}

        <View style={{ padding: 20, gap: 10 }}>
          <Body muted style={{ fontSize: 13 }}>{product.collection}</Body>
          <Display>{product.name}</Display>
          <Text style={st.price}>{formatMoney(priceOf(product), currency)}</Text>
          <RegionToggle />
          <Body muted style={{ fontSize: 13 }}>Delivery included. Made and ready in about {product.leadTimeDays} days.</Body>
          <Body style={{ marginTop: 6 }}>{product.description}</Body>

          <View style={st.section}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={st.h2}>Your measurements</Text>
              <View style={st.unitWrap}>
                {(["cm", "in"] as Unit[]).map((u) => (
                  <Pressable key={u} onPress={() => setUnit(u)} style={[st.unit, unit === u && { backgroundColor: colors.ink }]} accessibilityRole="button" accessibilityState={{ selected: unit === u }}>
                    <Text style={[st.unitText, unit === u && { color: colors.linen }]}>{u}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {prefilled && <Body muted style={{ fontSize: 13 }}>Filled in from your account. Please check them.</Body>}

            {!session ? (
              <View style={{ gap: 10, marginTop: 6 }}>
                <Notice>Sign in to add pieces to your bag. It's the same bag as on the website.</Notice>
                <Button label="Sign in with Google" onPress={() => router.push("/(tabs)/account")} />
              </View>
            ) : (
              <>
                <View style={st.grid}>
                  {fields.map((f) => (
                    <View key={f.key} style={st.cell}>
                      <Text style={st.label}>{f.label}</Text>
                      <TextInput
                        value={values[f.key] ?? ""}
                        onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
                        keyboardType="decimal-pad"
                        placeholder={unit}
                        placeholderTextColor="rgba(107,94,85,0.6)"
                        style={[st.input, missing.includes(f.label) && { borderColor: colors.oxblood }]}
                        accessibilityLabel={`${f.label} in ${unit}`}
                        accessibilityHint={f.hint}
                      />
                      <Text style={st.hint}>{f.hint}</Text>
                    </View>
                  ))}
                </View>
                <Text style={st.label}>Anything else about fit? (optional)</Text>
                <TextInput value={notes} onChangeText={setNotes} multiline style={[st.input, { minHeight: 70, textAlignVertical: "top" }]} placeholder="For example: I prefer a looser waist." placeholderTextColor="rgba(107,94,85,0.6)" />
                <View style={st.switchRow}>
                  <Body style={{ flex: 1 }}>Save these measurements to my account</Body>
                  <Switch value={save} onValueChange={setSave} trackColor={{ true: colors.oxblood }} />
                </View>

                {error && <Notice tone="error">{error}</Notice>}
                {added ? (
                  <View style={{ gap: 10 }}>
                    <Notice>Added to your bag. It's also in your bag on the website.</Notice>
                    <Button label="View bag" onPress={() => router.push("/(tabs)/bag")} />
                    <Button label="Add another" variant="ghost" onPress={() => setAdded(false)} />
                  </View>
                ) : (
                  <Button label="Add to bag" loading={adding} onPress={onAdd} />
                )}
              </>
            )}
          </View>

          <View style={st.section}>
            {[
              ["Fabric", product.fabric],
              ["Colour", product.colour],
              ["Techniques", product.techniques.join(", ")],
              ["Focus", product.focus],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: "row", gap: 12 }}>
                <Text style={[st.label, { width: 92 }]}>{k}</Text>
                <Body style={{ flex: 1, fontSize: 14 }}>{v}</Body>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  tag: { position: "absolute", top: 12, left: 12, backgroundColor: "rgba(247,242,234,0.9)", paddingHorizontal: 8, paddingVertical: 2, fontFamily: fonts.body, fontSize: 12, overflow: "hidden" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(34,26,22,0.2)" },
  price: { fontFamily: fonts.bodyMedium, fontSize: 18, color: colors.ink },
  section: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 18, paddingTop: 18, gap: 12 },
  h2: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  unitWrap: { flexDirection: "row", borderWidth: 1, borderColor: colors.line },
  unit: { paddingHorizontal: 12, paddingVertical: 5 },
  unitText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.smoke },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 14 },
  cell: { width: "48%" },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  input: { marginTop: 4, borderWidth: 1, borderColor: "rgba(34,26,22,0.2)", backgroundColor: colors.linen, paddingHorizontal: 10, paddingVertical: 10, fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.smoke, marginTop: 3, lineHeight: 15 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
