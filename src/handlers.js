import { getSession, setSession, resetSession } from "./session.js";
import { askClaude, startDebate, extractRating } from "./ai.js";
import { STATE } from "./config.js";

// ─── Keywords that trigger personal feedback mode ─────────────────────────────
const FEEDBACK_TRIGGERS = [
  "give me feedback",
  "feedback please",
  "my feedback",
  "rate me",
  "rate my performance",
  "how am i doing",
  "what do you think of my performance",
  "overall feedback",
  "how did i do",
  "assess me",
];

function isFeedbackRequest(text) {
  const lower = text.toLowerCase();
  return FEEDBACK_TRIGGERS.some((kw) => lower.includes(kw));
}

// ─── /start ───────────────────────────────────────────────────────────────────
async function handleStart(bot, msg) {
  const userId = msg.from.id;
  resetSession(userId);

  const welcome = `🎯 *Welcome to DebateMind*

I'm your AI debate partner — brutally honest, intellectually sharp, and designed to expose every weakness in your reasoning.

Here's how I work:
• You share an argument → I dissect it
• I rate your reasoning from *1–10*
• I hit you with a devil's advocate question every round
• Ask for *"feedback"* anytime to get a full personal performance review

Ready to sharpen your mind?

Use /debate to pick a topic and begin.
Use /help to see all commands.`;

  await bot.sendMessage(msg.chat.id, welcome, { parse_mode: "Markdown" });
}

// ─── /debate ──────────────────────────────────────────────────────────────────
async function handleDebateCommand(bot, msg) {
  const userId = msg.from.id;
  resetSession(userId);
  setSession(userId, { state: STATE.AWAITING_TOPIC });

  await bot.sendMessage(
    msg.chat.id,
    `🧠 *What do you want to debate?*\n\nType any topic — political, philosophical, scientific, ethical, or everyday. Be specific for a sharper session.\n\n_Example: "Social media does more harm than good" or "Universal Basic Income should be implemented globally"_`,
    { parse_mode: "Markdown" }
  );
}

// ─── /reset ───────────────────────────────────────────────────────────────────
async function handleReset(bot, msg) {
  const userId = msg.from.id;
  resetSession(userId);
  await bot.sendMessage(
    msg.chat.id,
    `🔄 Session reset. Use /debate to start a new topic.`
  );
}

// ─── /help ────────────────────────────────────────────────────────────────────
async function handleHelp(bot, msg) {
  const help = `📖 *DebateMind Commands*

/start — Welcome message
/debate — Start a new debate session
/reset — Clear current session and start over
/help — Show this menu

*During a debate:*
• Just type your argument naturally
• Say *"give me feedback"* or *"rate my performance"* to get a full personal review
• Say *"change topic"* to switch topics
• Use /reset to wipe the session entirely

*Rating Scale:*
1–3 → Weak assertion
4–5 → Basic reasoning
6–7 → Solid but vulnerable
8–9 → Strong, well-structured
10 → Near-flawless`;

  await bot.sendMessage(msg.chat.id, help, { parse_mode: "Markdown" });
}

// ─── Main message handler ─────────────────────────────────────────────────────
export async function handleMessage(bot, msg) {
  if (!msg.text) return;

  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // Commands
  if (text === "/start") return handleStart(bot, msg);
  if (text === "/debate") return handleDebateCommand(bot, msg);
  if (text === "/reset") return handleReset(bot, msg);
  if (text === "/help") return handleHelp(bot, msg);

  const session = getSession(userId);

  // ── State: AWAITING_TOPIC ──────────────────────────────────────────────────
  if (session.state === STATE.AWAITING_TOPIC) {
    const topic = text;
    setSession(userId, { state: STATE.DEBATING, topic, history: [], turnCount: 0 });

    await bot.sendChatAction(chatId, "typing");

    try {
      const opening = await startDebate(topic);
      const history = [{ role: "assistant", content: opening }];
      setSession(userId, { history });
      await bot.sendMessage(chatId, opening, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("startDebate error:", err);
      await bot.sendMessage(chatId, "⚠️ Something went wrong starting the debate. Try /debate again.");
    }
    return;
  }

  // ── State: DEBATING ────────────────────────────────────────────────────────
  if (session.state === STATE.DEBATING) {
    // "Change topic" shortcut
    if (text.toLowerCase().includes("change topic")) {
      return handleDebateCommand(bot, msg);
    }

    await bot.sendChatAction(chatId, "typing");

    // Check if this is a feedback request
    const feedbackMode = isFeedbackRequest(text);

    // Build the user message — inject context for feedback requests
    let userMessage = text;
    if (feedbackMode) {
      userMessage = `[USER FEEDBACK REQUEST] The user wants a personal performance review for this debate session. Topic was: "${session.topic}". They've made ${session.turnCount} argument(s). Their last argument rating was ${session.rating ?? "not yet rated"}. Please analyze their overall performance this session: patterns, strengths, recurring weaknesses, and give 2–3 specific actionable coaching tips. Be an honest coach.`;
    }

    try {
      const reply = await askClaude(session.history, userMessage);

      // Update history (store original user text, not injected prompt)
      const updatedHistory = [
        ...session.history,
        { role: "user", content: text },
        { role: "assistant", content: reply },
      ];

      // Extract rating if present
      const rating = feedbackMode ? session.rating : (extractRating(reply) ?? session.rating);
      const turnCount = feedbackMode ? session.turnCount : session.turnCount + 1;

      setSession(userId, { history: updatedHistory, rating, turnCount });

      await bot.sendMessage(chatId, reply, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("askClaude error:", err);
      await bot.sendMessage(chatId, "⚠️ I hit an error processing that. Please try again.");
    }
    return;
  }

  // ── Default: not in a session ──────────────────────────────────────────────
  await bot.sendMessage(
    chatId,
    `👋 Use /debate to start a debate session, or /help to see commands.`
  );
}

// ─── Callback query handler (for future inline buttons) ───────────────────────
export async function handleCallbackQuery(bot, query) {
  await bot.answerCallbackQuery(query.id);
}
