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
// ENV
// =========================
const API_KEY = process.env.API_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// =========================
// DISCORD SETTINGS
// =========================
const GUILD_ID = "1428448696822927382";
const CHANNEL_ID = "1507806045752266813";

// =========================
// CLIENT
// =========================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// =========================
// STORAGE
// =========================
let scripts = {};
let statsMessage = null;
let statsChannel = null;

// =========================
// BUILD STATS TEXT
// =========================
function buildStats() {

    let output = "📊 RZ SCRIPT STATS\n\n";

    for (const [name, servers] of Object.entries(scripts)) {

        const count = Object.keys(servers).length;

        output += `🔹 ${name}: ${count} server\n`;
    }

    return output;
}

// =========================
// PING FROM FIVE M
// =========================
app.post("/ping", (req, res) => {

    const { serverId, script, key } = req.body;

    if (key !== API_KEY) {
        return res.sendStatus(401);
    }

    if (!scripts[script]) {
        scripts[script] = {};
    }

    scripts[script][serverId] = Date.now();

    res.sendStatus(200);
});

// =========================
// CLEANUP OFFLINE
// =========================
setInterval(() => {

    const now = Date.now();

    for (const script in scripts) {

        for (const serverId in scripts[script]) {

            if (now - scripts[script][serverId] > 60000) {
                delete scripts[script][serverId];
            }
        }

        if (Object.keys(scripts[script]).length === 0) {
            delete scripts[script];
        }
    }

}, 5000);

// =========================
// SLASH COMMANDS
// =========================
const commands = [

    new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Mostra statistiche script")
        .toJSON()
];

// =========================
// REGISTER SLASH
// =========================
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {

    try {

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log("Slash commands registrati!");

    } catch (err) {
        console.error(err);
    }

})();

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "stats") {

        return interaction.reply({
            content: "```" + buildStats() + "```",
            ephemeral: false
        });
    }
});

// =========================
// READY + MESSAGE LOOP
// =========================
client.on("ready", async () => {

    console.log("Bot online:", client.user.tag);

    statsChannel = await client.channels.fetch(CHANNEL_ID);

    if (!statsChannel) {
        console.log("Canale non trovato");
        return;
    }

    async function refreshMessage() {

        try {

            if (statsMessage) {
                await statsMessage.delete().catch(() => {});
            }

            statsMessage = await statsChannel.send(buildStats());

        } catch (err) {
            console.error("Errore refresh message:", err);
        }
    }

    await refreshMessage();
    setInterval(refreshMessage, 60000);
});

// =========================
// EXPRESS
// =========================
app.listen(3000, () => {
    console.log("API online sulla porta 3000");
});

// =========================
// LOGIN
// =========================
client.login(DISCORD_TOKEN);
