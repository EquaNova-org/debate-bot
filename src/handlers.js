import {
  getSession, setSession, resetDebate, resetSession,
  awardXP, logWeakness, logRating, getProgressSummary,
} from "./session.js";
import { askClaude, startDebate, extractRating, extractWeaknesses } from "./ai.js";
import { STATE, MODE, MODE_INFO, getRank, getNextRank, XP_AWARDS } from "./config.js";

// ─── Feedback trigger keywords ────────────────────────────────────────────────
const FEEDBACK_TRIGGERS = [
  "give me feedback", "feedback please", "my feedback", "rate me",
  "rate my performance", "how am i doing", "what do you think of my performance",
  "overall feedback", "how did i do", "assess me", "coach me",
];

function isFeedbackRequest(text) {
  return FEEDBACK_TRIGGERS.some((kw) => text.toLowerCase().includes(kw));
}

// ─── XP notification message ──────────────────────────────────────────────────
function buildXPMessage(result, bonusXP = 0) {
  let msg = `\n\n✨ *+${XP_AWARDS.ARGUMENT_SUBMITTED + bonusXP} XP* earned!`;
  msg += ` Total: *${result.newXP} XP* — ${result.newRank.name}`;
  if (result.rankedUp) {
    msg += `\n\n🎉 *RANK UP!* You advanced from ${result.oldRank.name} to *${result.newRank.name}*! Keep going!`;
  }
  const nextRank = getNextRank(result.newXP);
  if (nextRank) {
    const xpNeeded = nextRank.minXP - result.newXP;
    msg += `\n📈 *${xpNeeded} XP* to reach ${nextRank.name}`;
  }
  return msg;
}

// ─── Mode selection keyboard ──────────────────────────────────────────────────
function getModeKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "⚖️ Standard Debate", callback_data: `mode_${MODE.STANDARD}` }],
      [{ text: "🏛️ Judge Simulation", callback_data: `mode_${MODE.JUDGE}` }],
      [{ text: "⏱️ Time-Pressure Rounds", callback_data: `mode_${MODE.TIME_PRESSURE}` }],
      [{ text: "🔄 Rebuttal-Only Practice", callback_data: `mode_${MODE.REBUTTAL}` }],
      [{ text: "🎯 Cross-Examination Trainer", callback_data: `mode_${MODE.CROSS_EXAM}` }],
    ],
  };
}

// ─── /start ───────────────────────────────────────────────────────────────────
async function handleStart(bot, msg) {
  const userId = msg.from.id;
  resetSession(userId);

  const welcome = `🎯 *Welcome to DebateMind*

I'm your AI-driven debate partner and coach — built to challenge your arguments, expose your blind spots, and make you a sharper thinker.

*What I do:*
• Rate your arguments from *1–10*
• Hit you with devil's advocate questions every round
• Track your weaknesses and help you fix them
• Award *XP* and *ranks* as you improve
• Run 5 different debate training modes

*Ranks you can earn:*
🥉 Novice → 📚 Apprentice → 🗣️ Debater → ⚔️ Challenger → 🏆 Advocate → 🌟 Master Debater → 👑 Grand Champion

Use /debate to start training.
Use /progress to see your stats.
Use /help to see all commands.`;

  await bot.sendMessage(msg.chat.id, welcome, { parse_mode: "Markdown" });
}

// ─── /debate ──────────────────────────────────────────────────────────────────
async function handleDebateCommand(bot, msg) {
  const userId = msg.from.id;
  resetDebate(userId);
  setSession(userId, { state: STATE.AWAITING_TOPIC });

  await bot.sendMessage(
    msg.chat.id,
    `🧠 *What topic do you want to debate?*\n\nType any topic — political, philosophical, ethical, scientific, everyday.\n\n_Example: "AI will replace most human jobs" or "Social media does more harm than good"_`,
    { parse_mode: "Markdown" }
  );
}

