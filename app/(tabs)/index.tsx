import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Body, Button, Card, Container, Eyebrow, Heading, Screen, Stat } from "@/components/ui";
import { useRecovery } from "@/context/RecoveryContext";
import { formatDate } from "@/lib/recovery";
import { colors, spacing } from "@/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { state, streak, longest, score, phase, stats } = useRecovery();
  const today = new Date().toISOString().slice(0, 10);
  const checkIn = state.checkIns.find((item) => item.date === today);
  const checkInProgress = Math.min(100, state.checkIns.length ? Math.round((state.checkIns.length / Math.max(1, streak)) * 100) : 0);
  const isWide = width >= 820;

  return <Screen><Container>
    <View style={styles.header}><View><Eyebrow>Recovery / {formatDate(new Date().toISOString())}</Eyebrow><Heading size="medium">Good to see you, {state.profile.displayName}.</Heading><Body muted>Your streak is one measurement. Your progress is the bigger picture.</Body></View><View style={styles.avatar}><Text style={styles.avatarText}>{state.profile.displayName.slice(0, 1).toUpperCase()}</Text></View></View>
    <View style={[styles.grid, isWide && styles.gridWide]}>
      <View style={styles.mainColumn}>
        <Card style={styles.streakCard}><View style={styles.cardHeader}><View><Eyebrow>Current streak</Eyebrow><Text style={styles.streak}>{streak} <Text style={styles.streakUnit}>days</Text></Text><Body muted>Started {formatDate(state.streakStartedAt)}</Body></View><View style={styles.progressRing}><Text style={styles.ringText}>{score}%</Text><Text style={styles.ringLabel}>progress</Text></View></View><View style={styles.goalRow}><Text style={styles.goalText}>Goal: {state.profile.goalDays} days</Text><View style={styles.goalTrack}><View style={[styles.goalFill, { width: `${Math.min(100, (streak / state.profile.goalDays) * 100)}%` }]} /></View></View><View style={styles.statsRow}><Stat label="Best streak" value={`${longest}d`} /><Stat label="Urges defeated" value={stats.defeated} /><Stat label="Phase" value={phase.name} /></View></Card>
        <View style={[styles.actionRow, isWide && styles.actionRowWide]}><Pressable accessibilityRole="button" onPress={() => router.push("/sos")} style={({ pressed }) => [styles.sosButton, isWide && styles.sosWide, pressed && styles.pressed]}><Text style={styles.sosKicker}>NEED A RESET?</Text><Text style={styles.sosTitle}>I&apos;M HAVING AN URGE</Text><Text style={styles.sosCaption}>Open a guided 90-second response</Text></Pressable><Card style={styles.checkInCard}><Eyebrow>Today&apos;s check-in</Eyebrow><Heading size="small">{checkIn ? "You showed up today." : "How are you arriving today?"}</Heading>{checkIn ? <Body muted>Mood {checkIn.mood}/5 · Urge {checkIn.urgeLevel}/10 · Confidence {checkIn.confidence}/5</Body> : <Body muted>A small check-in creates useful awareness over time.</Body>}<Link href="/check-in" asChild><Button variant="secondary">{checkIn ? "Update check-in" : "Complete check-in"}</Button></Link></Card></View>
      </View>
      <View style={styles.sideColumn}>
        <Card><Eyebrow>Today&apos;s progress</Eyebrow><ProgressLine label="Check-in" complete={Boolean(checkIn)} /><ProgressLine label="Journal" complete={state.journalEntries.some((entry) => entry.createdAt.slice(0, 10) === today)} /><ProgressLine label="Recovery phase" complete={streak > 0} /><ProgressLine label="Goal momentum" complete={state.goals.some((goal) => goal.current > 0)} /></Card>
        <Card><Eyebrow>Pattern to notice</Eyebrow><Heading size="small">{stats.topTrigger === "No pattern yet" ? "Start collecting signals." : `${stats.topTrigger} is showing up most often.`}</Heading><Body muted>{stats.topTrigger === "No pattern yet" ? "Your recommendations become more personal as you log urges and check-ins." : `It appears in ${stats.topTriggerCount} logged urge${stats.topTriggerCount === 1 ? "" : "s"}. This is a pattern in your data, not a diagnosis.`}</Body></Card>
        <Card style={styles.quoteCard}><Text style={styles.quote}>“The next decision is more useful than the last one.”</Text><Text style={styles.quoteMeta}>A practical recovery reminder</Text></Card>
      </View>
    </View>
    <View style={styles.sectionHeading}><View><Eyebrow>Keep building</Eyebrow><Heading size="medium">Small actions, durable change.</Heading></View><Link href="/progress" asChild><Button variant="ghost">View progress →</Button></Link></View>
    <View style={[styles.statsRow, styles.lowerStats]}><Card style={styles.lowerCard}><Stat label="Check-in consistency" value={`${checkInProgress}%`} detail={`${state.checkIns.length} total check-ins`} /></Card><Card style={styles.lowerCard}><Stat label="Journal entries" value={state.journalEntries.length} detail="Private by default" /></Card><Card style={styles.lowerCard}><Stat label="Recovery focus" value={phase.range} detail={phase.focus} /></Card></View>
  </Container></Screen>;
}

