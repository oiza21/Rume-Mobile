import { CormorantGaramond_500Medium, CormorantGaramond_600SemiBold } from "@expo-google-fonts/cormorant-garamond";
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from "@expo-google-fonts/dm-sans";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ScrollView, Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { missingConfig } from "@/lib/config";
import { colors, fonts } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  if (missingConfig.length) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.parchment }}>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 32 }}>Almost there</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }}>
              Add these to the .env file in the rume-mobile folder, then restart with "npx expo start -c":
            </Text>
            {missingConfig.map((k) => (
              <Text key={k} style={{ fontFamily: fonts.bodyBold }}>{k}</Text>
            ))}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.parchment },
              headerShadowVisible: false,
              headerTintColor: colors.ink,
              headerTitleStyle: { fontFamily: fonts.display, fontSize: 22 },
              headerBackButtonDisplayMode: "minimal",
              contentStyle: { backgroundColor: colors.parchment },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[slug]" options={{ title: "" }} />
            <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
          </Stack>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
