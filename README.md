# 🎯 DebateMind — AI Debate Partner Bot

A Telegram bot powered by Claude (Anthropic) that acts as a sharp, third-person debate judge. It challenges your arguments, exposes logical flaws, rates your reasoning on a 1–10 scale, and gives personalized coaching feedback.

---

## Features

- **Argument Rating (1–10)** — Every argument gets scored with an explanation
- **Devil's Advocate Questions** — One sharp follow-up question per round
- **Personal Feedback Mode** — Ask "give me feedback" anytime for a full session review
- **Conversation Memory** — Remembers the full debate context within a session
- **Topic Flexibility** — Any topic: politics, ethics, science, philosophy, everyday life

---

## Project Structure

```
debate-bot/
├── src/
│   ├── bot.js        # Entry point — starts the Telegram bot
│   ├── config.js     # Environment variables and constants
│   ├── session.js    # Per-user session store (in-memory)
│   ├── ai.js         # Claude API calls and system prompt
│   └── handlers.js   # All message and command logic
├── .env.example      # Copy this to .env and fill in your keys
├── .gitignore
└── package.json
```

---

## Setup

### 1. Prerequisites
- Node.js v18+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Open `.env` and fill in:
```
TELEGRAM_TOKEN=your_telegram_bot_token
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Run the bot
```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

---

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and intro |
| `/debate` | Start a new debate session |
| `/reset` | Clear session, start fresh |
| `/help` | Show all commands |

**During a debate:**
- Type any argument naturally
- Say `"give me feedback"` or `"rate my performance"` → personal coaching review
- Say `"change topic"` → switch to a new topic
- Use `/reset` to wipe everything

---

## How the Rating Works

| Score | Meaning |
|-------|---------|
| 1–3 | Assertion without reasoning or heavily fallacious |
| 4–5 | Basic reasoning present but significant gaps |
| 6–7 | Solid argument with some vulnerabilities |
| 8–9 | Well-structured, handles counterarguments |
| 10 | Near-flawless — precise, nuanced, anticipates rebuttals |

---

## Deployment (Optional)

To keep the bot running 24/7, deploy to any Node.js host:

**Railway (easiest):**
1. Push code to GitHub
2. Create project on [railway.app](https://railway.app)
3. Add `TELEGRAM_TOKEN` and `ANTHROPIC_API_KEY` as environment variables
4. Deploy — done

**VPS (e.g. DigitalOcean):**
```bash
npm install -g pm2
pm2 start src/bot.js --name debatemind
pm2 save
pm2 startup
```

---

## Notes

- Sessions are stored in-memory. Restarting the bot clears all sessions.
- For persistent sessions across restarts, replace `session.js` with a Redis or SQLite store.
- The bot uses long-polling (no webhook needed for local/VPS deployment).
