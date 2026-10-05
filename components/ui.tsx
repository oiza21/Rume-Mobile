import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type TextProps, type ViewStyle } from "react-native";
import { useCart } from "@/lib/cart";
import { colors, fonts } from "@/lib/theme";

export function Display({ style, ...p }: TextProps) {
  return <Text {...p} style={[s.display, style]} />;
}
export function Body({ style, muted, ...p }: TextProps & { muted?: boolean }) {
  return <Text {...p} style={[s.body, muted && { color: colors.smoke }, style]} />;
}

type BtnProps = PressableProps & { label: string; variant?: "primary" | "ghost" | "light"; loading?: boolean; style?: ViewStyle };
export function Button({ label, variant = "primary", loading, disabled, style, ...p }: BtnProps) {
  const v = variant === "primary" ? s.primary : variant === "light" ? s.light : s.ghost;
  const tc = variant === "primary" ? colors.linen : variant === "light" ? colors.oxbloodDeep : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [s.btn, v, (pressed || disabled) && { opacity: 0.7 }, style]}
      {...p}
    >
      {loading ? <ActivityIndicator color={tc} /> : <Text style={[s.btnText, { color: tc }]}>{label}</Text>}
    </Pressable>
  );
}

/** Prices include delivery, so the shopper picks where it's going. */
export function RegionToggle({ light = false }: { light?: boolean }) {
  const { region, setRegion } = useCart();
  const opt = (r: "NG" | "INTL", label: string) => {
    const on = region === r;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        onPress={() => setRegion(r)}
        style={[s.seg, on && { backgroundColor: light ? colors.linen : colors.ink }]}
      >
        <Text style={[s.segText, { color: on ? (light ? colors.oxbloodDeep : colors.linen) : light ? colors.linen : colors.smoke }]}>{label}</Text>
      </Pressable>
    );
  };
  return (
    <View style={[s.segWrap, { borderColor: light ? "rgba(247,242,234,0.4)" : colors.line }]}>
      {opt("NG", "Nigeria ₦")}
      {opt("INTL", "Worldwide $")}
    </View>
  );
}

export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "error" }) {
  return (
    <View style={[s.notice, tone === "error" && { borderLeftColor: colors.oxblood, backgroundColor: "rgba(75,26,32,0.06)" }]}>
      <Body style={{ fontSize: 14 }}>{children}</Body>
    </View>
  );
}

export const s = StyleSheet.create({
  display: { fontFamily: fonts.display, fontSize: 34, color: colors.ink, lineHeight: 38 },
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, lineHeight: 22 },
  btn: { minHeight: 50, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: colors.oxblood },
  light: { backgroundColor: colors.linen },
  ghost: { borderWidth: 1, borderColor: "rgba(34,26,22,0.3)" },
  btnText: { fontFamily: fonts.bodyMedium, fontSize: 15 },
  segWrap: { flexDirection: "row", borderWidth: 1, alignSelf: "flex-start" },
  seg: { paddingHorizontal: 10, paddingVertical: 6 },
  segText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  notice: { borderLeftWidth: 2, borderLeftColor: colors.sand, backgroundColor: colors.linen, padding: 12 },
});
