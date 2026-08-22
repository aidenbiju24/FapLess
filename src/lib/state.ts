import { defaultState, type RecoveryState } from "@/types/recovery";

export function normalizeState(input: Partial<RecoveryState> | null | undefined): RecoveryState {
  const fallback = defaultState();
  return {
    ...fallback,
    ...input,
    profile: { ...fallback.profile, ...(input?.profile ?? {}) },
    streakHistory: input?.streakHistory ?? [],
    checkIns: input?.checkIns ?? [],
    urges: input?.urges ?? [],
    relapses: input?.relapses ?? [],
    journalEntries: input?.journalEntries ?? [],
    goals: input?.goals ?? fallback.goals,
    challenges: input?.challenges ?? fallback.challenges,
    achievements: input?.achievements ?? [],
    programProgress: input?.programProgress ?? {},
  };
}
