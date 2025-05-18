import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import express from "express";
import { getAIReactionForMessage, getAIResponse } from "./utils.js";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
app.use(express.json());

let lastChatId = null;

// 🤖 Gemini response

bot.start((ctx) => {
  ctx.reply("🤖 Heyy, wanna talk with me?");
  console.log("🤖 Bot started by user:", ctx.from.username);
});

// 💬 Reply on trigger
bot.on("message", async (ctx) => {
  const msg = ctx.message;
  const replied = msg.reply_to_message;

  if (!replied) return; // Faqat reply qilingan xabarlar

  let origin = null;
  if (replied.from) {
    origin = replied.from.username || replied.from.first_name;
  } else if (replied.sender_chat) {
    origin = replied.sender_chat.title || replied.sender_chat.username;
  }

  const repliedContent = replied.text || replied.caption || "[media]";

  const user = ctx.from;
  const response = `${user.first_name} commented to the "${origin}" post, he/she said:\n${ctx.message.text}\nTo this post:"${repliedContent}"`;

  const aiReply = await getAIResponse(response);

  await ctx.reply(aiReply, {
    parse_mode: "Markdown",
    reply_to_message_id: msg.message_id,
  });

  // ✅ Bu yerda chatId va messageId'ni aniq qilib olish kerak:
  const chatId = ctx.chat.id;
  const messageId = ctx.message.message_id;

  const emoji = await getAIReactionForMessage(ctx.message.text);

  if (emoji) {
    const validEmojis = [
      "😂",
      "😢",
      "🤯",
      "🔥",
      "💀",
      "👏",
      "👎",
      "😡",
      "🥱",
      "💔",
      "🤔",
    ];
    const safeEmoji = validEmojis.includes(emoji) ? emoji : "🤔";
    console.log("AI chose:", emoji, "| Using:", safeEmoji);
    try {
      await ctx.telegram.setMessageReaction(chatId, messageId, [{
        type: "emoji",
        emoji: safeEmoji,
      }]);
      console.log("✅ Reaction sent:", safeEmoji);
    } catch (err) {
      console.error("❌ Reaction error:", err.response?.data || err.message);
    }
  }
});

// 🔁 Auto random reply every 5–10 hours
function startRandomMessageSender() {
  const scheduleNext = async () => {
    const timeout =
      Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 60 * 1000;
    setTimeout(async () => {
      if (lastChatId) {
        const msg = await getAIResponse();
        bot.telegram.sendMessage(lastChatId, msg);
      }
      scheduleNext(); // repeat
    }, timeout);
  };

  scheduleNext();
}

// 🌐 Optional express endpoint
app.get("/", (req, res) => {
  res.send("🤖 Bot is running...");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("🌐 Server is live...");
});

// 🚀 Start the bot
bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;
  console.log("🤖 Bot username:", botInfo.username);

  bot.launch({ allowedUpdates: ["message", "message_reaction"]});
  startRandomMessageSender();
  console.log("🤖 Bot launched via Telegraf");
});
