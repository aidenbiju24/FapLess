import { Tabs } from "expo-router";
import { Platform, Text } from "react-native";
import { colors } from "@/theme";

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: Platform.OS === "web" ? 64 : 78, paddingBottom: Platform.OS === "web" ? 8 : 18, paddingTop: 8 }, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.subtle, tabBarLabelStyle: { fontSize: 11, fontWeight: "600" } }}>
    <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: () => <TabIcon symbol="⌂" /> }} />
    <Tabs.Screen name="progress" options={{ title: "Progress", tabBarIcon: () => <TabIcon symbol="◒" /> }} />
    <Tabs.Screen name="checkins" options={{ href: null }} />
    <Tabs.Screen name="urges" options={{ href: null }} />
    <Tabs.Screen name="sos" options={{ title: "SOS", href: "/sos", tabBarIcon: () => <TabIcon symbol="!" /> }} />
    <Tabs.Screen name="journal" options={{ title: "Journal", tabBarIcon: () => <TabIcon symbol="▤" /> }} />
    <Tabs.Screen name="recovery" options={{ href: null }} />
    <Tabs.Screen name="coach" options={{ title: "AI Coach", tabBarIcon: () => <TabIcon symbol="✦" /> }} />
    <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: () => <TabIcon symbol="◌" /> }} />
  </Tabs>;
}

function TabIcon({ symbol }: { symbol: string }) {
  return <Text style={{ fontSize: 20, color: "inherit" }}>{symbol}</Text>;
}
