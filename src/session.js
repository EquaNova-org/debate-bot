/**
 * In-memory session store.
 * Each user gets their own session keyed by Telegram user ID.
 *
 * Session shape:
 * {
 *   state: STATE.*,
 *   topic: string,
 *   history: [ { role: "user"|"assistant", content: string } ],
 *   rating: number | null,       // last rating given by the AI
 *   turnCount: number,           // how many user arguments submitted
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

export function resetSession(userId) {
  sessions.set(userId, createFreshSession());
}

function createFreshSession() {
  return {
    state: "IDLE",
    topic: null,
    history: [],
    rating: null,
    turnCount: 0,
  };
}
