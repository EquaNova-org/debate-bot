import dotenv from "dotenv";
dotenv.config();

export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const MODEL = "claude-sonnet-4-20250514";
export const MAX_TOKENS = 1024;

// Debate session states
export const STATE = {
  IDLE: "IDLE",
  AWAITING_TOPIC: "AWAITING_TOPIC",
  DEBATING: "DEBATING",
  AWAITING_FEEDBACK_REQUEST: "AWAITING_FEEDBACK_REQUEST",
};

if (!TELEGRAM_TOKEN || !ANTHROPIC_API_KEY) {
  console.error("❌ Missing TELEGRAM_TOKEN or ANTHROPIC_API_KEY in .env");
  process.exit(1);
}
