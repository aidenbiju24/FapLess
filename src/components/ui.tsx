import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type PressableProps, type TextInputProps, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/theme";

export function Screen({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: ViewStyle }) {
  const content = <View style={[styles.screen, style]}>{children}</View>;
  return scroll ? <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content;
}

export function Container({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.container, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Heading({ children, size = "large" }: { children: React.ReactNode; size?: "large" | "medium" | "small" }) {
  return <Text style={[styles.heading, size === "medium" && styles.headingMedium, size === "small" && styles.headingSmall]}>{children}</Text>;
}

export function Body({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({ children, variant = "primary", style, ...props }: PressableProps & { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; style?: ViewStyle }) {
  return <Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, variant === "secondary" && styles.buttonSecondary, variant === "ghost" && styles.buttonGhost, pressed && styles.pressed, style]} {...props}><Text style={[styles.buttonText, variant !== "primary" && styles.buttonTextSecondary]}>{children}</Text></Pressable>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor={colors.subtle} style={styles.input} {...props} /></View>;
}

export function Chip({ children, selected = false, onPress }: { children: React.ReactNode; selected?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{children}</Text></Pressable>;
}

export function Stat({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text>{detail ? <Text style={styles.statDetail}>{detail}</Text> : null}</View>;
}

export const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  screen: { flex: 1, backgroundColor: colors.background, minHeight: "100%" },
  container: { width: "100%", maxWidth: 1120, alignSelf: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: spacing.sm },
  heading: { color: colors.ink, fontSize: 32, lineHeight: 38, fontWeight: "700", marginBottom: spacing.sm },
  headingMedium: { fontSize: 24, lineHeight: 30 },
  headingSmall: { fontSize: 18, lineHeight: 24 },
  body: { color: colors.ink, fontSize: 15, lineHeight: 23 },
  muted: { color: colors.muted },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  button: { alignItems: "center", justifyContent: "center", minHeight: 48, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.accent, marginTop: spacing.sm },
  buttonSecondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  buttonGhost: { backgroundColor: "transparent", minHeight: 40, paddingHorizontal: spacing.sm },
  buttonText: { color: colors.black, fontSize: 15, fontWeight: "700" },
  buttonTextSecondary: { color: colors.ink },
  pressed: { opacity: 0.72 },
  field: { marginBottom: spacing.md },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600", marginBottom: spacing.sm },
  input: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: spacing.md, fontSize: 15 },
  chip: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: colors.black },
  stat: { flex: 1, minWidth: 100, paddingRight: spacing.md, marginBottom: spacing.md },
  statValue: { color: colors.ink, fontSize: 24, fontWeight: "700", marginBottom: 4 },
  statLabel: { color: colors.muted, fontSize: 13 },
  statDetail: { color: colors.accent, fontSize: 12, marginTop: 4 },
});
