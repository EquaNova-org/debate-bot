import dotenv from "dotenv";
dotenv.config();

export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const MODEL = "claude-sonnet-4-20250514";
export const MAX_TOKENS = 1024;

// ─── Session States ───────────────────────────────────────────────────────────
export const STATE = {
  IDLE: "IDLE",
  AWAITING_TOPIC: "AWAITING_TOPIC",
  AWAITING_MODE: "AWAITING_MODE",
  DEBATING: "DEBATING",
};

// ─── Debate Modes ─────────────────────────────────────────────────────────────
export const MODE = {
  STANDARD: "STANDARD",
  JUDGE: "JUDGE",
  TIME_PRESSURE: "TIME_PRESSURE",
  REBUTTAL: "REBUTTAL",
  CROSS_EXAM: "CROSS_EXAM",
};

export const MODE_INFO = {
  [MODE.STANDARD]: {
    label: "⚖️ Standard Debate",
    description: "Full debate with ratings, feedback, and devil's advocate questions.",
    emoji: "⚖️",
  },
  [MODE.JUDGE]: {
    label: "🏛️ Judge Simulation",
    description: "Strict rubric scoring. Evaluated like a real competition judge — no mercy.",
    emoji: "🏛️",
  },
  [MODE.TIME_PRESSURE]: {
    label: "⏱️ Time-Pressure Rounds",
    description: "You get 60 seconds to type your argument. Builds speed and clarity under pressure.",
    emoji: "⏱️",
  },
  [MODE.REBUTTAL]: {
    label: "🔄 Rebuttal-Only Practice",
    description: "I make arguments, you rebut them. Pure counter-argumentation training.",
    emoji: "🔄",
  },
  [MODE.CROSS_EXAM]: {
    label: "🎯 Cross-Examination Trainer",
    description: "I play a witness/opponent. You question me to expose contradictions.",
    emoji: "🎯",
  },
};

// ─── Ranks & XP ───────────────────────────────────────────────────────────────
export const RANKS = [
  { name: "🥉 Novice",          minXP: 0    },
  { name: "📚 Apprentice",      minXP: 50   },
  { name: "🗣️ Debater",         minXP: 150  },
  { name: "⚔️ Challenger",      minXP: 300  },
  { name: "🏆 Advocate",        minXP: 500  },
  { name: "🌟 Master Debater",  minXP: 750  },
  { name: "👑 Grand Champion",  minXP: 1000 },
];

export function getRank(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r;
  }
  return rank;
}

export function getNextRank(xp) {
  return RANKS.find((r) => r.minXP > xp) || null;
}

// XP earned per action
export const XP_AWARDS = {
  ARGUMENT_SUBMITTED: 5,
  RATING_BONUS: (rating) => Math.floor(rating * 1.5), // up to +15 for a 10
  FEEDBACK_REQUESTED: 10,
  MODE_COMPLETED: 20,
};

if (!TELEGRAM_TOKEN || !ANTHROPIC_API_KEY) {
  console.error("❌ Missing TELEGRAM_TOKEN or ANTHROPIC_API_KEY in .env");
  process.exit(1);
}
