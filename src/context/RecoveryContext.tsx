import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useAuth } from "@/context/AuthContext";
import { clearState, loadState, saveState } from "@/lib/storage";
import { pullCloudState, pushCloudState } from "@/lib/cloudSync";
import { createId, currentStreak, longestStreak, recoveryScore, recoveryPhase, urgeStats, streakDuration, localDateNow } from "@/lib/recovery";
import { earnedAchievements, levelForXp, nextLevel, recoveryXp } from "@/lib/gamification";
import { defaultState, type CheckIn, type Challenge, type Goal, type JournalEntry, type Mood, type RecoveryProgram, type RecoveryState, type Relapse, type Trigger, type Urge } from "@/types/recovery";
import { normalizeState } from "@/lib/state";

interface NewCheckIn {
  mood: Mood;
  energy: Mood;
  urgeLevel: number;
  confidence: Mood;
  sleepHours?: number;
  triggers: Trigger[];
  wins: string;
  difficulties: string;
  notes: string;
}

interface NewUrge {
  intensity: number;
  trigger: Trigger;
  location: string;
  mood: Mood;
  actionTaken: string;
  outcome: Urge["outcome"];
  notes: string;
  occurredAt?: string;
}

interface NewRelapse {
  trigger: Trigger;
  mood: Mood;
  environment: string;
  notes: string;
  reflection: string;
  occurredAt?: string;
}

interface RecoveryContextValue {
  state: RecoveryState;
  hydrated: boolean;
  streak: number;
  longest: number;
  score: number;
  phase: ReturnType<typeof recoveryPhase>;
  stats: ReturnType<typeof urgeStats>;
  xp: number;
  level: ReturnType<typeof levelForXp>;
  nextLevel: ReturnType<typeof nextLevel>;
  earnedAchievements: ReturnType<typeof earnedAchievements>;
  completeOnboarding: (input: { displayName: string; goalDays: number; primaryGoal: string; preferredApproach: string; commonTriggers: Trigger[]; remindersEnabled: boolean }) => void;
  setAiStorageEnabled: (enabled: boolean) => void;
  activateProgram: (program: RecoveryProgram) => void;
  completeProgramDay: (programId: string, day: number) => void;
  addCheckIn: (input: NewCheckIn) => void;
  addUrge: (input: NewUrge) => void;
  addRelapse: (input: NewRelapse) => void;
  addJournal: (input: Pick<JournalEntry, "title" | "content" | "mood" | "tags">) => void;
  deleteJournal: (id: string) => void;
  addGoal: (input: Pick<Goal, "title" | "description" | "target" | "deadline">) => void;
  incrementGoal: (id: string) => void;
  completeChallenge: (id: string) => void;
  addChallenge: (input: Pick<Challenge, "name" | "description" | "startDate" | "endDate">) => void;
  updateProfile: (displayName: string, goalDays: number) => void;
  exportData: () => string;
  resetLocalData: () => Promise<void>;
}

const RecoveryContext = createContext<RecoveryContextValue | null>(null);

