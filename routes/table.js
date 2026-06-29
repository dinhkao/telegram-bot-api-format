// Table content builders + helpers
// Load token from .env file
const { readFileSync } = require("fs");
const { resolve } = require("path");
const env = readFileSync(resolve(__dirname, "..", ".env"), "utf-8");
const TOKEN = env.match(/BOT_TOKEN=(.+)/)[1].trim();
const API = `https://api.telegram.org/bot${TOKEN}`;

async function call(method, body) {
  const r = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRank(score) {
  if (score >= 90) return "🥇";
  if (score >= 80) return "🥈";
  return "🥉";
}

function buildPopupTable(scores) {
  return `## 📊 Score Table

<details open>
<summary>📋 Click to toggle table</summary>

| # | 🏷️ Name | 📊 Score | ⭐ Rank | 🔗 Link |
|:--|:---------|:--------:|:-------:|:--------|
| 1 | **Alice** | ${scores[0]} | ${getRank(scores[0])} | [GitHub](https://github.com) |
| 2 | *Bob* | ${scores[1]} | ${getRank(scores[1])} | [Telegram](https://t.me) |
| 3 | Charlie | ${scores[2]} | ${getRank(scores[2])} | [Google](https://google.com) |
| 4 | Diana | ${scores[3]} | ${getRank(scores[3])} | [Docs](https://core.telegram.org) |

</details>

🎲 *Scores randomized!* Try again?`;
}

const keyboard = {
  inline_keyboard: [[{ text: "🎲 Random Scores", callback_data: "random_scores" }]],
};

// --- Command handlers ---

async function handleWhat(chatId) {
  const markdown = `| # | 🏷️ Name | 📊 Score | ⭐ Rank | 🔗 Link | 📝 Note |
|:--|:---------|:--------:|:-------:|:--------|:--------|
| 1 | **Alice** | 95 | 🥇 | [GitHub](https://github.com) | ~pending~ |
| 2 | *Bob* | 87 | 🥈 | [Telegram](https://t.me) | ==new== |
| 3 | Charlie | 92 | 🥇 | [Google](https://google.com) | \`active\` |
| 4 | Diana | 78 | 🥉 | [Docs](https://core.telegram.org) | ||spoiler|| |`;

  await call("sendRichMessage", { chat_id: chatId, rich_message: { markdown } });
}

async function handlePopup(chatId) {
  const scores = [rand(50, 100), rand(50, 100), rand(50, 100), rand(50, 100)];
  await call("sendRichMessage", {
    chat_id: chatId,
    rich_message: { markdown: buildPopupTable(scores) },
    reply_markup: keyboard,
  });
}

async function handleCallback(cb) {
  await call("answerCallbackQuery", { callback_query_id: cb.id });

  const chatId = cb.message.chat.id;
  const msgId = cb.message.message_id;
  const scores = [rand(50, 100), rand(50, 100), rand(50, 100), rand(50, 100)];

  await call("editMessageText", {
    chat_id: chatId,
    message_id: msgId,
    rich_message: { markdown: buildPopupTable(scores) },
    reply_markup: keyboard,
  });
}

module.exports = { handleWhat, handlePopup, handleCallback };
