export type Mood = 1 | 2 | 3 | 4 | 5;
export type Outcome = "defeated" | "passed" | "relapse" | "ongoing";
export type RecordStatus = "active" | "completed" | "paused" | "archived";

export const TRIGGERS = [
  "Boredom",
  "Stress",
  "Loneliness",
  "Anxiety",
  "Social media",
  "Being alone",
  "Late night",
  "Habit",
  "Sexual content",
  "Conflict",
  "Fatigue",
  "Other",
] as const;

export type Trigger = (typeof TRIGGERS)[number];

export interface CheckIn {
  id: string;
  date: string;
  mood: Mood;
  energy: Mood;
  urgeLevel: number;
  confidence: Mood;
  sleepHours?: number;
  triggers: Trigger[];
  wins: string;
  difficulties: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Urge {
  id: string;
  occurredAt: string;
  intensity: number;
  trigger: Trigger;
  location: string;
  mood: Mood;
  actionTaken: string;
  outcome: Outcome;
  notes: string;
  createdAt: string;
}

export interface Relapse {
  id: string;
  occurredAt: string;
  trigger: Trigger;
  mood: Mood;
  environment: string;
  notes: string;
  reflection: string;
  createdAt: string;
}

export interface StreakRecord {
  id: string;
  startDate: string;
  endDate: string;
  duration: number;
  resetReason: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: Mood;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  deadline?: string;
  status: RecordStatus;
  createdAt: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: RecordStatus;
  progress: number;
  createdAt: string;
}

export interface Achievement {
  id: string;
  type: string;
  label: string;
  unlockedAt: string;
}

export interface RecoveryProgram {
  id: string;
  name: string;
  description: string;
  duration: number;
  focus: string;    days: { day: number; title: string; exercise: string }[];
}

export interface Profile {
  id: string;
  displayName: string;
  goalDays: number;
  timezone: string;
  primaryGoal?: string;
  preferredApproach?: string;
  commonTriggers?: Trigger[];
  onboardingComplete?: boolean;
  remindersEnabled?: boolean;
  aiStorageEnabled?: boolean;
  createdAt: string;
}

export interface RecoveryState {
  profile: Profile;
  streakStartedAt: string;
  streakHistory: StreakRecord[];
  checkIns: CheckIn[];
  urges: Urge[];
  relapses: Relapse[];
  journalEntries: JournalEntry[];
  deletedJournalEntryIds: string[];
  goals: Goal[];
  challenges: Challenge[];
  achievements: Achievement[];
  activeProgramId?: string;
  programProgress: Record<string, number[]>;
}

export const DEFAULT_PROFILE: Profile = {
  id: "demo-user",
  displayName: "there",
  goalDays: 90,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  primaryGoal: "Build more self-control",
  preferredApproach: "Small daily actions",
  commonTriggers: [],
  onboardingComplete: false,
  remindersEnabled: true,
  aiStorageEnabled: false,
  createdAt: new Date().toISOString(),
};

export const defaultState = (): RecoveryState => ({
  profile: { ...DEFAULT_PROFILE },
  streakStartedAt: new Date().toISOString(),
  streakHistory: [],
  checkIns: [],
  urges: [],
  relapses: [],
  journalEntries: [],
  deletedJournalEntryIds: [],
  goals: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      title: "Build a daily check-in rhythm",
      description: "Check in every day for the next two weeks.",
      target: 14,
      current: 0,
      status: "active",
      createdAt: new Date().toISOString(),
    },
  ],
  challenges: [
    {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Phone-free bedroom",
      description: "Keep your phone outside the bedroom for 7 days.",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
      status: "active",
      progress: 0,
      createdAt: new Date().toISOString(),
    },
  ],
  achievements: [],
  programProgress: {},
});