// ─── /progress ────────────────────────────────────────────────────────────────
async function handleProgress(bot, msg) {
  const userId = msg.from.id;
  const { rank, nextRank, avgRating, topWeaknesses, xp, debatesCompleted } = getProgressSummary(userId);

  let text = `📊 *Your DebateMind Progress*\n\n`;
  text += `🏅 *Rank:* ${rank.name}\n`;
  text += `⚡ *XP:* ${xp}`;
  if (nextRank) text += ` _(${nextRank.minXP - xp} XP to ${nextRank.name})_`;
  text += `\n📈 *Avg Argument Rating:* ${avgRating}/10\n`;
  text += `🗣️ *Debates Completed:* ${debatesCompleted}\n`;

  if (topWeaknesses.length > 0) {
    text += `\n⚠️ *Your Top Weaknesses:*\n${topWeaknesses.join("\n")}`;
    text += `\n\n💡 _Focus on these in your next session._`;
  } else {
    text += `\n✅ No weaknesses tracked yet — start debating!`;
  }

  await bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
}

// ─── /modes ───────────────────────────────────────────────────────────────────
async function handleModes(bot, msg) {
  let text = `🎮 *Debate Training Modes*\n\n`;
  for (const [, info] of Object.entries(MODE_INFO)) {
    text += `${info.label}\n_${info.description}_\n\n`;
  }
  text += `Use /debate to pick a topic, then choose your mode.`;
  await bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
}

// ─── /reset ───────────────────────────────────────────────────────────────────
async function handleReset(bot, msg) {
  const userId = msg.from.id;
  resetSession(userId);
  await bot.sendMessage(msg.chat.id, `🔄 Full reset done — XP and progress cleared.\nUse /debate to start fresh.`);
}

// ─── /help ────────────────────────────────────────────────────────────────────
async function handleHelp(bot, msg) {
  const help = `📖 *DebateMind Commands*

/start — Welcome & intro
/debate — Start a new debate session
/progress — View your XP, rank, and weaknesses
/modes — See all training modes explained
/reset — Wipe all progress and start over
/help — This menu

*During a debate:*
• Type your argument naturally
• Say *"give me feedback"* for a full coaching review
• Say *"change topic"* to switch topics
• Use /debate to start a new session

*How XP works:*
• +5 XP per argument submitted
• Bonus XP based on your rating (higher score = more XP)
• +10 XP for requesting feedback
• +20 XP for completing a special mode session`;

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
  if (text === "/progress") return handleProgress(bot, msg);
  if (text === "/modes") return handleModes(bot, msg);
  if (text === "/reset") return handleReset(bot, msg);
  if (text === "/help") return handleHelp(bot, msg);

  const session = getSession(userId);

  // ── AWAITING_TOPIC ─────────────────────────────────────────────────────────
  if (session.state === STATE.AWAITING_TOPIC) {
    setSession(userId, { topic: text, state: STATE.AWAITING_MODE });

    await bot.sendMessage(
      chatId,
      `✅ Topic set: *${text}*\n\nNow choose your training mode:`,
      { parse_mode: "Markdown", reply_markup: getModeKeyboard() }
    );
    return;
  }

  // ── DEBATING ───────────────────────────────────────────────────────────────
  if (session.state === STATE.DEBATING) {
    if (text.toLowerCase().includes("change topic")) {
      return handleDebateCommand(bot, msg);
    }

    // ── Time pressure check ──────────────────────────────────────────────────
    if (session.mode === MODE.TIME_PRESSURE && session.timePressureDeadline) {
      const now = Date.now();
      if (now > session.timePressureDeadline) {
        await bot.sendMessage(
          chatId,
          `⏰ *Time's up!* You went over 60 seconds.\n\nI'll still evaluate your argument, but time discipline is part of this mode. Stay sharp next round!`,
          { parse_mode: "Markdown" }
        );
      }
    }

    await bot.sendChatAction(chatId, "typing");

    const feedbackMode = isFeedbackRequest(text);

    let userMessage = text;
    if (feedbackMode) {
      const { rank, avgRating, topWeaknesses } = getProgressSummary(userId);
      userMessage = `[PERSONAL FEEDBACK REQUEST]
Topic debated: "${session.topic}"
Mode used: ${session.mode}
Arguments submitted: ${session.turnCount}
Average rating so far: ${avgRating}/10
Current rank: ${rank.name}
Top weaknesses identified: ${topWeaknesses.join(", ") || "none yet"}
Ratings history: ${getSession(userId).ratingsHistory.join(", ") || "none"}

Please give a full personal coaching review based on this session.`;
    }

    try {
      const reply = await askClaude(session.history, userMessage, session.mode, feedbackMode);

      const updatedHistory = [
        ...session.history,
        { role: "user", content: text },
        { role: "assistant", content: reply },
      ];

      let xpMessage = "";

      if (feedbackMode) {
        const result = awardXP(userId, XP_AWARDS.FEEDBACK_REQUESTED);
        xpMessage = `\n\n✨ *+${XP_AWARDS.FEEDBACK_REQUESTED} XP* for requesting feedback! Total: *${result.newXP} XP*`;
        setSession(userId, { history: updatedHistory });
      } else {
        const rating = extractRating(reply);
        const weaknesses = extractWeaknesses(reply);

        if (rating !== null) {
          logRating(userId, rating);
          const bonusXP = XP_AWARDS.RATING_BONUS(rating);
          const totalXP = XP_AWARDS.ARGUMENT_SUBMITTED + bonusXP;
          const result = awardXP(userId, totalXP);
          xpMessage = buildXPMessage(result, bonusXP);
        } else {
          const result = awardXP(userId, XP_AWARDS.ARGUMENT_SUBMITTED);
          xpMessage = buildXPMessage(result, 0);
        }

        weaknesses.forEach((w) => logWeakness(userId, w));

        const newTurnCount = session.turnCount + 1;

        // Set next time-pressure deadline
        const newDeadline = session.mode === MODE.TIME_PRESSURE ? Date.now() + 60000 : null;

        setSession(userId, {
          history: updatedHistory,
          turnCount: newTurnCount,
          timePressureDeadline: newDeadline,
        });
      }

      await bot.sendMessage(chatId, reply, { parse_mode: "Markdown" });

      if (xpMessage) {
        await bot.sendMessage(chatId, xpMessage, { parse_mode: "Markdown" });
      }

      // Time pressure: notify of next round timer
      if (session.mode === MODE.TIME_PRESSURE && !feedbackMode) {
        await bot.sendMessage(chatId, `⏱️ *60 seconds on the clock.* Type your next argument!`, { parse_mode: "Markdown" });
      }

    } catch (err) {
      console.error("askClaude error:", err);
      await bot.sendMessage(chatId, "⚠️ Something went wrong. Please try again.");
    }
    return;
  }

  // ── Default ────────────────────────────────────────────────────────────────
  await bot.sendMessage(chatId, `👋 Use /debate to start a session or /help to see all commands.`);
}

