import TelegramBot from "node-telegram-bot-api";
import { handleMessage, handleCallbackQuery } from "./handlers.js";
import { TELEGRAM_TOKEN } from "./config.js";

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log("🎯 DebateMind Bot is live...");

bot.on("message", (msg) => handleMessage(bot, msg));
bot.on("callback_query", (query) => handleCallbackQuery(bot, query));

bot.on("polling_error", (err) => console.error("Polling error:", err.message));
