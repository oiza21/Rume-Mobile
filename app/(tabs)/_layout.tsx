import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useCart } from "@/lib/cart";
import { colors, fonts } from "@/lib/theme";

export default function TabsLayout() {
  const { count } = useCart();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.parchment },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
        tabBarActiveTintColor: colors.oxblood,
        tabBarInactiveTintColor: colors.smoke,
        tabBarStyle: { backgroundColor: colors.linen, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.parchment },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Shop", headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="shirt-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="bag"
        options={{
          title: "Bag",
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.oxblood, fontFamily: fonts.bodyMedium },
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: "Account", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
