import type { Achievement, RecoveryState } from "@/types/recovery";
import { currentStreak } from "@/lib/recovery";

const LEVELS = [
  { level: 1, name: "Beginner", xp: 0 },
  { level: 5, name: "Starting", xp: 100 },
  { level: 10, name: "Rising", xp: 300 },
  { level: 20, name: "Strong", xp: 750 },
  { level: 30, name: "Disciplined", xp: 1400 },
  { level: 40, name: "Mastery", xp: 2400 },
  { level: 50, name: "Legendary", xp: 4000 },
] as const;

export function recoveryXp(state: RecoveryState): number {
  const checkIns = state.checkIns.length * 10;
  const journals = state.journalEntries.length * 10;
  const urgesDefeated = state.urges.filter((urge) => urge.outcome === "defeated" || urge.outcome === "passed").length * 15;
  const challenges = state.challenges.filter((challenge) => challenge.status === "completed").length * 50;
  const milestones = [1, 3, 7, 14, 21, 30, 45, 60, 90, 120, 180, 365].filter((day) => currentStreak(state) >= day).length * 20;
  return checkIns + journals + urgesDefeated + challenges + milestones;
}

export function levelForXp(xp: number) {
  return LEVELS.reduce((current, level) => xp >= level.xp ? level : current, LEVELS[0]);
}

export function nextLevel(xp: number) {
  return LEVELS.find((level) => level.xp > xp) ?? { ...LEVELS[LEVELS.length - 1], xp: 4000 };
}

export function earnedAchievements(state: RecoveryState): Achievement[] {
  const now = new Date().toISOString();
  const achievements: [string, string, boolean][] = [
    ["first-checkin", "First Check-In", state.checkIns.length >= 1],
    ["first-journal", "First Journal Entry", state.journalEntries.length >= 1],
    ["first-urge-defeated", "First Urge Defeated", state.urges.some((urge) => urge.outcome === "defeated" || urge.outcome === "passed")],
    ["recovered-after-relapse", "Recovered After Setback", state.relapses.length >= 1 && currentStreak(state) > 1],
    ["seven-days", "7 Days", currentStreak(state) >= 7],
    ["fourteen-days", "14 Days", currentStreak(state) >= 14],
    ["thirty-days", "30 Days", currentStreak(state) >= 30],
    ["ten-urges", "10 Urges Defeated", state.urges.filter((urge) => urge.outcome === "defeated" || urge.outcome === "passed").length >= 10],
    ["thirty-journals", "30 Journal Entries", state.journalEntries.length >= 30],
  ];
  return achievements.filter(([, , earned]) => earned).map(([type, label]) => ({ id: type, type, label, unlockedAt: state.achievements.find((achievement) => achievement.type === type)?.unlockedAt ?? now }));
}
