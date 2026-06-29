// Load token from .env file
const { readFileSync } = require("fs");
const { resolve } = require("path");
const env = readFileSync(resolve(__dirname, ".env"), "utf-8");
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

async function getUpdates(offset) {
  const r = await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`);
  return r.json();
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  const cmd = text.trim().toLowerCase();

  if (cmd === "what") {
    // Rich Markdown table with header + inline formatting showcase
    const markdown = `| # | 🏷️ Name | 📊 Score | ⭐ Rank | 🔗 Link | 📝 Note |
|:--|:---------|:--------:|:-------:|:--------|:--------|
| 1 | **Alice** | 95 | 🥇 | [GitHub](https://github.com) | ~pending~ |
| 2 | *Bob* | 87 | 🥈 | [Telegram](https://t.me) | ==new== |
| 3 | Charlie | 92 | 🥇 | [Google](https://google.com) | \`active\` |
| 4 | Diana | 78 | 🥉 | [Docs](https://core.telegram.org) | ||spoiler|| |`;

    await call("sendRichMessage", {
      chat_id: chatId,
      rich_message: { markdown },
    });
  } else if (cmd === "popup") {
    // Table inside collapsible <details> block – acts like a popup
    const markdown = `## 📊 Score Table

<details open>
<summary>📋 Click to toggle table</summary>

| # | 🏷️ Name | 📊 Score | ⭐ Rank | 🔗 Link |
|:--|:---------|:--------:|:-------:|:--------|
| 1 | **Alice** | 95 | 🥇 | [GitHub](https://github.com) |
| 2 | *Bob* | 87 | 🥈 | [Telegram](https://t.me) |
| 3 | Charlie | 92 | 🥇 | [Google](https://google.com) |
| 4 | Diana | 78 | 🥉 | [Docs](https://core.telegram.org) |

</details>

💡 _Table hidden inside collapsible block — click to expand!_`;

    await call("sendRichMessage", {
      chat_id: chatId,
      rich_message: { markdown },
    });
  } else {
    // Reply with plain text for anything else
    await call("sendMessage", {
      chat_id: chatId,
      text: '🤖 Commands:\n• *what* — full table\n• *popup* — table in collapsible block',
      parse_mode: "MarkdownV2",
    });
  }
}

async function main() {
  console.log("🤖 Bot started! Waiting for messages...");

  // Clear pending updates
  const init = await call("getUpdates", { offset: -1 });
  let offset = 0;
  if (init.ok && init.result.length > 0) {
    offset = init.result[init.result.length - 1].update_id + 1;
  }

  while (true) {
    try {
      const res = await getUpdates(offset);
      if (res.ok && res.result.length > 0) {
        for (const update of res.result) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleMessage(update.message);
          }
        }
      }
    } catch (err) {
      console.error("Error:", err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main();
