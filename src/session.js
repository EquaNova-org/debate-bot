import { getRank, getNextRank, XP_AWARDS } from "./config.js";

/**
 * In-memory session store.
 *
 * Session shape:
 * {
 *   state: STATE.*,
 *   mode: MODE.*,
 *   topic: string | null,
 *   history: [ { role, content } ],
 *   rating: number | null,
 *   turnCount: number,
 *   timePressureDeadline: timestamp | null,   // for TIME_PRESSURE mode
 *
 *   // Progress tracking (persists across debates in same session)
 *   xp: number,
 *   weaknesses: { [weakness]: count },         // e.g. { "lack of evidence": 3 }
 *   ratingsHistory: number[],                  // all ratings received
 *   debatesCompleted: number,
 *   modesUsed: Set<string>,
 * }
 */

const sessions = new Map();

export function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, createFreshSession());
  }
  return sessions.get(userId);
}

export function setSession(userId, data) {
  sessions.set(userId, { ...getSession(userId), ...data });
}

// Only resets the current debate, NOT the progress/XP
export function resetDebate(userId) {
  const session = getSession(userId);
  sessions.set(userId, {
    ...session,
    state: "IDLE",
    mode: null,
    topic: null,
    history: [],
    rating: null,
    turnCount: 0,
    timePressureDeadline: null,
  });
}

// Full reset — wipes everything including XP
export function resetSession(userId) {
  sessions.set(userId, createFreshSession());
}

// Award XP and track rank-up
export function awardXP(userId, amount) {
  const session = getSession(userId);
  const oldRank = getRank(session.xp);
  const newXP = session.xp + amount;
  const newRank = getRank(newXP);
  setSession(userId, { xp: newXP });
  const rankedUp = newRank.name !== oldRank.name;
  return { newXP, newRank, rankedUp, oldRank };
}

// Log a weakness identified by AI
export function logWeakness(userId, weakness) {
  const session = getSession(userId);
  const weaknesses = { ...session.weaknesses };
  weaknesses[weakness] = (weaknesses[weakness] || 0) + 1;
  setSession(userId, { weaknesses });
}

// Log a rating to history
export function logRating(userId, rating) {
  const session = getSession(userId);
  const ratingsHistory = [...session.ratingsHistory, rating];
  setSession(userId, { ratingsHistory, rating });
}

export function getProgressSummary(userId) {
  const session = getSession(userId);
  const rank = getRank(session.xp);
  const nextRank = getNextRank(session.xp);
  const avgRating =
    session.ratingsHistory.length > 0
      ? (session.ratingsHistory.reduce((a, b) => a + b, 0) / session.ratingsHistory.length).toFixed(1)
      : "N/A";
  const topWeaknesses = Object.entries(session.weaknesses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w, c]) => `• ${w} (×${c})`);

  return { rank, nextRank, avgRating, topWeaknesses, xp: session.xp, debatesCompleted: session.debatesCompleted };
}

function createFreshSession() {
  return {
    // Current debate state
    state: "IDLE",
    mode: null,
    topic: null,
    history: [],
    rating: null,
    turnCount: 0,
    timePressureDeadline: null,

    // Progress (survives debate resets)
    xp: 0,
    weaknesses: {},
    ratingsHistory: [],
    debatesCompleted: 0,
    modesUsed: new Set(),
  };
}
