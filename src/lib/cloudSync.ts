import { supabase } from "@/lib/supabase";
import type { Achievement, CheckIn, JournalEntry, RecoveryState, Relapse, StreakRecord, Urge } from "@/types/recovery";

export const syncAvailable = Boolean(supabase);

export async function pullCloudState(local: RecoveryState): Promise<RecoveryState> {
  if (!supabase) return local;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return local;
  const [profile, checkIns, urges, relapses, journal, goals, challenges, streaks, programProgress, achievements] = await Promise.all([
    supabase.from("profiles").select("id, display_name, goal_days, timezone, primary_goal, preferred_approach, common_triggers, onboarding_complete, reminders_enabled, ai_storage_enabled, active_streak_started_at, created_at").eq("id", user.id).maybeSingle(),
    supabase.from("check_ins").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(365),
    supabase.from("urges").select("*").eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(500),
    supabase.from("relapses").select("*").eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(200),
    supabase.from("journal_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500),
    supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("challenges").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("streaks").select("*").eq("user_id", user.id).order("duration", { ascending: false }),
    supabase.from("program_progress").select("program_id, day").eq("user_id", user.id).order("day"),
    supabase.from("achievements").select("*").eq("user_id", user.id).order("unlocked_at", { ascending: false }),
  ]);
  const reads = [profile, checkIns, urges, relapses, journal, goals, challenges, streaks, programProgress, achievements];
  if (reads.some((response) => response.error)) throw new Error("Cloud state could not be loaded");
  const serverDeletedJournalIds = (journal.data ?? []).filter((row) => row.deleted_at != null).map((row) => String(row.id));
  const deletedJournalEntryIds = Array.from(new Set([...local.deletedJournalEntryIds, ...serverDeletedJournalIds]));
  return {
    ...local,
    profile: profile.data ? { id: profile.data.id, displayName: profile.data.display_name, goalDays: profile.data.goal_days, timezone: profile.data.timezone, primaryGoal: profile.data.primary_goal ?? undefined, preferredApproach: profile.data.preferred_approach ?? undefined, commonTriggers: profile.data.common_triggers ?? [], onboardingComplete: profile.data.onboarding_complete ?? false, remindersEnabled: profile.data.reminders_enabled ?? true, aiStorageEnabled: profile.data.ai_storage_enabled ?? false, createdAt: profile.data.created_at } : local.profile,
    streakStartedAt: profile.data?.active_streak_started_at || local.streakStartedAt,
    deletedJournalEntryIds,
    checkIns: mergeById(local.checkIns, (checkIns.data ?? []).map(fromCheckIn), "updatedAt"),
    urges: mergeById(local.urges, (urges.data ?? []).map(fromUrge), "createdAt"),
    relapses: mergeById(local.relapses, (relapses.data ?? []).map(fromRelapse), "createdAt"),
    journalEntries: mergeById(
      local.journalEntries.filter((entry) => !deletedJournalEntryIds.includes(entry.id)),
      (journal.data ?? []).filter((row) => row.deleted_at == null).map(fromJournal).filter((entry) => !deletedJournalEntryIds.includes(entry.id)),
      "updatedAt",
    ),
    goals: goals.data?.length ? goals.data.map((goal) => ({ id: goal.id, title: goal.title, description: goal.description, target: goal.target, current: goal.current, deadline: goal.deadline ?? undefined, status: goal.status, createdAt: goal.created_at })) : local.goals,
    challenges: challenges.data?.length ? challenges.data.map((challenge) => ({ id: challenge.id, name: challenge.name, description: challenge.description, startDate: challenge.start_date, endDate: challenge.end_date, status: challenge.status, progress: challenge.status === "completed" ? 100 : 0, createdAt: challenge.created_at })) : local.challenges,
    streakHistory: streaks.data?.length ? streaks.data.map(fromStreak) : local.streakHistory,
    programProgress: programProgress.data?.length ? programProgress.data.reduce<Record<string, number[]>>((result, row) => { const id = String(row.program_id); result[id] = [...(result[id] ?? []), Number(row.day)]; return result; }, {}) : local.programProgress,
    achievements: achievements.data?.length ? achievements.data.map(fromAchievement) : local.achievements,
  };
}

export async function pushCloudState(state: RecoveryState): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const writes = await Promise.all([
    supabase.from("profiles").upsert({ id: user.id, display_name: state.profile.displayName, goal_days: state.profile.goalDays, timezone: state.profile.timezone, primary_goal: state.profile.primaryGoal ?? null, preferred_approach: state.profile.preferredApproach ?? null, common_triggers: state.profile.commonTriggers ?? [], onboarding_complete: state.profile.onboardingComplete ?? false, reminders_enabled: state.profile.remindersEnabled ?? true, ai_storage_enabled: state.profile.aiStorageEnabled ?? false, active_streak_started_at: state.streakStartedAt, updated_at: new Date().toISOString() }),
    supabase.from("check_ins").upsert(state.checkIns.map((item) => ({ id: item.id, user_id: user.id, date: item.date, mood: item.mood, energy: item.energy, urge_level: item.urgeLevel, confidence: item.confidence, sleep_hours: item.sleepHours ?? null, triggers: item.triggers, wins: item.wins, difficulties: item.difficulties, notes: item.notes, created_at: item.createdAt, updated_at: item.updatedAt }))),
    supabase.from("urges").upsert(state.urges.map((item) => ({ id: item.id, user_id: user.id, occurred_at: item.occurredAt, intensity: item.intensity, trigger: item.trigger, location: item.location, mood: item.mood, action_taken: item.actionTaken, outcome: item.outcome, notes: item.notes, created_at: item.createdAt }))),
    supabase.from("relapses").upsert(state.relapses.map((item) => ({ id: item.id, user_id: user.id, occurred_at: item.occurredAt, trigger: item.trigger, mood: item.mood, environment: item.environment, notes: item.notes, reflection: item.reflection, created_at: item.createdAt }))),
    supabase.from("journal_entries").upsert(state.journalEntries.map((item) => ({ id: item.id, user_id: user.id, title: item.title, content: item.content, mood: item.mood ?? null, tags: item.tags, created_at: item.createdAt, updated_at: item.updatedAt }))),
    state.deletedJournalEntryIds.length ? supabase.from("journal_entries").update({ deleted_at: new Date().toISOString() }).in("id", state.deletedJournalEntryIds).eq("user_id", user.id) : Promise.resolve({ error: null }),
    supabase.from("goals").upsert(state.goals.map((item) => ({ id: item.id, user_id: user.id, title: item.title, description: item.description, target: item.target, current: item.current, deadline: item.deadline ?? null, status: item.status, created_at: item.createdAt }))),
    supabase.from("challenges").upsert(state.challenges.map((item) => ({ id: item.id, user_id: user.id, name: item.name, description: item.description, start_date: item.startDate, end_date: item.endDate, status: item.status, created_at: item.createdAt }))),
    supabase.from("streaks").upsert(state.streakHistory.map((item) => ({ id: item.id, user_id: user.id, start_date: item.startDate.slice(0, 10), end_date: item.endDate.slice(0, 10), reset_reason: item.resetReason, created_at: item.createdAt }))),
    supabase.from("program_progress").upsert(Object.entries(state.programProgress).flatMap(([programId, days]) => days.map((day) => ({ user_id: user.id, program_id: programId, day }))), { onConflict: "user_id,program_id,day" }),
    supabase.from("achievements").upsert(state.achievements.map((item) => ({ id: item.id, user_id: user.id, achievement_type: item.type, unlocked_at: item.unlockedAt }))),
  ]);
  if (writes.some((response) => response.error)) throw new Error("Cloud state could not be saved");
}

