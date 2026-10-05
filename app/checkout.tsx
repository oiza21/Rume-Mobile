import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View, type TextInputProps } from "react-native";
import { Body, Button, Notice, RegionToggle } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";

function Field({ label, ...p }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={st.label}>{label}</Text>
      <TextInput placeholderTextColor="rgba(107,94,85,0.6)" style={st.input} {...p} />
    </View>
  );
}

/**
 * Uses the same /api/checkout endpoint as the website. Payment happens on
 * Paystack's secure page; once paid, the website confirms the order and the
 * shared bag empties on every device.
 */
export default function Checkout() {
  const { session } = useAuth();
  const { items, region, currency, total, priceOf, refresh } = useCart();
  const [f, setF] = useState({
    name: (session?.user.user_metadata?.full_name as string | undefined) ?? "",
    email: session?.user.email ?? "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: region === "NG" ? "Lagos" : "",
    country: "",
    postal_code: "",
    note: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  if (!items.length && !done) {
    return (
      <View style={{ padding: 20, gap: 12 }}>
        <Body>Your bag is empty.</Body>
        <Button label="Browse the pieces" onPress={() => router.replace("/(tabs)")} />
      </View>
    );
  }

  if (done) {
    return (
      <View style={{ padding: 20, gap: 12 }}>
        <Text style={st.thanks}>Thank you.</Text>
        <Body>If your payment went through, your order now appears in your account and the confirmation email is on its way. Your bag has been emptied on the website too.</Body>
        <Button label="See your orders" onPress={() => router.replace("/(tabs)/account")} />
      </View>
    );
  }

  async function pay() {
    setError(null);
    if (!agreed) return setError("Please confirm you've checked your measurements and read the return policy.");
    setPending(true);
    try {
      const { url } = await api<{ url: string }>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          region,
          contact: { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() },
          address: {
            line1: f.line1.trim(),
            line2: f.line2.trim() || undefined,
            city: f.city.trim(),
            state: f.state.trim() || undefined,
            postal_code: f.postal_code.trim() || undefined,
            country: region === "NG" ? "Nigeria" : f.country.trim(),
          },
          note: f.note.trim() || undefined,
          agreed: true,
          items: items.map((i) => ({ slug: i.slug, quantity: i.quantity, measurements: i.measurements })),
        }),
      });
      await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
      // Back from Paystack: the website has confirmed the order (if paid) and emptied the bag.
      await refresh();
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout couldn't start. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text style={st.h2}>Contact</Text>
        <Field label="Full name" value={f.name} onChangeText={set("name")} autoComplete="name" textContentType="name" />
        <Field label="Email" value={f.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" />
        <Field label="Phone, for the courier" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" textContentType="telephoneNumber" />

        <Text style={st.h2}>Delivery</Text>
        <RegionToggle />
        <Body muted style={{ fontSize: 12 }}>Switching changes the currency. Delivery is always included.</Body>
        <Field label="Address" value={f.line1} onChangeText={set("line1")} textContentType="streetAddressLine1" />
        <Field label="Apartment, landmark or bus stop (optional)" value={f.line2} onChangeText={set("line2")} />
        <Field label="City or town" value={f.city} onChangeText={set("city")} textContentType="addressCity" />
        <Field label={region === "NG" ? "State" : "State, county or region (optional)"} value={f.state} onChangeText={set("state")} textContentType="addressState" />
        {region === "INTL" && (
          <>
            <Field label="Country" value={f.country} onChangeText={set("country")} textContentType="countryName" />
            <Field label="Postcode or ZIP" value={f.postal_code} onChangeText={set("postal_code")} textContentType="postalCode" />
          </>
        )}
        <Field label="Note for Rume (optional)" value={f.note} onChangeText={set("note")} multiline />

        <View style={st.summary}>
          {items.map((i) => (
            <View key={i.id} style={st.row}>
              <Body style={{ flex: 1, fontSize: 14 }}>{i.name}{i.quantity > 1 ? ` × ${i.quantity}` : ""}</Body>
              <Body style={{ fontSize: 14 }}>{formatMoney(priceOf(i) * i.quantity, currency)}</Body>
            </View>
          ))}
          <View style={[st.row, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }]}>
            <Text style={st.total}>Total, delivery included</Text>
            <Text style={st.total}>{formatMoney(total, currency)}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Switch value={agreed} onValueChange={setAgreed} trackColor={{ true: colors.oxblood }} />
          <Body style={{ flex: 1, fontSize: 13 }}>I've checked my measurements and read the return and alteration policy. I understand each piece is made for me.</Body>
        </View>

        {error && <Notice tone="error">{error}</Notice>}
        <Button label={`Pay ${formatMoney(total, currency)}`} loading={pending} onPress={pay} />
        <Body muted style={{ fontSize: 12, textAlign: "center" }}>Secure payment by Paystack: card, bank transfer or USSD.</Body>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  h2: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, marginTop: 6 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  input: { borderWidth: 1, borderColor: "rgba(34,26,22,0.2)", backgroundColor: colors.linen, paddingHorizontal: 12, paddingVertical: 11, fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  summary: { backgroundColor: colors.linen, padding: 16, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  total: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  thanks: { fontFamily: fonts.display, fontSize: 40, color: colors.oxblood },
});
