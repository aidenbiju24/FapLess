import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { Button, Card, Container, Eyebrow, Field, Heading, Screen } from "@/components/ui";
import { useRecovery } from "@/context/RecoveryContext";

export default function NewGoalScreen() { const router = useRouter(); const { addGoal } = useRecovery(); const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [target, setTarget] = useState("14"); const submit = () => { const value = Number(target); if (!title.trim() || !Number.isInteger(value) || value < 1) { Alert.alert("Check your goal", "Add a title and a target greater than zero."); return; } addGoal({ title: title.trim(), description: description.trim(), target: value }); router.back(); }; return <Screen><Container><Eyebrow>Build momentum</Eyebrow><Heading>New goal</Heading><Card><Field label="Title" value={title} onChangeText={setTitle} placeholder="Daily check-ins" /><Field label="Description" value={description} onChangeText={setDescription} placeholder="What will this support?" multiline /><Field label="Target" value={target} onChangeText={setTarget} keyboardType="number-pad" /><Button onPress={submit}>Create goal</Button><Button variant="ghost" onPress={() => router.back()}>Cancel</Button></Card></Container></Screen>; }
