const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const app = express();
app.use(express.json());

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let servers = new Set();
const API_KEY = "RZ-SCRIPT_SECRET";

app.post("/ping", (req, res) => {
    if (req.body.key !== API_KEY) return res.sendStatus(401);

    servers.add(req.body.serverId);

    setTimeout(() => {
        servers.delete(req.body.serverId);
    }, 60000);

    res.sendStatus(200);
});

client.on("ready", () => {
    console.log("Bot online");
});

client.on("messageCreate", msg => {
    if (msg.content === "!servers") {
        msg.reply("Server attivi: " + servers.size);
    }
});

app.listen(3000);
client.login("MTUwNzc5MDc3MjQyOTEyNzg2MQ.GI-pfz.D6_O7wJKrsldUpT9RX1THUQr6gl95q5HAQD9nM");
