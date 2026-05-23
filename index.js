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
// ENV CONFIG
// =========================
const API_KEY = process.env.API_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// =========================
// DISCORD CONFIG
// =========================
const GUILD_ID = "1428448696822927382";
const CHANNEL_ID = "1507806045752266813";

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
let statsMessage = null;

// =========================
// UPDATE LIVE MESSAGE
// =========================
async function updateStatsMessage() {

    if (!statsMessage) return;

    let output = "📊 **RZ SCRIPT STATS**\n\n";

    let total = 0;

    for (const [name, servers] of Object.entries(scripts)) {

        const count = Object.keys(servers).length;

        output += `🔹 ${name}: ${count} server\n`;

        total += count;
    }

    output += `\n📡 Total server: ${total}`;

    try {

        await statsMessage.edit(output);

    } catch (err) {

        console.error("Errore update stats:", err);

    }
}

// =========================
// PING FROM FIVE M
// =========================
app.post("/ping", async (req, res) => {

    const { serverId, script, key } = req.body;

    if (key !== API_KEY) {
        return res.sendStatus(401);
    }

    if (!scripts[script]) {
        scripts[script] = {};
    }

    // salva ultimo ping
    scripts[script][serverId] = Date.now();

    // update immediato
    updateStatsMessage();

    res.sendStatus(200);
});

// =========================
// CLEANUP OFFLINE SERVERS
// =========================
setInterval(() => {

    const now = Date.now();

    let changed = false;

    for (const script in scripts) {

        for (const serverId in scripts[script]) {

            // offline dopo 60 sec
            if (now - scripts[script][serverId] > 60000) {

                delete scripts[script][serverId];

                changed = true;
            }
        }

        // remove empty scripts
        if (Object.keys(scripts[script]).length === 0) {

            delete scripts[script];

            changed = true;
        }
    }

    // update solo se cambia qualcosa
    if (changed) {
        updateStatsMessage();
    }

}, 5000);

// =========================
// SLASH COMMANDS
// =========================
const commands = [

    new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Mostra statistiche script")
        .toJSON(),

    new SlashCommandBuilder()
        .setName("total")
        .setDescription("Mostra totale server")
        .toJSON()
];

// =========================
// REGISTER SLASH COMMANDS
// =========================
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {

    try {

        console.log("Registrazione slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),
            { body: commands }
        );

        console.log("Slash commands registrati!");

    } catch (err) {

        console.error("Errore slash commands:", err);

    }

})();

// =========================
// SLASH COMMAND HANDLER
// =========================
client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    // =========================
    // /stats
    // =========================
    if (interaction.commandName === "stats") {

        let output = "📊 RZ SCRIPT STATS\n\n";

        let total = 0;

        for (const [name, servers] of Object.entries(scripts)) {

            const count = Object.keys(servers).length;

            output += `🔹 ${name}: ${count} server\n`;

            total += count;
        }

        output += `\n📡 Total server: ${total}`;

        return interaction.reply({
            content: "```" + output + "```",
            ephemeral: false
        });
    }

    // =========================
    // /total
    // =========================
    if (interaction.commandName === "total") {

        let total = 0;

        for (const servers of Object.values(scripts)) {

            total += Object.keys(servers).length;
        }

        return interaction.reply(`📡 Total server: ${total}`);
    }
});

// =========================
// READY
// =========================
client.on("ready", async () => {

    console.log("Bot online:", client.user.tag);

    try {

        const channel = await client.channels.fetch(CHANNEL_ID);

        if (!channel) {
            console.log("Canale stats non trovato");
            return;
        }

        // crea messaggio iniziale
        statsMessage = await channel.send("📊 Avvio statistiche...");

        // update immediato
        updateStatsMessage();

    } catch (err) {

        console.error("Errore canale:", err);

    }
});

// =========================
// START EXPRESS API
// =========================
app.listen(3000, () => {

    console.log("API online sulla porta 3000");

});

// =========================
// LOGIN
// =========================
client.login(DISCORD_TOKEN);