function ProgressLine({ label, complete }: { label: string; complete: boolean }) {
  return <View style={styles.progressLine}><View style={[styles.check, complete && styles.checkComplete]}><Text style={styles.checkText}>{complete ? "✓" : ""}</Text></View><Text style={styles.progressLabel}>{label}</Text><Text style={styles.progressStatus}>{complete ? "Done" : "Open"}</Text></View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginLeft: spacing.md },
  avatarText: { color: colors.black, fontWeight: "800", fontSize: 18 },
  grid: { gap: spacing.md }, gridWide: { flexDirection: "row" },
  mainColumn: { flex: 1.65 }, sideColumn: { flex: 1 },
  streakCard: { backgroundColor: colors.surfaceRaised },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  streak: { color: colors.ink, fontSize: 58, fontWeight: "800", lineHeight: 64 },
  streakUnit: { color: colors.accent, fontSize: 17, fontWeight: "700" },
  progressRing: { width: 78, height: 78, borderRadius: 39, borderWidth: 5, borderColor: colors.accent, alignItems: "center", justifyContent: "center" },
  ringText: { color: colors.ink, fontSize: 17, fontWeight: "800" }, ringLabel: { color: colors.muted, fontSize: 10 },
  goalRow: { marginTop: spacing.lg }, goalText: { color: colors.muted, fontSize: 13, marginBottom: 8 }, goalTrack: { height: 7, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }, goalFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 4 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.lg },
  actionRow: { gap: spacing.md }, actionRowWide: { flexDirection: "row" },
  sosButton: { backgroundColor: colors.accent, borderRadius: 20, padding: spacing.lg, minHeight: 154, justifyContent: "center" }, sosWide: { flex: 1 },
  sosKicker: { color: colors.black, fontSize: 11, fontWeight: "800", letterSpacing: 1 }, sosTitle: { color: colors.black, fontSize: 22, fontWeight: "900", marginTop: 10 }, sosCaption: { color: "#335126", fontSize: 13, marginTop: 8 },
  checkInCard: { flex: 1, marginBottom: 0 },
  progressLine: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.subtle, marginRight: 10, alignItems: "center", justifyContent: "center" }, checkComplete: { backgroundColor: colors.accent, borderColor: colors.accent }, checkText: { color: colors.black, fontSize: 13, fontWeight: "800" }, progressLabel: { color: colors.ink, flex: 1, fontSize: 14 }, progressStatus: { color: colors.muted, fontSize: 12 },
  quoteCard: { backgroundColor: "#18231A", borderColor: "#2F5130" }, quote: { color: colors.accentSoft, fontSize: 20, lineHeight: 28, fontWeight: "600" }, quoteMeta: { color: colors.muted, fontSize: 12, marginTop: 14 },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: spacing.xl, marginBottom: spacing.sm }, lowerStats: { gap: spacing.md, marginTop: 0 }, lowerCard: { flex: 1, minWidth: 180, marginBottom: 0 }, pressed: { opacity: 0.75 },
});
