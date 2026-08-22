import type { CheckIn, RecoveryState, StreakRecord, Urge } from "../types/recovery";

const DAY = 86400000;

function safeTimeZone(timeZone?: string): string | undefined {
  if (!timeZone) return undefined;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return timeZone;
  } catch {
    return undefined;
  }
}

function calendarDay(value: string | Date, timeZone?: string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = typeof value === "string" ? new Date(value) : value;
  const validTimeZone = safeTimeZone(timeZone);
  if (validTimeZone) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: validTimeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayNumber(value: string | Date, timeZone?: string): number {
  const [year, month, day] = calendarDay(value, timeZone).split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY;
}

export function daysSince(isoDate: string, now = new Date(), timeZone?: string): number {
  return Math.max(0, Math.floor(dayNumber(now, timeZone) - dayNumber(isoDate, timeZone)) + 1);
}

export function currentStreak(state: RecoveryState, now = new Date()): number {
  if (!state.streakStartedAt) return 0;
  return daysSince(state.streakStartedAt, now, state.profile.timezone);
}

export function streakDuration(startDate: string, endDate: string, timeZone?: string): number {
  return Math.max(0, Math.floor(dayNumber(endDate, timeZone) - dayNumber(startDate, timeZone)));
}

export function historicalStreaks(state: RecoveryState): StreakRecord[] {
  return [...(state.streakHistory ?? [])].sort((a, b) => b.duration - a.duration);
}

export function longestStreak(state: RecoveryState, now = new Date()): number {
  return Math.max(currentStreak(state, now), ...historicalStreaks(state).map((streak) => streak.duration), 0);
}

export function averageMood(checkIns: CheckIn[]): number {
  if (!checkIns.length) return 0;
  return checkIns.reduce((sum, checkIn) => sum + checkIn.mood, 0) / checkIns.length;
}

export function urgeStats(urges: Urge[], timeZone?: string) {
  const defeated = urges.filter((urge) => urge.outcome === "defeated" || urge.outcome === "passed").length;
  const triggerCounts = urges.reduce<Record<string, number>>((counts, urge) => {
    counts[urge.trigger] = (counts[urge.trigger] || 0) + 1;
    return counts;
  }, {});
  const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0];
  const hourCounts = urges.reduce<Record<number, number>>((counts, urge) => {
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: safeTimeZone(timeZone), hour: "2-digit", hour12: false }).format(new Date(urge.occurredAt)));
    counts[hour] = (counts[hour] || 0) + 1;
    return counts;
  }, {});
  const topHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  return {
    total: urges.length,
    defeated,
    averageIntensity: urges.length ? urges.reduce((sum, urge) => sum + urge.intensity, 0) / urges.length : 0,
    highestIntensity: urges.length ? Math.max(...urges.map((urge) => urge.intensity)) : 0,
    defeatPercentage: urges.length ? Math.round((defeated / urges.length) * 100) : 0,
    topTrigger: topTrigger?.[0] || "No pattern yet",
    topTriggerCount: topTrigger?.[1] || 0,
    highestRiskHour: topHour ? `${String(Number(topHour[0])).padStart(2, "0")}:00` : "No pattern yet",
  };
}

export function checkInConsistency(checkIns: CheckIn[], now = new Date()): number {
  if (!checkIns.length) return 0;
  const oldest = checkIns.reduce((oldestDate, checkIn) => checkIn.date < oldestDate ? checkIn.date : oldestDate, checkIns[0].date);
  const days = Math.max(1, daysSince(oldest, now));
  return Math.min(100, Math.round((checkIns.length / days) * 100));
}

export function recoveryScore(state: RecoveryState, now = new Date()): number {
  const streakScore = Math.min(25, (currentStreak(state, now) / Math.max(1, state.profile.goalDays)) * 25);
  const checkInScore = Math.min(25, (checkInConsistency(state.checkIns, now) / 100) * 25);
  const urgeScore = Math.min(20, state.urges.length ? (urgeStats(state.urges).defeated / state.urges.length) * 20 : 0);
  const journalScore = Math.min(15, state.journalEntries.length * 1.5);
  const challengeScore = Math.min(15, state.challenges.filter((challenge) => challenge.status === "completed").length * 5);
  return Math.round(streakScore + checkInScore + urgeScore + journalScore + challengeScore);
}

export function recoveryPhase(streak: number): { name: string; range: string; focus: string } {
  if (streak <= 7) return { name: "Starting", range: "Days 0-7", focus: "Awareness, environment, and trigger identification" };
  if (streak <= 14) return { name: "Building", range: "Days 8-14", focus: "Coping mechanisms, routines, and urge management" };
  if (streak <= 30) return { name: "Rewiring", range: "Days 15-30", focus: "Long-term habits and emotional regulation" };
  if (streak <= 60) return { name: "Strengthening", range: "Days 31-60", focus: "Consistency, resilience, and identity" };
  if (streak <= 90) return { name: "Mastery", range: "Days 61-90", focus: "High-risk situations and personal strategy" };
  return { name: "Maintenance", range: "90+ days", focus: "Sustainable habits and preventing complacency" };
}

export function formatDate(isoDate: string, timeZone?: string): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(isoDate);
  const validTimeZone = safeTimeZone(timeZone);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric", ...(dateOnly ? { timeZone: "UTC" } : validTimeZone ? { timeZone: validTimeZone } : {}) };
  return new Intl.DateTimeFormat(undefined, options).format(dateOnly ? new Date(`${isoDate}T00:00:00Z`) : new Date(isoDate));
}

export function createId(_prefix: string): string {
  const cryptoObject = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : null;
  if (cryptoObject?.randomUUID) return cryptoObject.randomUUID();
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

export function localDateNow(timeZone?: string): string {
  return calendarDay(new Date(), timeZone);
}

export function dateInTimeZone(value: string | Date, timeZone?: string): string {
  return calendarDay(value, timeZone);
}

export function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function currentCalendarMonth(timeZone?: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: safeTimeZone(timeZone), year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const today = Number(values.day);
  const firstDate = new Date(Date.UTC(year, month - 1, 1));
  const lastDate = new Date(Date.UTC(year, month, 0));
  return {
    year,
    month,
    today,
    firstDay: firstDate.getUTCDay(),
    days: lastDate.getUTCDate(),
    label: new Intl.DateTimeFormat(undefined, { timeZone: "UTC", month: "long", year: "numeric" }).format(firstDate),
  };
}