// ─── Callback query handler (mode selection) ──────────────────────────────────
export async function handleCallbackQuery(bot, query) {
  await bot.answerCallbackQuery(query.id);

  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith("mode_")) {
    const selectedMode = data.replace("mode_", "");
    const session = getSession(userId);

    if (!session.topic) {
      await bot.sendMessage(chatId, "⚠️ No topic set. Use /debate to start.");
      return;
    }

    const modeInfo = MODE_INFO[selectedMode];
    setSession(userId, {
      state: STATE.DEBATING,
      mode: selectedMode,
      history: [],
      turnCount: 0,
    });

    await bot.sendMessage(
      chatId,
      `${modeInfo.emoji} *${modeInfo.label} activated*\n_${modeInfo.description}_\n\n🔥 Topic: *${session.topic}*\n\nStarting your session...`,
      { parse_mode: "Markdown" }
    );

    await bot.sendChatAction(chatId, "typing");

    try {
      const opening = await startDebate(session.topic, selectedMode);
      const history = [{ role: "assistant", content: opening }];

      // Start timer for time pressure
      const deadline = selectedMode === MODE.TIME_PRESSURE ? Date.now() + 60000 : null;
      setSession(userId, { history, timePressureDeadline: deadline });

      await bot.sendMessage(chatId, opening, { parse_mode: "Markdown" });

      if (selectedMode === MODE.TIME_PRESSURE) {
        await bot.sendMessage(chatId, `⏱️ *Your 60 seconds start NOW!*`, { parse_mode: "Markdown" });
      }
    } catch (err) {
      console.error("startDebate error:", err);
      await bot.sendMessage(chatId, "⚠️ Something went wrong starting the debate. Try /debate again.");
    }
  }
}
