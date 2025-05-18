import { Telegraf } from "telegraf";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
app.use(express.json());

let lastChatId = null;

// 🧠 Prompt Templates
const PERSONALITY_PROMPT_TEMPLATE = (message) => `
You're a sarcastic, chill friend in a Telegram group full of movie nerds. And you know everything about movies.
Reply with casual, witty, Gen-Z energy — not too long, not too rude.
Use the same language the message was sent in (Uzbek, English, whatever).
Swearing is fine, just keep it natural and playful.
No emojis unless it *really* fits. No Markdown. No formal tone.
Message you're replying to:
"${message}"
`;

const RANDOM_MESSAGE_PROMPT = `
Image you're in a chat group, you're just a real member of the chat and the group is film discussion group, you know everything about films.
you just keep alive the group, like an extravert person, just ask something like regular people, it shouldn't be too long, just a few words!
No emojis unless it *really* fits. No Markdown. No formal tone.
Just be a real person, like a friend.
You can ask about the latest movies, or just say something like "hey guys, what are you watching these days?" or "any recommendations for a good movie?" or "what's your favorite film of all time?" or "have you seen any good movies lately?" or "what's the best movie you've seen this month?" or "what's your favorite genre of film?" or "who's your favorite actor/actress?" or "what's the most underrated movie you've seen?" or "what's the most overrated movie you've seen?" or "what's the best movie you've seen this year?" or "what's the worst movie you've seen this year?"
`;

// 🤖 Gemini response
async function getAIResponse(userMessage = null) {
  const prompt = userMessage
    ? PERSONALITY_PROMPT_TEMPLATE(userMessage)
    : RANDOM_MESSAGE_PROMPT;

  try {
    const res = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
      }
    );

    return res.data.candidates?.[0]?.content?.parts?.[0]?.text || "😶";
  } catch (err) {
    console.error("❌ Gemini API error:", err.message);
    return "😶";
  }
}

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

  // Mention qilish uchun usernameni olamiz
  const user = ctx.from;
  const mention = user.username
    ? `@${user.username}`
    : `[${user.first_name}](tg://user?id=${user.id})`;

  const response = `${user.first_name} commented to the "${origin}" post, he/she said:\n${ctx.message.text}\nTo this post:"${repliedContent}"`;
  const aiReply = await getAIResponse(response);
  await ctx.reply(aiReply, {
    parse_mode: "Markdown",
    reply_to_message_id: msg.message_id, // reply qilib yuboradi
  });
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

  bot.launch();
  startRandomMessageSender();
  console.log("🤖 Bot launched via Telegraf");
});
