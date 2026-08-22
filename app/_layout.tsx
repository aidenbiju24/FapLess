import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { RecoveryProvider, useRecovery } from "@/context/RecoveryContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";

export default function RootLayout() {
  return <AuthProvider><RecoveryProvider><StatusBar style="light" /><RouteGate /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="auth" options={{ presentation: "modal" }} /><Stack.Screen name="onboarding" options={{ presentation: "modal", gestureEnabled: false }} /><Stack.Screen name="sos" options={{ presentation: "modal", animation: "slide_from_bottom" }} /><Stack.Screen name="check-in" options={{ presentation: "modal" }} /><Stack.Screen name="journal/new" options={{ presentation: "modal" }} /><Stack.Screen name="relapse" options={{ presentation: "modal" }} /></Stack></RecoveryProvider></AuthProvider>;
}

function RouteGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, configured, loading } = useAuth();
  const { hydrated, state } = useRecovery();
  const isAuthRoute = pathname === "/auth";
  const isOnboardingRoute = pathname === "/onboarding";

  useEffect(() => {
    if (loading || !hydrated) return;
    if (configured && !userId && !isAuthRoute) {
      router.replace("/auth");
      return;
    }
    if (configured && userId && !state.profile.onboardingComplete && !isOnboardingRoute) {
      router.replace("/onboarding");
      return;
    }
    if (!configured && !state.profile.onboardingComplete && !isOnboardingRoute && !isAuthRoute) {
      router.replace("/onboarding");
    }
  }, [configured, hydrated, isAuthRoute, isOnboardingRoute, loading, pathname, router, state.profile.onboardingComplete, userId]);

  if (loading || !hydrated) return <View style={styles.loading}><ActivityIndicator color={colors.accent} /></View>;
  return null;
}

const styles = StyleSheet.create({ loading: { ...StyleSheet.absoluteFill, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", zIndex: 10 } });
