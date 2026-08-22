import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Body, Button, Card, Container, Eyebrow, Heading, Screen } from "@/components/ui";
import { useRecovery } from "@/context/RecoveryContext";
import { currentCalendarMonth, dateInTimeZone } from "@/lib/recovery";
import { colors, spacing } from "@/theme";

export default function CalendarScreen() {
  const { state } = useRecovery();
  const calendar = currentCalendarMonth(state.profile.timezone);
  const has = (day: number, type: "check" | "urge" | "relapse") => {
    const date = `${calendar.year}-${String(calendar.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return type === "check"
      ? state.checkIns.some((item) => item.date === date)
      : type === "urge"
        ? state.urges.some((item) => dateInTimeZone(item.occurredAt, state.profile.timezone) === date)
        : state.relapses.some((item) => dateInTimeZone(item.occurredAt, state.profile.timezone) === date);
  };
  return <Screen><Container><View style={styles.header}><View><Eyebrow>Recovery calendar</Eyebrow><Heading>{calendar.label}</Heading></View><Link href="/check-in" asChild><Button variant="secondary">Check in</Button></Link></View><Card><View style={styles.week}>{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <Text style={styles.weekText} key={`${day}-${index}`}>{day}</Text>)}</View><View style={styles.grid}>{Array.from({ length: calendar.firstDay + calendar.days }, (_, index) => { const day = index - calendar.firstDay + 1; return <View key={index} style={styles.day}>{day > 0 ? <><Text style={[styles.dayNumber, day === calendar.today && styles.today]}>{day}</Text><View style={styles.dots}><View style={[styles.dot, has(day, "check") && styles.check]} /><View style={[styles.dot, has(day, "urge") && styles.urge]} /><View style={[styles.dot, has(day, "relapse") && styles.relapse]} /></View></> : null}</View>; })}</View><View style={styles.legend}><Legend color={colors.success} label="Check-in" /><Legend color={colors.warning} label="Urge" /><Legend color={colors.danger} label="Relapse" /></View></Card><Card><Eyebrow>How to read this</Eyebrow><Body muted>Calendar marks are records, not judgments. Select a day in the next iteration to inspect its full daily detail.</Body></Card></Container></Screen>;
}
function Legend({ color, label }: { color: string; label: string }) { return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>; }
const styles = StyleSheet.create({ header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, week: { flexDirection: "row", marginBottom: spacing.sm }, weekText: { flex: 1, textAlign: "center", color: colors.subtle, fontSize: 12, fontWeight: "700" }, grid: { flexDirection: "row", flexWrap: "wrap" }, day: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderWidth: 0.5, borderColor: colors.border }, dayNumber: { color: colors.ink, fontSize: 14 }, today: { color: colors.accent, fontWeight: "900" }, dots: { flexDirection: "row", gap: 3, marginTop: 7 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border }, check: { backgroundColor: colors.success }, urge: { backgroundColor: colors.warning }, relapse: { backgroundColor: colors.danger }, legend: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }, legendItem: { flexDirection: "row", alignItems: "center", gap: 5 }, legendDot: { width: 7, height: 7, borderRadius: 4 }, legendText: { color: colors.muted, fontSize: 12 } });
