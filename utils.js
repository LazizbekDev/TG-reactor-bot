import axios from "axios";

export const getAIReactionForMessage = async (text) =>  {
  const prompt = `Based on the tone and vibe of the following message, reply with the most suitable emoji from this list only: 😂, 😢, 🤯, 🔥, 💀, 👏, 👎, 😡, 🥱, 💔, 🤔.\n\nMessage: "${text}"\n\nOnly return the emoji.`;

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

    const emoji = res.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return emoji || "🤔";
  } catch (err) {
    console.error("AI reaction error:", err.message);
    return "🤔";
  }
}

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

export const getAIResponse = async (userMessage = null) => {
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
};
