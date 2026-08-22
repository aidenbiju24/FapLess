import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Container, Eyebrow, Field, Heading, Screen, Body } from "@/components/ui";
import { useRecovery } from "@/context/RecoveryContext";
import { spacing } from "@/theme";
import { TRIGGERS, type Mood, type Trigger } from "@/types/recovery";

export default function RelapseScreen() {
  const router = useRouter(); const { addRelapse } = useRecovery(); const [trigger, setTrigger] = useState<Trigger>("Stress"); const [mood, setMood] = useState<Mood>(3); const [environment, setEnvironment] = useState(""); const [notes, setNotes] = useState(""); const [reflection, setReflection] = useState("");
  const submit = () => { if (!notes.trim()) { Alert.alert("Add a little context", "A short note helps you learn from this event later."); return; } addRelapse({ trigger, mood, environment, notes, reflection }); router.back(); };
  return <Screen><Container><Eyebrow>Recovery is more than a streak</Eyebrow><Heading>Let&apos;s understand what happened.</Heading><Body muted>Your streak will restart, but your previous progress, milestones, and learning stay with you.</Body><Card style={styles.card}><Heading size="small">What was present?</Heading><View style={styles.chips}>{TRIGGERS.map((item) => <Chip key={item} selected={trigger === item} onPress={() => setTrigger(item)}>{item}</Chip>)}</View><TextScale label="Mood" value={mood} onChange={setMood} /><Field label="Environment" placeholder="Where were you?" value={environment} onChangeText={setEnvironment} /><Field label="What happened?" placeholder="Keep it factual and kind." value={notes} onChangeText={setNotes} multiline numberOfLines={4} style={styles.textArea} /><Field label="What could have helped?" placeholder="A useful next-step thought." value={reflection} onChangeText={setReflection} multiline numberOfLines={4} style={styles.textArea} /><Button onPress={submit}>Save reflection</Button><Button variant="ghost" onPress={() => router.back()}>Cancel</Button></Card></Container></Screen>;
}
function TextScale({ label, value, onChange }: { label: string; value: Mood; onChange: (value: Mood) => void }) { return <View style={styles.scale}><Body muted>{label}</Body><View style={styles.scaleRow}>{([1, 2, 3, 4, 5] as Mood[]).map((item) => <Chip key={item} selected={value === item} onPress={() => onChange(item)}>{item}</Chip>)}</View></View>; }
const styles = StyleSheet.create({ card: { marginTop: spacing.lg }, chips: { flexDirection: "row", flexWrap: "wrap", marginVertical: spacing.md }, scale: { marginBottom: spacing.md }, scaleRow: { flexDirection: "row", marginTop: spacing.sm }, textArea: { height: 100, paddingTop: spacing.md, textAlignVertical: "top" } });