export function RecoveryProvider({ children }: PropsWithChildren) {
  const { userId } = useAuth();
  const scope = userId ?? "demo-user";
  const [state, setState] = useState<RecoveryState>(() => defaultState());
  const [hydrated, setHydrated] = useState(false);
  const skipNextPersistence = useRef(false);
  const cloudSyncEnabled = useRef(true);
  const cloudSyncQueue = useRef(Promise.resolve());

  useEffect(() => {
    cloudSyncEnabled.current = true;
    let active = true;
    const hydrationReset = setTimeout(() => setHydrated(false), 0);
    loadState(scope).then(async (stored) => {
      const local = normalizeState(stored);
      try {
        const cloud = await pullCloudState(local);
        if (active) setState(cloud);
      } catch {
        if (active) setState(local);
      } finally {
        if (active) setHydrated(true);
      }
    });
    return () => { active = false; clearTimeout(hydrationReset); };
  }, [scope]);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextPersistence.current) { skipNextPersistence.current = false; return; }
    const persistCloud = cloudSyncEnabled.current;
    void saveState(state, scope).then(() => {
      if (!persistCloud) return;
      cloudSyncQueue.current = cloudSyncQueue.current
        .then(() => pushCloudState(state))
        .catch(() => undefined);
    }).catch(() => undefined);
  }, [state, hydrated, scope]);

  const update = (next: RecoveryState) => setState({ ...next, achievements: earnedAchievements(next) });

  const value = useMemo<RecoveryContextValue>(() => {
    const now = new Date();
    return {
      state,
      hydrated,
      streak: currentStreak(state, now),
      longest: longestStreak(state, now),
      score: recoveryScore(state, now),
      phase: recoveryPhase(currentStreak(state, now)),
      stats: urgeStats(state.urges, state.profile.timezone),
      xp: recoveryXp(state),
      level: levelForXp(recoveryXp(state)),
      nextLevel: nextLevel(recoveryXp(state)),
      earnedAchievements: earnedAchievements(state),
      completeOnboarding: (input) => update({ ...state, profile: { ...state.profile, ...input, displayName: input.displayName.trim() || "there", goalDays: Math.max(1, input.goalDays), onboardingComplete: true }, goals: state.goals.length ? state.goals : [{ id: createId("goal"), title: input.primaryGoal, description: "Make progress with one sustainable action at a time.", target: Math.max(1, input.goalDays), current: 0, status: "active", createdAt: new Date().toISOString() }] }),
      setAiStorageEnabled: (enabled) => update({ ...state, profile: { ...state.profile, aiStorageEnabled: enabled } }),
      activateProgram: (program) => update({ ...state, activeProgramId: program.id, programProgress: { ...state.programProgress, [program.id]: state.programProgress[program.id] ?? [] } }),
      completeProgramDay: (programId, day) => update({ ...state, programProgress: { ...state.programProgress, [programId]: Array.from(new Set([...(state.programProgress[programId] ?? []), day])).sort((a, b) => a - b) } }),
      addCheckIn: (input) => {
        const nowIso = new Date().toISOString();
        const date = localDateNow(state.profile.timezone);
        const existing = state.checkIns.find((checkIn) => checkIn.date === date);
        const checkIn: CheckIn = { id: existing?.id ?? createId("checkin"), date, ...input, createdAt: existing?.createdAt ?? nowIso, updatedAt: nowIso };
        update({ ...state, checkIns: existing ? state.checkIns.map((item) => item.id === existing.id ? checkIn : item) : [checkIn, ...state.checkIns] });
      },
      addUrge: (input) => {
        const nowIso = new Date().toISOString();
        const urge: Urge = { id: createId("urge"), ...input, occurredAt: input.occurredAt ?? nowIso, createdAt: nowIso };
        update({ ...state, urges: [urge, ...state.urges] });
      },
      addRelapse: (input) => {
        const nowIso = new Date().toISOString();
        const occurredAt = input.occurredAt ?? nowIso;
        const relapse: Relapse = { id: createId("relapse"), ...input, occurredAt, createdAt: nowIso };
        const duration = streakDuration(state.streakStartedAt, occurredAt, state.profile.timezone);
        const history = duration > 0 ? [{ id: createId("streak"), startDate: state.streakStartedAt, endDate: occurredAt, duration, resetReason: input.trigger, createdAt: nowIso }, ...state.streakHistory] : state.streakHistory;
        const nextStreakStartedAt = occurredAt > state.streakStartedAt ? occurredAt : state.streakStartedAt;
        update({ ...state, relapses: [relapse, ...state.relapses], streakHistory: history, streakStartedAt: nextStreakStartedAt });
      },
      addJournal: (input) => {
        const nowIso = new Date().toISOString();
        const entry: JournalEntry = { id: createId("journal"), ...input, createdAt: nowIso, updatedAt: nowIso };
        update({ ...state, journalEntries: [entry, ...state.journalEntries] });
      },
      deleteJournal: (id) => update({ ...state, journalEntries: state.journalEntries.filter((entry) => entry.id !== id), deletedJournalEntryIds: Array.from(new Set([...state.deletedJournalEntryIds, id])) }),
      addGoal: (input) => update({ ...state, goals: [{ id: createId("goal"), ...input, current: 0, status: "active", createdAt: new Date().toISOString() }, ...state.goals] }),
      incrementGoal: (id) => update({ ...state, goals: state.goals.map((goal) => goal.id === id ? { ...goal, current: Math.min(goal.target, goal.current + 1), status: goal.current + 1 >= goal.target ? "completed" : goal.status } : goal) }),
      completeChallenge: (id) => update({ ...state, challenges: state.challenges.map((challenge) => challenge.id === id ? { ...challenge, progress: 100, status: "completed" } : challenge) }),
      addChallenge: (input) => update({ ...state, challenges: [{ id: createId("challenge"), ...input, status: "active", progress: 0, createdAt: new Date().toISOString() }, ...state.challenges] }),
      updateProfile: (displayName, goalDays) => update({ ...state, profile: { ...state.profile, displayName: displayName.trim() || "there", goalDays: Math.max(1, goalDays) } }),
      exportData: () => JSON.stringify({ ...state, exportedAt: new Date().toISOString(), exportVersion: 1 }, null, 2),
      resetLocalData: async () => {
        await cloudSyncQueue.current;
        await clearState(scope);
        if (userId) {
          try {
            const cloudState = await pullCloudState(defaultState());
            cloudSyncEnabled.current = true;
            skipNextPersistence.current = true;
            setState(cloudState);
          } catch {
            cloudSyncEnabled.current = false;
            skipNextPersistence.current = true;
            setState(defaultState());
          }
        } else {
          cloudSyncEnabled.current = false;
          skipNextPersistence.current = true;
          setState(defaultState());
        }
      },
    };
  }, [state, hydrated, scope, userId]);

  return <RecoveryContext.Provider value={value}>{children}</RecoveryContext.Provider>;
}

export function useRecovery(): RecoveryContextValue {
  const context = useContext(RecoveryContext);
  if (!context) throw new Error("useRecovery must be used inside RecoveryProvider");
  return context;
}
