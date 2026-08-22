import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button, Card, Chip, Container, Eyebrow, Field, Heading, Screen, Body } from "@/components/ui";
import { useRecovery } from "@/context/RecoveryContext";
import { colors, spacing } from "@/theme";
import { TRIGGERS, type Trigger } from "@/types/recovery";

const goals = ["Build more self-control", "Reduce a habit", "Understand my triggers", "Create a steadier routine"];
const approaches = ["Small daily actions", "Structured program", "Data and reflection", "A flexible mix"];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useRecovery();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [goalDays, setGoalDays] = useState("90");
  const [goal, setGoal] = useState(goals[0]);
  const [approach, setApproach] = useState(approaches[0]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [reminders, setReminders] = useState(true);
  const toggle = (trigger: Trigger) => setTriggers((current) => current.includes(trigger) ? current.filter((item) => item !== trigger) : [...current, trigger]);
  const finish = () => {
    const days = Number(goalDays);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      Alert.alert("Choose a valid target", "Your target should be between 1 and 3650 days.");
      return;
    }
    completeOnboarding({ displayName, goalDays: days, primaryGoal: goal, preferredApproach: approach, commonTriggers: triggers, remindersEnabled: reminders });
    router.replace("/");
  };
  return <Screen scroll={false}><Container style={styles.container}><View style={styles.progress}><View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} /></View><Eyebrow>Start your recovery</Eyebrow><Heading>{step === 1 ? "What would be useful right now?" : step === 2 ? "How do you want to approach it?" : "A little context helps."}</Heading><Body muted>Only the essentials. You can change these preferences later.</Body><Card style={styles.card}>{step === 1 && <><Field label="What should we call you? (optional)" placeholder="Your first name or a nickname" value={displayName} onChangeText={setDisplayName} /><Text style={styles.label}>Primary goal</Text><View style={styles.chips}>{goals.map((item) => <Chip key={item} selected={goal === item} onPress={() => setGoal(item)}>{item}</Chip>)}</View><Field label="Target (days)" value={goalDays} onChangeText={setGoalDays} keyboardType="number-pad" /></>}{step === 2 && <><Text style={styles.label}>Preferred approach</Text><View style={styles.chips}>{approaches.map((item) => <Chip key={item} selected={approach === item} onPress={() => setApproach(item)}>{item}</Chip>)}</View><Text style={styles.label}>Reminder preference</Text><View style={styles.chips}><Chip selected={reminders} onPress={() => setReminders(true)}>Gentle reminders</Chip><Chip selected={!reminders} onPress={() => setReminders(false)}>No reminders</Chip></View></>}{step === 3 && <><Text style={styles.label}>Common signals (optional)</Text><Body muted>Select any that feel familiar. This personalizes your dashboard, not a diagnosis.</Body><View style={styles.chips}>{TRIGGERS.map((trigger) => <Chip key={trigger} selected={triggers.includes(trigger)} onPress={() => toggle(trigger)}>{trigger}</Chip>)}</View></>}<Button onPress={() => step === 3 ? finish() : setStep(step + 1)}>{step === 3 ? "Enter FapLess" : "Continue"}</Button>{step > 1 && <Button variant="ghost" onPress={() => setStep(step - 1)}>Back</Button>}<Button variant="ghost" onPress={finish}>Skip and continue</Button></Card></Container></Screen>;
}

const styles = StyleSheet.create({ container: { paddingTop: spacing.xl }, progress: { height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden", marginBottom: spacing.xl }, progressFill: { height: "100%", backgroundColor: colors.accent }, card: { marginTop: spacing.lg }, label: { color: colors.muted, fontSize: 13, fontWeight: "600", marginBottom: spacing.sm }, chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.md } });
