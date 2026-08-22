import assert from "node:assert/strict";
import test from "node:test";
import { checkInConsistency, currentStreak, longestStreak, recoveryScore, streakDuration, urgeStats } from "../src/lib/recovery.ts";
import type { RecoveryState } from "../src/types/recovery.ts";

const baseState = (overrides: Partial<RecoveryState> = {}): RecoveryState => ({
  profile: { id: "user", displayName: "Test", goalDays: 90, timezone: "UTC", onboardingComplete: true, createdAt: "2026-01-01T00:00:00.000Z" },
  streakStartedAt: "2026-01-01T12:00:00.000Z",
  streakHistory: [],
  checkIns: [],
  urges: [],
  relapses: [],
  journalEntries: [],
  goals: [],
  challenges: [],
  achievements: [],
  programProgress: {},
  ...overrides,
});

test("counts calendar days rather than elapsed 24-hour periods", () => {
  assert.equal(currentStreak(baseState(), new Date("2026-01-03T01:00:00.000Z")), 3);
});

test("uses the user's timezone for a date boundary", () => {
  const state = baseState({ profile: { ...baseState().profile, timezone: "America/Los_Angeles" }, streakStartedAt: "2026-01-02T07:30:00.000Z" });
  assert.equal(currentStreak(state, new Date("2026-01-03T07:15:00.000Z")), 2);
  assert.equal(currentStreak(state, new Date("2026-01-03T08:15:00.000Z")), 3);
});

test("preserves historical streaks when calculating longest", () => {
  const state = baseState({ streakHistory: [{ id: "s", startDate: "2025-01-01", endDate: "2025-02-01", duration: 31, resetReason: "Stress", createdAt: "2025-02-01" }] });
  assert.equal(longestStreak(state, new Date("2026-01-03T00:00:00.000Z")), 31);
});

test("calculates completed streak duration from calendar dates", () => {
  assert.equal(streakDuration("2026-01-01T23:00:00.000Z", "2026-01-08T01:00:00.000Z", "UTC"), 7);
});

test("returns useful urge analytics without claiming causation", () => {
  const stats = urgeStats([
    { id: "1", occurredAt: "2026-01-01T22:00:00.000Z", intensity: 8, trigger: "Stress", location: "home", mood: 2, actionTaken: "Walk", outcome: "defeated", notes: "", createdAt: "2026-01-01" },
    { id: "2", occurredAt: "2026-01-02T22:30:00.000Z", intensity: 4, trigger: "Stress", location: "home", mood: 3, actionTaken: "Breathe", outcome: "passed", notes: "", createdAt: "2026-01-02" },
  ]);
  assert.deepEqual({ total: stats.total, defeated: stats.defeated, topTrigger: stats.topTrigger, highestRiskHour: stats.highestRiskHour }, { total: 2, defeated: 2, topTrigger: "Stress", highestRiskHour: "16:00" });
});

test("check-in consistency is zero for an empty history", () => {
  assert.equal(checkInConsistency([], new Date("2026-01-01T00:00:00.000Z")), 0);
});

test("recovery score is bounded and rewards multiple recovery behaviors", () => {
  const state = baseState({ checkIns: [{ id: "c", date: "2026-01-03", mood: 4, energy: 4, urgeLevel: 2, confidence: 4, triggers: [], wins: "", difficulties: "", notes: "", createdAt: "2026-01-03", updatedAt: "2026-01-03" }], journalEntries: [{ id: "j", title: "One note", content: "A useful observation", tags: [], createdAt: "2026-01-03", updatedAt: "2026-01-03" }] });
  assert.ok(recoveryScore(state, new Date("2026-01-03T12:00:00.000Z")) > 0);
  assert.ok(recoveryScore(state) <= 100);
});