function mergeById<T extends { id: string }>(local: T[], cloud: T[], dateKey: keyof T): T[] { const map = new Map(local.map((item) => [item.id, item])); cloud.forEach((item) => { const previous = map.get(item.id); if (!previous || String(item[dateKey]) >= String(previous[dateKey])) map.set(item.id, item); }); return [...map.values()]; }
function fromCheckIn(row: Record<string, unknown>): CheckIn { return { id: String(row.id), date: String(row.date), mood: row.mood as CheckIn["mood"], energy: row.energy as CheckIn["energy"], urgeLevel: Number(row.urge_level), confidence: row.confidence as CheckIn["confidence"], sleepHours: row.sleep_hours == null ? undefined : Number(row.sleep_hours), triggers: (row.triggers ?? []) as CheckIn["triggers"], wins: String(row.wins ?? ""), difficulties: String(row.difficulties ?? ""), notes: String(row.notes ?? ""), createdAt: String(row.created_at), updatedAt: String(row.updated_at) }; }
function fromUrge(row: Record<string, unknown>): Urge { return { id: String(row.id), occurredAt: String(row.occurred_at), intensity: Number(row.intensity), trigger: row.trigger as Urge["trigger"], location: String(row.location ?? ""), mood: row.mood as Urge["mood"], actionTaken: String(row.action_taken ?? ""), outcome: row.outcome as Urge["outcome"], notes: String(row.notes ?? ""), createdAt: String(row.created_at) }; }
function fromRelapse(row: Record<string, unknown>): Relapse { return { id: String(row.id), occurredAt: String(row.occurred_at), trigger: row.trigger as Relapse["trigger"], mood: row.mood as Relapse["mood"], environment: String(row.environment ?? ""), notes: String(row.notes ?? ""), reflection: String(row.reflection ?? ""), createdAt: String(row.created_at) }; }
function fromJournal(row: Record<string, unknown>): JournalEntry { return { id: String(row.id), title: String(row.title), content: String(row.content), mood: row.mood == null ? undefined : row.mood as JournalEntry["mood"], tags: (row.tags ?? []) as string[], createdAt: String(row.created_at), updatedAt: String(row.updated_at) }; }
function fromStreak(row: Record<string, unknown>): StreakRecord { return { id: String(row.id), startDate: String(row.start_date), endDate: String(row.end_date), duration: Number(row.duration ?? 0), resetReason: String(row.reset_reason ?? ""), createdAt: String(row.created_at) }; }
function fromAchievement(row: Record<string, unknown>): Achievement { return { id: String(row.id), type: String(row.achievement_type), label: String(row.achievement_type), unlockedAt: String(row.unlocked_at) }; }
