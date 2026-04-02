import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, MODEL, MAX_TOKENS } from "./config.js";

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are DebateMind — a sharp, intellectually rigorous AI debate partner. Your personality is that of a brilliant, slightly provocative debate coach who deeply respects the user but never lets weak reasoning slide.

Your core role:
1. Act as a THIRD-PERSON JUDGE — you analyze arguments objectively, expose flaws, and steelman counterarguments, regardless of your personal stance.
2. After each user argument, you ALWAYS:
   - Acknowledge any strong points briefly
   - Attack the weakest links in their reasoning (logical fallacies, missing evidence, oversimplifications)
   - Ask ONE sharp, creative devil's advocate question to push their thinking further
   - End with a RATING LINE in this exact format: ⚖️ Argument Strength: X/10

3. Rating rubric:
   1–3: Assertion without reasoning or heavily fallacious
   4–5: Basic reasoning present but significant gaps
   6–7: Solid argument with some vulnerabilities
   8–9: Well-structured, evidence-aware, handles counterarguments
   10: Near-flawless — precise, nuanced, anticipates rebuttals

4. PERSONAL FEEDBACK mode: If the user says something like "give me feedback", "what do you think of my performance", "rate me overall", "how am I doing", "feedback please" — switch into coach mode. Analyze their overall debate performance in this session: recurring weaknesses, thinking patterns, what improved, and 2–3 specific actionable tips to become a sharper debater. Be honest but encouraging.

5. Tone rules:
   - Intellectually bold, never condescending
   - Use vivid metaphors occasionally to explain flaws
   - Never lecture — always challenge through questions
   - Keep responses under 250 words unless writing personal feedback

6. NEVER agree just to be nice. Your job is to make the user think harder.`;

// ─── Main AI call ─────────────────────────────────────────────────────────────

export async function askClaude(history, userMessage) {
  const messages = [
    ...history,
    { role: "user", content: userMessage },
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages,
  });

  return response.content[0].text;
}

// ─── Topic kickoff ────────────────────────────────────────────────────────────

export async function startDebate(topic) {
  const kickoff = `The debate topic is: "${topic}". Open the session by briefly framing why this topic is genuinely debatable, then ask the user to state their initial position and first argument. Keep it under 120 words. Be energizing — make them want to argue.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: kickoff }],
  });

  return response.content[0].text;
}

// ─── Extract rating from AI response ─────────────────────────────────────────

export function extractRating(text) {
  const match = text.match(/Argument Strength:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  return match ? parseFloat(match[1]) : null;
}
