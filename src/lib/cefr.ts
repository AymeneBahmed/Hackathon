// Lightweight English placement test bank. Mixed skills, ordered easy -> hard.
export type PlacementSkill = "vocabulary" | "grammar" | "reading" | "listening";

export interface PlacementQuestion {
  id: string;
  skill: PlacementSkill;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  prompt: string;
  passage?: string;
  options: string[];
  answerIndex: number;
}

export const PLACEMENT_BANK: PlacementQuestion[] = [
  {
    id: "v1",
    skill: "vocabulary",
    level: "A1",
    prompt: "Choose the opposite of 'big'.",
    options: ["small", "tall", "wide", "long"],
    answerIndex: 0,
  },
  {
    id: "g1",
    skill: "grammar",
    level: "A1",
    prompt: "She ___ a student.",
    options: ["am", "is", "are", "be"],
    answerIndex: 1,
  },
  {
    id: "v2",
    skill: "vocabulary",
    level: "A2",
    prompt: "Which word means 'a place to sleep when traveling'?",
    options: ["hotel", "kitchen", "garden", "library"],
    answerIndex: 0,
  },
  {
    id: "g2",
    skill: "grammar",
    level: "A2",
    prompt: "Yesterday I ___ to the market.",
    options: ["go", "goes", "went", "gone"],
    answerIndex: 2,
  },
  {
    id: "r1",
    skill: "reading",
    level: "A2",
    passage: "Maya wakes up at 6 a.m., drinks coffee, and goes for a short run before work.",
    prompt: "What does Maya do before work?",
    options: ["She cooks dinner.", "She runs.", "She watches TV.", "She studies."],
    answerIndex: 1,
  },
  {
    id: "g3",
    skill: "grammar",
    level: "B1",
    prompt: "If I ___ more time, I would learn the piano.",
    options: ["have", "had", "would have", "will have"],
    answerIndex: 1,
  },
  {
    id: "v3",
    skill: "vocabulary",
    level: "B1",
    prompt: "'To postpone' means to ___.",
    options: ["cancel", "delay", "finish", "speed up"],
    answerIndex: 1,
  },
  {
    id: "r2",
    skill: "reading",
    level: "B1",
    passage:
      "Although the project ran over budget, the team delivered ahead of schedule, which impressed the client.",
    prompt: "What surprised the client?",
    options: ["The budget", "The early delivery", "The team size", "The location"],
    answerIndex: 1,
  },
  {
    id: "g4",
    skill: "grammar",
    level: "B2",
    prompt: "By the time we arrived, the show ___ already ___.",
    options: ["has / started", "had / started", "was / starting", "is / started"],
    answerIndex: 1,
  },
  {
    id: "v4",
    skill: "vocabulary",
    level: "B2",
    prompt: "A 'meticulous' person is ___.",
    options: ["careless", "very careful", "lazy", "loud"],
    answerIndex: 1,
  },
  {
    id: "r3",
    skill: "reading",
    level: "C1",
    passage:
      "Notwithstanding the committee's reservations, the proposal was endorsed unanimously, signalling a marked shift in policy.",
    prompt: "What did the committee do?",
    options: [
      "Rejected the proposal",
      "Approved it despite concerns",
      "Postponed the vote",
      "Resigned",
    ],
    answerIndex: 1,
  },
  {
    id: "g5",
    skill: "grammar",
    level: "C1",
    prompt: "Rarely ___ such craftsmanship in modern furniture.",
    options: ["you see", "do you see", "you do see", "see you"],
    answerIndex: 1,
  },
];

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"] as const;

export function scorePlacement(answers: Record<string, number>) {
  const perLevel: Record<string, { correct: number; total: number }> = {};
  const perSkill: Record<string, { correct: number; total: number }> = {};
  for (const q of PLACEMENT_BANK) {
    const picked = answers[q.id];
    const correct = picked === q.answerIndex;
    perLevel[q.level] ??= { correct: 0, total: 0 };
    perLevel[q.level].total++;
    if (correct) perLevel[q.level].correct++;
    perSkill[q.skill] ??= { correct: 0, total: 0 };
    perSkill[q.skill].total++;
    if (correct) perSkill[q.skill].correct++;
  }

  // Highest level where >=60% correct
  let level: (typeof LEVEL_ORDER)[number] = "A1";
  for (const lv of LEVEL_ORDER) {
    const s = perLevel[lv];
    if (s && s.correct / s.total >= 0.6) level = lv;
  }

  const skills = Object.entries(perSkill).map(([name, s]) => ({
    name,
    pct: Math.round((s.correct / s.total) * 100),
  }));
  const strengths = skills.filter((s) => s.pct >= 70).map((s) => s.name);
  const weaknesses = skills.filter((s) => s.pct < 50).map((s) => s.name);
  const total = Object.values(perLevel).reduce((a, b) => a + b.total, 0);
  const correct = Object.values(perLevel).reduce((a, b) => a + b.correct, 0);
  const confidence = Math.round((correct / total) * 100);

  return { level, confidence, strengths, weaknesses };
}
