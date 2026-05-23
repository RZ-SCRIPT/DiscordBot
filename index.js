const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const app = express();
app.use(express.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const API_KEY = "RZ-SCRIPT_SECRET";

// 🔴 storage multi-script
let scripts = {};

// =========================
// PING FROM FIVE M
// =========================
app.post("/ping", (req, res) => {
    const { serverId, script, key } = req.body;

    if (key !== API_KEY) return res.sendStatus(401);

    if (!scripts[script]) {
        scripts[script] = new Set();
    }

    scripts[script].add(serverId);

    // timeout 60 sec inactivity
    setTimeout(() => {
        scripts[script].delete(serverId);
    }, 60000);

    res.sendStatus(200);
});

// =========================
// DISCORD COMMAND
// =========================
client.on("scriptonline", msg => {

    if (msg.content === "!stats") {

        let output = "📊 RZ SCRIPT STATS\n\n";

        for (const [name, set] of Object.entries(scripts)) {
            output += `${name}: ${set.size} server\n`;
        }

        msg.reply("```\n" + output + "```");
    }

    if (msg.content === "!total") {
        let total = 0;

        for (const set of Object.values(scripts)) {
            total += set.size;
        }

        msg.reply("Server totali attivi: " + total);
    }
});

client.on("ready", () => {
    console.log("Bot online: " + client.user.tag);
});

// =========================
// START SERVER
// =========================
app.listen(3000, () => {
    console.log("API online sulla porta 3000");
});

client.login("MTUwNzc5MDc3MjQyOTEyNzg2MQ.GI-pfz.D6_O7wJKrsldUpT9RX1THUQr6gl95q5HAQD9nM");
