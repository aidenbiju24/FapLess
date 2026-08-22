import type { RecoveryProgram } from "@/types/recovery";

export const RECOVERY_PROGRAMS: RecoveryProgram[] = [
  {
    id: "seven-day-reset",
    name: "7-day reset",
    description: "Create awareness, reduce friction, and build a calmer response to urges.",
    duration: 7,
    focus: "Awareness and environment",
    days: [
      { day: 1, title: "Name the direction", exercise: "Write one honest reason you want a different pattern." },
      { day: 2, title: "Notice the cue", exercise: "Record one trigger without trying to fix it immediately." },
      { day: 3, title: "Change one environment", exercise: "Move one high-risk device or app out of easy reach." },
      { day: 4, title: "Practice a pause", exercise: "Take five slow breaths before your next automatic choice." },
      { day: 5, title: "Build a replacement", exercise: "Choose a five-minute action you can do when an urge appears." },
      { day: 6, title: "Review what worked", exercise: "Write down one strategy that made a moment easier." },
      { day: 7, title: "Keep the useful part", exercise: "Choose two practices to carry into next week." },
    ],
  },
  {
    id: "fourteen-day-foundation",
    name: "14-day foundation",
    description: "Turn trigger awareness into repeatable routines and recovery skills.",
    duration: 14,
    focus: "Routines and coping skills",
    days: Array.from({ length: 14 }, (_, index) => ({ day: index + 1, title: index < 7 ? `Awareness practice ${index + 1}` : `Routine practice ${index + 1}`, exercise: index < 7 ? "Complete a short check-in and identify the strongest signal." : "Use one planned coping action before returning to your routine." })),
  },
  {
    id: "thirty-day-self-control",
    name: "30-day self-control",
    description: "Strengthen consistency, emotional regulation, and long-term planning.",
    duration: 30,
    focus: "Consistency and resilience",
    days: Array.from({ length: 30 }, (_, index) => ({ day: index + 1, title: `Day ${index + 1} practice`, exercise: "Check in, protect your environment, and record one useful observation." })),
  },
];
