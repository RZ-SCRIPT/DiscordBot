const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder 
} = require("discord.js");

const express = require("express");

const app = express();
app.use(express.json());

// =========================
// CONFIG (USA ENV SU RENDER)
// =========================
const API_KEY = process.env.API_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// =========================
// DISCORD CLIENT
// =========================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// =========================
// STORAGE
// =========================
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

    // rimuove dopo 60s inattività
    setTimeout(() => {
        scripts[script].delete(serverId);
    }, 60000);

    res.sendStatus(200);
});

// =========================
// SLASH COMMAND REGISTRATION
// =========================
const commands = [
    new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Mostra server attivi per ogni script")
        .toJSON(),

    new SlashCommandBuilder()
        .setName("total")
        .setDescription("Mostra totale server attivi")
        .toJSON()
];

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log("Registrazione slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, "1428448696822927382")
            { body: commands }
        );

        console.log("Slash commands registrati!");
    } catch (err) {
        console.error(err);
    }
})();

// =========================
// SLASH COMMAND HANDLER
// =========================
client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    // /stats
    if (interaction.commandName === "stats") {

        let output = "📊 RZ SCRIPT STATS\n\n";

        for (const [name, set] of Object.entries(scripts)) {
            output += `${name}: ${set.size} server\n`;
        }

        return interaction.reply("```\n" + output + "```");
    }

    // /total
    if (interaction.commandName === "total") {

        let total = 0;

        for (const set of Object.values(scripts)) {
            total += set.size;
        }

        return interaction.reply(`Server totali attivi: ${total}`);
    }
});

// =========================
// READY
// =========================
client.on("ready", () => {
    console.log("Bot online: " + client.user.tag);
});

// =========================
// API START
// =========================
app.listen(3000, () => {
    console.log("API online sulla porta 3000");
});

// =========================
// LOGIN
// =========================
client.login(DISCORD_TOKEN);
