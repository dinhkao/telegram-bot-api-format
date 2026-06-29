const { handleWhat, handlePopup, handleCallback } = require("./routes/table");

const { readFileSync } = require("fs");
const env = readFileSync(".env", "utf-8");
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
  const cmd = (msg.text || "").trim().toLowerCase();

  if (cmd === "what") return handleWhat(chatId);
  if (cmd === "popup") return handlePopup(chatId);

  await call("sendMessage", {
    chat_id: chatId,
    text: '🤖 Commands:\n• *what* — full table\n• *popup* — table with random button',
    parse_mode: "MarkdownV2",
  });
}

async function main() {
  console.log("🤖 Bot started! Waiting for messages...");

  const init = await call("getUpdates", { offset: -1 });
  let offset = 0;
  if (init.ok && init.result.length > 0) {
    offset = init.result[init.result.length - 1].update_id + 1;
  }

  while (true) {
    try {
      const res = await getUpdates(offset);
      if (!res.ok || !res.result.length) continue;

      for (const u of res.result) {
        offset = u.update_id + 1;
        if (u.message) await handleMessage(u.message);
        if (u.callback_query) await handleCallback(u.callback_query);
      }
    } catch (err) {
      console.error("Error:", err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main();
